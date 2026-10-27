# api/views/inventory_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  # ← changed
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.db import transaction
from django.db.models import Q
from typing import Any
from collections import defaultdict
from ..models import InventoryItem, RestockRequest, InventoryTransaction, Staff, Notification, Branch
from ..serializers.inventory_serializer import InventoryItemSerializer
from ..serializers.restock_serializer import RestockRequestSerializer
from ..serializers.inventory_transaction_serializer import InventoryTransactionSerializer

# Roles that can READ inventory (for POS + admin dashboard)
READ_ROLES  = ["super_admin", "Admin", "Business Owner", "Branch Manager", "Staff", "Inventory", "Inventory Manager"]
# Roles that can WRITE inventory
WRITE_ROLES = ["super_admin", "Inventory Manager", "Staff", "Inventory", "Branch Manager", "Admin"]
RESTOCK_REQUEST_ROLES = ["super_admin", "Business Owner", "Branch Manager", "Staff", "Inventory", "Inventory Manager"]

ROLE_NORMALIZATION = {
    "Super Admin":    "super_admin",
    "super_admin":    "super_admin",
    "Admin":          "Admin",
    "Business Owner": "Business Owner",
    "Branch Manager": "Branch Manager",
    "Staff":          "Staff",
    "Employee":       "Employee",
    "Inventory":      "Inventory",
    "Inventory Manager": "Inventory Manager",
}

def normalize_staff_role(role):
    if not role:
        return None
    return ROLE_NORMALIZATION.get(str(role).strip(), role)


def get_staff_role(request):
    try:
        return normalize_staff_role(request.user.staff_profile.role)
    except Exception:
        return None


def _next_branch_sku(base_sku, branch_id):
    candidate = f"{base_sku}-B{branch_id}"
    if not InventoryItem.objects.filter(sku=candidate).exists():
        return candidate
    n = 2
    while True:
        numbered = f"{candidate}-{n}"
        if not InventoryItem.objects.filter(sku=numbered).exists():
            return numbered
        n += 1


def _log_inventory_transaction(
    *,
    inventory_item=None,
    action_type="update",
    quantity_before=None,
    quantity_after=None,
    quantity_changed=0,
    branch_name="",
    target_branch_name="",
    performed_by=None,
    notes="",
):
    InventoryTransaction.objects.create(
        inventory_item=inventory_item,
        action_type=action_type,
        quantity_before=quantity_before,
        quantity_after=quantity_after,
        quantity_changed=quantity_changed,
        branch_name=branch_name or "",
        target_branch_name=target_branch_name or "",
        performed_by=performed_by,
        notes=notes or "",
    )


def _notify_roles(*, roles, title, message, branch_id=None, notification_type="inventory", target_path=""):
    recipients = Staff.objects.filter(role__in=roles, status="Active").select_related("user")
    if branch_id is not None:
        recipients = recipients.filter(branch_id=branch_id)

    notifications = []
    for staff_member in recipients:
        if not getattr(staff_member, "user_id", None):
            continue
        notifications.append(
            Notification(
                user_id=staff_member.user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                target_path=target_path,
            )
        )

    if notifications:
        Notification.objects.bulk_create(notifications)


def check_and_notify_low_stock(item):
    """
    Checks if an inventory item has reached or dropped below minimum_qty (or <= 0).
    Alerts Inventory Manager, Central Inventory, and Super Admin.
    Deduplicates to prevent duplicate spam within 24 hours for the same item.
    """
    if not item or not getattr(item, "is_active", True):
        return False

    qty = item.quantity or 0
    min_qty = item.minimum_qty or 0

    if qty > min_qty and qty > 0:
        return False

    # Check for duplicate unread alert within 24 hours
    since = timezone.now() - timedelta(hours=24)
    already_notified = Notification.objects.filter(
        notification_type="inventory",
        is_read=False,
        title__icontains=item.name,
        created_at__gte=since,
    ).exists()

    if already_notified:
        return False

    branch_name = item.branch.name if item.branch else "Main Warehouse (Saranay)"
    is_out_of_stock = qty <= 0
    status_label = "OUT OF STOCK" if is_out_of_stock else "LOW STOCK"
    title = f"{'Out of Stock' if is_out_of_stock else 'Low Stock'}: {item.name} ({branch_name})"
    message = (
        f"Inventory alert: '{item.name}' (SKU: {item.sku}) at {branch_name} has {qty} units remaining "
        f"(minimum reorder level: {min_qty}). Status: {status_label}."
    )

    _notify_roles(
        roles=["Inventory Manager", "Inventory", "super_admin"],
        title=title,
        message=message,
        notification_type="inventory",
        target_path="/inventory/alerts" if item.branch_id else "/inventory-manager/inventory",
    )
    return True


class InventoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]  # ← was IsAdminUser

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        category   = request.query_params.get("category")
        branch     = request.query_params.get("branch")
        branch_id  = request.query_params.get("branch_id")
        search     = request.query_params.get("search")
        inv_status = request.query_params.get("status")
        archived   = request.query_params.get("archived")
        ordering   = request.query_params.get("ordering") or request.query_params.get("sort_by")

        requester_staff = getattr(request.user, "staff_profile", None)
        qs = InventoryItem.objects.select_related("branch").all()

        # Global roles can view inventory across branches; branch-scoped roles stay restricted.
        is_central_inventory = role in ["Inventory Manager", "Inventory"] and (
            not requester_staff
            or not requester_staff.branch_id
            or str(getattr(requester_staff, "branch_name", "")).strip() in [
                "Central Warehouse", "Central Head Office", "Central", "Main Warehouse", "Main Warehouse (Saranay)", ""
            ]
            or (role == "Inventory Manager" and getattr(requester_staff, "branch_id", None) == 3)
            or (role == "Inventory Manager" and "saranay" in str(getattr(requester_staff, "branch_name", "")).lower())
        )
        global_roles = {"super_admin", "Admin", "Business Owner", "Inventory Manager"}
        if requester_staff and role not in global_roles and not is_central_inventory:
            if requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()
        if category:
            qs = qs.filter(category=category)
        if branch_id:
            if str(branch_id).lower() in ["central", "0", "null", "none", "main", "main_warehouse"]:
                qs = qs.filter(branch__isnull=True)
            elif str(branch_id).isdigit():
                qs = qs.filter(branch_id=int(branch_id))
        if branch:
            if branch in ["Central", "Central Warehouse", "Central Inventory", "Main Warehouse", "Main Warehouse (Saranay)", "Saranay Main Warehouse"]:
                qs = qs.filter(branch__isnull=True)
            elif str(branch).isdigit():
                qs = qs.filter(branch_id=int(branch))
            else:
                qs = qs.filter(branch__name=branch)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search) | Q(category__icontains=search))
        if archived == "true":
            qs = qs.filter(is_active=False)
        else:
            qs = qs.filter(is_active=True)

        allowed_orderings = {
            "name": "name",
            "-name": "-name",
            "quantity": "quantity",
            "-quantity": "-quantity",
            "price": "price",
            "-price": "-price",
            "category": "category",
            "-category": "-category",
            "sku": "sku",
            "-sku": "-sku",
            "created_at": "created_at",
            "-created_at": "-created_at",
        }
        if ordering and ordering in allowed_orderings:
            qs = qs.order_by(allowed_orderings[ordering])
        else:
            qs = qs.order_by("name")

        serializer = InventoryItemSerializer(qs, many=True)
        data = serializer.data
        if inv_status and inv_status != "All Status":
            tokens = {
                token.strip().lower()
                for token in str(inv_status).split(",")
                if token.strip()
            }
            if tokens:
                def _matches_status(label):
                    s = str(label or "").strip().lower()
                    if "all status" in tokens:
                        return True
                    if "low stock" in tokens and s == "low stock":
                        return True
                    if "out of stock" in tokens and s == "out of stock":
                        return True
                    if "in stock" in tokens and s == "in stock":
                        return True
                    if "low" in tokens and "low" in s:
                        return True
                    if "out" in tokens and "out" in s:
                        return True
                    if "in" in tokens and s == "in stock":
                        return True
                    return s in tokens

                data = [i for i in data if _matches_status(i.get("status"))]
        return Response(data)

    def post(self, request):
        role = get_staff_role(request)
        if role not in WRITE_ROLES:
            return Response({"detail": "Permission denied."}, status=403)
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save()
            _log_inventory_transaction(
                inventory_item=item,
                action_type="create",
                quantity_before=0,
                quantity_after=item.quantity or 0,
                quantity_changed=item.quantity or 0,
                branch_name=item.branch.name if item.branch else "Main Warehouse (Saranay)",
                performed_by=getattr(request.user, "staff_profile", None),
                notes=f"Created inventory item ({item.sku})",
            )
            check_and_notify_low_stock(item)
            return Response(InventoryItemSerializer(item).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InventoryDetailView(APIView):
    permission_classes = [IsAuthenticated]  # ← was IsAdminUser

    def get_object(self, pk):
        try:
            return InventoryItem.objects.select_related("branch").get(pk=pk)
        except InventoryItem.DoesNotExist:
            return None

    def patch(self, request, pk):
        role = get_staff_role(request)
        if role not in WRITE_ROLES:
            return Response({"detail": "Permission denied."}, status=403)
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Not found."}, status=404)
        before_qty = item.quantity or 0
        was_active = item.is_active
        payload = request.data.copy()
        notes = payload.pop("notes", "")
        serializer = InventoryItemSerializer(item, data=payload, partial=True)
        if serializer.is_valid():
            item = serializer.save()
            after_qty = item.quantity or 0
            qty_changed = after_qty - before_qty

            action_type = "update"
            if was_active and item.is_active is False:
                action_type = "archive"
            elif (not was_active) and item.is_active is True:
                action_type = "restore"

            if qty_changed != 0 or action_type in ["archive", "restore"]:
                _log_inventory_transaction(
                    inventory_item=item,
                    action_type=action_type,
                    quantity_before=before_qty,
                    quantity_after=after_qty,
                    quantity_changed=qty_changed,
                    branch_name=item.branch.name if item.branch else "Main Warehouse (Saranay)",
                    performed_by=getattr(request.user, "staff_profile", None),
                    notes=notes,
                )

            check_and_notify_low_stock(item)
            return Response(InventoryItemSerializer(item).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        return Response({"detail": "Delete is disabled. Deactivate the product instead."}, status=405)


class RestockRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        requester_staff = getattr(request.user, "staff_profile", None)
        qs = RestockRequest.objects.select_related(
            "inventory_item",
            "branch",
            "requested_by",
            "reviewed_by",
        ).all()

        is_central_inventory = role in ["Inventory Manager", "Inventory"] and (
            not requester_staff
            or not requester_staff.branch_id
            or str(getattr(requester_staff, "branch_name", "")).strip() in [
                "Central Warehouse", "Central Head Office", "Central", "Main Warehouse", "Main Warehouse (Saranay)", ""
            ]
            or (role == "Inventory Manager" and getattr(requester_staff, "branch_id", None) == 3)
            or (role == "Inventory Manager" and "saranay" in str(getattr(requester_staff, "branch_name", "")).lower())
        )
        is_global_manager = role in ["super_admin", "Admin", "Business Owner", "Inventory Manager"] or is_central_inventory
        if requester_staff and not is_global_manager:
            if requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()

        serializer = RestockRequestSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        role = get_staff_role(request)
        if role not in RESTOCK_REQUEST_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        requester_staff = getattr(request.user, "staff_profile", None)
        if not requester_staff or not requester_staff.branch_id:
            return Response({"detail": "Your account is not assigned to a branch."}, status=400)

        payload = request.data.copy()
        payload["branch"] = requester_staff.branch_id

        try:
            inventory_item = InventoryItem.objects.get(pk=payload.get("inventory_item"))
        except InventoryItem.DoesNotExist:
            return Response({"detail": "Inventory item not found."}, status=404)

        if inventory_item.branch_id != requester_staff.branch_id:
            return Response(
                {"detail": "You can only request restock for your branch inventory items."},
                status=400,
            )

        serializer = RestockRequestSerializer(data=payload)
        if serializer.is_valid():
            rr = serializer.save(requested_by=requester_staff)
            _log_inventory_transaction(
                inventory_item=rr.inventory_item,
                action_type="restock_request",
                quantity_before=rr.inventory_item.quantity or 0,
                quantity_after=rr.inventory_item.quantity or 0,
                quantity_changed=rr.quantity_requested,
                branch_name=rr.branch.name if rr.branch else "",
                performed_by=requester_staff,
                notes=rr.notes,
            )
            requester_name = f"{requester_staff.first_name} {requester_staff.last_name}".strip() or "A staff member"
            _notify_roles(
                roles=["Inventory Manager"],
                title="New Stock Refill Request",
                message=(
                    f"{requester_name} ({rr.branch.name if rr.branch else 'Branch'}) requested a refill of "
                    f"{rr.quantity_requested} units of {rr.inventory_item.name} from Main Warehouse (Saranay)."
                ),
                notification_type="inventory",
                target_path="/inventory-manager/inventory",
            )
            return Response(RestockRequestSerializer(rr).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RestockRequestActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        role = get_staff_role(request)
        if role not in ["super_admin", "Inventory Manager", "Inventory"]:
            return Response(
                {"detail": "Only Inventory Manager, Inventory staff, or Super Admin can perform this action."},
                status=403,
            )

        try:
            rr = RestockRequest.objects.select_related("inventory_item").get(pk=pk)
        except RestockRequest.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        action = request.data.get("action")
        reviewer_note = request.data.get("reviewer_note", "")
        actor = getattr(request.user, "staff_profile", None)

        if action not in ["approve", "reject", "receive", "cancel"]:
            return Response({"detail": "Invalid action."}, status=400)

        if action == "cancel":
            if rr.status != "pending":
                return Response({"detail": "Only pending requests can be canceled."}, status=400)
            if not actor:
                return Response({"detail": "Staff profile required."}, status=403)

            is_manager_override = role in ["super_admin", "Inventory Manager"]
            is_request_owner = rr.requested_by_id == actor.id
            if not (is_manager_override or is_request_owner):
                return Response({"detail": "You can only cancel your own pending request."}, status=403)

            rr.status = "rejected"
            rr.reviewed_by = actor
            rr.reviewer_note = request.data.get("reviewer_note") or "Cancelled by requester."
            rr.reviewed_at = timezone.now()
            rr.save(update_fields=["status", "reviewed_by", "reviewer_note", "reviewed_at", "updated_at"])
            _log_inventory_transaction(
                inventory_item=rr.inventory_item,
                action_type="restock_rejected",
                quantity_before=rr.inventory_item.quantity or 0,
                quantity_after=rr.inventory_item.quantity or 0,
                quantity_changed=0,
                branch_name=rr.branch.name if rr.branch else "",
                performed_by=actor,
                notes=rr.reviewer_note,
            )
            request_label = "Transfer" if rr.request_type == "transfer" else "Restock"
            _notify_roles(
                roles=["Inventory"],
                branch_id=rr.branch_id,
                title=f"{request_label} Request Cancelled",
                message=(
                    f"{request_label} request #{rr.id} for {rr.inventory_item.name} "
                    f"was cancelled."
                ),
                notification_type="inventory",
                target_path="/inventory/stock-overview" if rr.request_type == "transfer" else "/inventory/alerts",
            )
            return Response(RestockRequestSerializer(rr).data)

        if action in ["approve", "reject"]:
            if role not in ["super_admin", "Inventory Manager"]:
                return Response({"detail": "Only Inventory Manager or Super Admin can review restock requests."}, status=403)
            if rr.status != "pending":
                return Response({"detail": "Only pending requests can be reviewed."}, status=400)

            rr.reviewed_by = actor
            rr.reviewer_note = reviewer_note
            rr.reviewed_at = timezone.now()

            if action == "approve":
                base_sku = rr.inventory_item.sku.split("-B")[0] if rr.inventory_item.sku else ""
                central_item = InventoryItem.objects.filter(branch__isnull=True).filter(
                    Q(sku=base_sku) | Q(name__iexact=rr.inventory_item.name, category=rr.inventory_item.category)
                ).first()
                if not central_item:
                    return Response(
                        {"detail": "Cannot approve: no Main Warehouse (Saranay) stock found for this item."},
                        status=400,
                    )
                available_qty = central_item.quantity or 0
                if available_qty < rr.quantity_requested:
                    return Response(
                        {
                            "detail": (
                                "Cannot approve: insufficient stock at Main Warehouse (Saranay). "
                                f"Available: {available_qty}, requested: {rr.quantity_requested}."
                            )
                        },
                        status=400,
                    )

                rr.status = "approved"
                rr.save(update_fields=["status", "reviewed_by", "reviewer_note", "reviewed_at", "updated_at"])
                _log_inventory_transaction(
                    inventory_item=rr.inventory_item,
                    action_type="restock_approved",
                    quantity_before=rr.inventory_item.quantity or 0,
                    quantity_after=rr.inventory_item.quantity or 0,
                    quantity_changed=0,
                    branch_name=rr.branch.name if rr.branch else "",
                    performed_by=actor,
                    notes=f"Approved restock request #{rr.id}",
                )
                _notify_roles(
                    roles=["Inventory"],
                    branch_id=rr.branch_id,
                    title="Stock Refill Approved",
                    message=(
                        f"Refill request #{rr.id} for {rr.inventory_item.name} ({rr.quantity_requested} units) "
                        f"has been approved from Main Warehouse (Saranay). Please confirm when stock is received."
                    ),
                    notification_type="inventory",
                    target_path="/inventory/stock-overview" if rr.request_type == "transfer" else "/inventory/alerts",
                )
            else:
                rr.status = "rejected"
                rr.save(update_fields=["status", "reviewed_by", "reviewer_note", "reviewed_at", "updated_at"])
                _log_inventory_transaction(
                    inventory_item=rr.inventory_item,
                    action_type="restock_rejected",
                    quantity_before=rr.inventory_item.quantity or 0,
                    quantity_after=rr.inventory_item.quantity or 0,
                    quantity_changed=0,
                    branch_name=rr.branch.name if rr.branch else "",
                    performed_by=actor,
                    notes=reviewer_note,
                )
                _notify_roles(
                    roles=["Inventory"],
                    branch_id=rr.branch_id,
                    title=f"{'Transfer' if rr.request_type == 'transfer' else 'Stock'} Request Rejected",
                    message=(
                        f"{'Transfer' if rr.request_type == 'transfer' else 'Restock'} request #{rr.id} "
                        f"for {rr.inventory_item.name} was rejected. "
                        f"{reviewer_note or 'Please review and submit a new request if needed.'}"
                    ),
                    notification_type="inventory",
                    target_path="/inventory/stock-overview" if rr.request_type == "transfer" else "/inventory/alerts",
                )
            return Response(RestockRequestSerializer(rr).data)

        # receive action
        if role not in ["super_admin", "Inventory"]:
            return Response({"detail": "Only Inventory staff or Super Admin can confirm stock receipt."}, status=403)
        if not actor or actor.branch_id != rr.branch_id:
            return Response({"detail": "You can only receive stock for your assigned branch."}, status=403)
        if rr.status != "approved":
            return Response({"detail": "Only approved requests can be marked as received."}, status=400)

        base_sku = rr.inventory_item.sku.split("-B")[0] if rr.inventory_item.sku else ""
        with transaction.atomic():
            central_item = InventoryItem.objects.select_for_update().filter(branch__isnull=True).filter(
                Q(sku=base_sku) | Q(name__iexact=rr.inventory_item.name, category=rr.inventory_item.category)
            ).first()
            if not central_item:
                return Response(
                    {"detail": "No Main Warehouse (Saranay) stock found for this item."},
                    status=400,
                )
            if (central_item.quantity or 0) < rr.quantity_requested:
                return Response(
                    {"detail": "Insufficient stock at Main Warehouse (Saranay) for this transfer."},
                    status=400,
                )

            target_item = InventoryItem.objects.select_for_update().get(pk=rr.inventory_item_id)
            source_before = central_item.quantity or 0
            central_item.quantity = source_before - rr.quantity_requested
            central_item.save(update_fields=["quantity", "updated_at"])

            target_before = target_item.quantity or 0
            target_item.quantity = target_before + rr.quantity_requested
            target_item.save(update_fields=["quantity", "updated_at"])

            rr.status = "received"
            rr.save(update_fields=["status", "updated_at"])

            _log_inventory_transaction(
                inventory_item=central_item,
                action_type="transfer_out",
                quantity_before=source_before,
                quantity_after=central_item.quantity or 0,
                quantity_changed=-(rr.quantity_requested or 0),
                branch_name="Main Warehouse (Saranay)",
                target_branch_name=rr.branch.name if rr.branch else "",
                performed_by=actor,
                notes=f"Received {'transfer' if rr.request_type == 'transfer' else 'restock'} request #{rr.id}",
            )
            _log_inventory_transaction(
                inventory_item=target_item,
                action_type="transfer_in",
                quantity_before=target_before,
                quantity_after=target_item.quantity or 0,
                quantity_changed=rr.quantity_requested or 0,
                branch_name=rr.branch.name if rr.branch else "",
                target_branch_name="Main Warehouse (Saranay)",
                performed_by=actor,
                notes=f"Received {'transfer' if rr.request_type == 'transfer' else 'restock'} request #{rr.id}",
            )
            _log_inventory_transaction(
                inventory_item=target_item,
                action_type="restock_received",
                quantity_before=target_before,
                quantity_after=target_item.quantity or 0,
                quantity_changed=rr.quantity_requested or 0,
                branch_name=rr.branch.name if rr.branch else "",
                performed_by=actor,
                notes=f"Inventory confirmed {'transfer' if rr.request_type == 'transfer' else 'restock'} receipt for request #{rr.id}",
            )
            check_and_notify_low_stock(central_item)

        _notify_roles(
            roles=["Inventory Manager"],
            title="Transfer Received" if rr.request_type == "transfer" else "Stock Received",
            message=(
                f"Inventory confirmed {'transfer' if rr.request_type == 'transfer' else 'stock'} receipt for request #{rr.id} "
                f"({rr.inventory_item.name}, qty {rr.quantity_requested}) in {rr.branch.name}."
            ),
            notification_type="inventory",
            target_path="/inventory-manager/transactions",
        )

        return Response(RestockRequestSerializer(rr).data)


class DirectStockTransferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = get_staff_role(request)
        requester_staff = getattr(request.user, "staff_profile", None)
        is_central_inventory = role in ["Inventory Manager", "Inventory"] and (
            not requester_staff
            or not requester_staff.branch_id
            or str(getattr(requester_staff, "branch_name", "")).strip() in [
                "Central Warehouse", "Central Head Office", "Central", "Main Warehouse", "Main Warehouse (Saranay)", ""
            ]
            or (role == "Inventory Manager" and getattr(requester_staff, "branch_id", None) == 3)
            or (role == "Inventory Manager" and "saranay" in str(getattr(requester_staff, "branch_name", "")).lower())
        )
        if role not in ["super_admin", "Inventory Manager"] and not is_central_inventory:
            return Response({"detail": "Only Inventory Manager, Central Inventory, or Super Admin can transfer stock."}, status=403)

        source_item_id = request.data.get("source_item_id")
        target_branch_id = request.data.get("target_branch_id")
        quantity = request.data.get("quantity")
        note = request.data.get("note", "")
        immediate = bool(request.data.get("immediate", False) or request.data.get("direct_distribution", False))

        if not source_item_id or not target_branch_id or not quantity:
            return Response({"detail": "source_item_id, target_branch_id, and quantity are required."}, status=400)

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({"detail": "Quantity must be a valid integer."}, status=400)
        if quantity <= 0:
            return Response({"detail": "Quantity must be greater than zero."}, status=400)

        try:
            source = InventoryItem.objects.select_related("branch").get(pk=source_item_id)
        except InventoryItem.DoesNotExist:
            return Response({"detail": "Source inventory item not found."}, status=404)

        try:
            target_branch = Branch.objects.get(pk=target_branch_id)
        except Branch.DoesNotExist:
            return Response({"detail": "Target branch not found."}, status=404)

        if source.branch_id is not None and source.branch_id == target_branch.id:
            return Response({"detail": "Source and target branch cannot be the same."}, status=400)

        if (source.quantity or 0) < quantity:
            return Response(
                {"detail": f"Insufficient stock for transfer. Available: {source.quantity or 0}."},
                status=400,
            )

        target = InventoryItem.objects.filter(
            branch_id=target_branch.id,
            name__iexact=source.name,
            category=source.category,
        ).first()

        # If item does not exist at target branch yet, automatically create it for product distribution
        if not target:
            target = InventoryItem.objects.create(
                name=source.name,
                category=source.category,
                price=source.price,
                minimum_qty=source.minimum_qty,
                unit=source.unit,
                supplier=source.supplier,
                branch=target_branch,
                quantity=0,
                sku=_next_branch_sku(source.sku, target_branch.id),
                is_active=True,
            )

        actor = getattr(request.user, "staff_profile", None)
        source_branch_name = source.branch.name if source.branch else "Main Warehouse (Saranay)"
        target_branch_name = target_branch.name

        if immediate:
            with transaction.atomic():
                source_before = source.quantity or 0
                source.quantity = source_before - quantity
                source.save(update_fields=["quantity", "updated_at"])

                target_before = target.quantity or 0
                target.quantity = target_before + quantity
                target.save(update_fields=["quantity", "updated_at"])

                rr = RestockRequest.objects.create(
                    inventory_item=target,
                    branch=target_branch,
                    requested_by=actor,
                    reviewed_by=actor,
                    quantity_requested=quantity,
                    notes=note,
                    request_type="transfer",
                    status="received",
                    reviewed_at=timezone.now(),
                )
                _log_inventory_transaction(
                    inventory_item=source,
                    action_type="transfer_out",
                    quantity_before=source_before,
                    quantity_after=source.quantity,
                    quantity_changed=-quantity,
                    branch_name=source_branch_name,
                    target_branch_name=target_branch_name,
                    performed_by=actor,
                    notes=f"Distribution #{rr.id}: {note}".strip(),
                )
                _log_inventory_transaction(
                    inventory_item=target,
                    action_type="transfer_in",
                    quantity_before=target_before,
                    quantity_after=target.quantity,
                    quantity_changed=quantity,
                    branch_name=target_branch_name,
                    target_branch_name=source_branch_name,
                    performed_by=actor,
                    notes=f"Distribution #{rr.id}: {note}".strip(),
                )
                check_and_notify_low_stock(source)

            requester_name = f"{actor.first_name} {actor.last_name}".strip() if actor else "Inventory Manager"
            _notify_roles(
                roles=["Inventory"],
                branch_id=target_branch.id,
                title="Stock Distributed",
                message=(
                    f"{requester_name} distributed {quantity} units of {source.name} to {target_branch_name}."
                ),
                notification_type="inventory",
                target_path="/inventory/stock-overview",
            )
            return Response(
                {
                    "detail": "Product distributed successfully. Inventory updated.",
                    "request_id": rr.id,
                    "source_item_id": source.id,
                    "target_item_id": target.id,
                    "quantity": quantity,
                    "immediate": True,
                },
                status=200,
            )

        existing_pending = RestockRequest.objects.filter(
            inventory_item=target,
            status__in=["pending", "approved"],
            request_type="transfer",
        ).exists()
        if existing_pending:
            return Response(
                {"detail": "A pending transfer request already exists for this item and branch."},
                status=400,
            )

        rr = RestockRequest.objects.create(
            inventory_item=target,
            branch=target_branch,
            requested_by=actor,
            quantity_requested=quantity,
            notes=note,
            request_type="transfer",
            status="approved",
        )
        _log_inventory_transaction(
            inventory_item=source,
            action_type="restock_request",
            quantity_before=source.quantity or 0,
            quantity_after=source.quantity or 0,
            quantity_changed=quantity or 0,
            branch_name=source_branch_name,
            target_branch_name=target_branch_name,
            performed_by=actor,
            notes=f"Transfer request #{rr.id}: {note}".strip(),
        )
        requester_name = f"{actor.first_name} {actor.last_name}".strip() if actor else "A staff member"
        _notify_roles(
            roles=["Inventory"],
            branch_id=target_branch.id,
            title="Incoming Transfer",
            message=(
                f"{requester_name} sent transfer #{rr.id} for {source.name} "
                f"(qty {quantity}). Mark as received when stock arrives."
            ),
            notification_type="inventory",
            target_path="/inventory/stock-overview",
        )
        _notify_roles(
            roles=["Inventory Manager"],
            title="Transfer Sent",
            message=(
                f"Transfer #{rr.id} for {source.name} "
                f"(qty {quantity}) to {target_branch_name} was sent."
            ),
            notification_type="inventory",
            target_path="/inventory-manager/inventory",
        )

        return Response(
            {
                "detail": "Stock sent. Waiting for inventory to mark as received.",
                "request_id": rr.id,
                "source_item_id": source.id,
                "target_item_id": target.id,
                "quantity": quantity,
                "note": note,
            },
            status=200,
        )


class InventoryTransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_staff_role(request)
        is_superuser = getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False)
        allowed_roles = ["super_admin", "Admin", "Business Owner", "Inventory Manager", "Inventory", "Branch Manager", "Staff"]
        if not is_superuser and role not in allowed_roles:
            return Response(
                {"detail": "Only authorized staff can view inventory transactions."},
                status=403,
            )

        limit_raw = request.query_params.get("limit", "50")
        try:
            limit = max(1, min(int(limit_raw), 200))
        except (TypeError, ValueError):
            limit = 50

        qs = InventoryTransaction.objects.select_related("inventory_item", "performed_by").all()

        date_from_raw = request.query_params.get("date_from")
        date_to_raw = request.query_params.get("date_to")
        if date_from_raw:
            date_from = parse_date(str(date_from_raw))
            if not date_from:
                return Response({"detail": "Invalid date_from. Use YYYY-MM-DD."}, status=400)
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to_raw:
            date_to = parse_date(str(date_to_raw))
            if not date_to:
                return Response({"detail": "Invalid date_to. Use YYYY-MM-DD."}, status=400)
            qs = qs.filter(created_at__date__lte=date_to)

        requester_staff = getattr(request.user, "staff_profile", None)
        is_central_inventory = role in ["Inventory Manager", "Inventory"] and (
            not requester_staff
            or not requester_staff.branch_id
            or str(getattr(requester_staff, "branch_name", "")).strip() in [
                "Central Warehouse", "Central Head Office", "Central", "Main Warehouse", "Main Warehouse (Saranay)", ""
            ]
            or (role == "Inventory Manager" and getattr(requester_staff, "branch_id", None) == 3)
            or (role == "Inventory Manager" and "saranay" in str(getattr(requester_staff, "branch_name", "")).lower())
        )
        if role in ["Inventory", "Branch Manager"] and not is_central_inventory:
            branch_name = requester_staff.branch.name if requester_staff and requester_staff.branch else ""
            if not branch_name:
                return Response([], status=200)
            qs = qs.filter(branch_name=branch_name)

        qs = qs[:limit]
        return Response(InventoryTransactionSerializer(qs, many=True).data)


class InventoryDemandForecastView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        period = request.query_params.get("period", "monthly")
        if period not in ["weekly", "monthly", "quarterly", "yearly"]:
            return Response({"detail": "period must be weekly, monthly, quarterly, or yearly."}, status=400)

        branch_name = request.query_params.get("branch")
        item_limit_raw = request.query_params.get("item_limit", "8")
        try:
            item_limit = max(1, min(int(item_limit_raw), 20))
        except (TypeError, ValueError):
            item_limit = 8

        transactions_qs = InventoryTransaction.objects.select_related("inventory_item").all()
        inventory_qs = InventoryItem.objects.select_related("branch").filter(is_active=True)

        requester_staff = getattr(request.user, "staff_profile", None)
        is_central_inventory = role in ["Inventory Manager", "Inventory"] and (
            not requester_staff
            or not requester_staff.branch_id
            or str(getattr(requester_staff, "branch_name", "")).strip() in [
                "Central Warehouse", "Central Head Office", "Central", "Main Warehouse", "Main Warehouse (Saranay)", ""
            ]
            or (role == "Inventory Manager" and getattr(requester_staff, "branch_id", None) == 3)
            or (role == "Inventory Manager" and "saranay" in str(getattr(requester_staff, "branch_name", "")).lower())
        )
        if role in ["Inventory", "Branch Manager", "Staff", "Employee"] and not is_central_inventory:
            if requester_staff and requester_staff.branch:
                allowed_branch_name = requester_staff.branch.name
                transactions_qs = transactions_qs.filter(branch_name=allowed_branch_name)
                inventory_qs = inventory_qs.filter(branch=requester_staff.branch)
            else:
                return Response(
                    {
                        "period": period,
                        "branch_filter": "Unassigned",
                        "time_series": [],
                        "linear_regression": {"slope": 0, "intercept": 0, "next_period_prediction": 0, "trend": "stable"},
                        "top_items": [],
                        "risk_summary": {"stockout_risk_count": 0, "overstock_risk_count": 0},
                    }
                )

        if branch_name and branch_name != "All Branches":
            transactions_qs = transactions_qs.filter(branch_name=branch_name)
            inventory_qs = inventory_qs.filter(branch__name=branch_name)

        usage_by_period = defaultdict(int)
        item_usage = defaultdict(int)
        branch_usage = defaultdict(int)

        for tx in transactions_qs:
            if not tx.created_at:
                continue
            change = tx.quantity_changed or 0
            usage = abs(change) if change < 0 else 0
            if usage <= 0:
                continue

            if period == "weekly":
                iso = tx.created_at.isocalendar()
                label = f"{iso.year}-W{iso.week:02d}"
            elif period == "monthly":
                label = tx.created_at.strftime("%Y-%m")
            elif period == "quarterly":
                label = f"{tx.created_at.year}-Q{((tx.created_at.month - 1) // 3) + 1}"
            else:
                label = tx.created_at.strftime("%Y")
            usage_by_period[label] += usage
            item_key = tx.inventory_item.name if tx.inventory_item else "Unknown Item"
            item_usage[item_key] += usage
            branch_key = tx.branch_name or "Unassigned"
            branch_usage[branch_key] += usage

        sorted_labels = sorted(usage_by_period.keys())
        points = [usage_by_period[label] for label in sorted_labels]
        n = len(points)

        if n > 0:
            x_values = list(range(n))
            x_sum = sum(x_values)
            y_sum = sum(points)
            x2_sum = sum(x * x for x in x_values)
            xy_sum = sum(x * y for x, y in zip(x_values, points))
            denominator = (n * x2_sum) - (x_sum * x_sum)
            slope = ((n * xy_sum) - (x_sum * y_sum)) / denominator if denominator else 0
            intercept = (y_sum - (slope * x_sum)) / n if n else 0
            next_prediction = max(0, round((slope * n) + intercept, 2))
        else:
            slope = 0
            intercept = 0
            next_prediction = 0

        if slope > 0.5:
            trend = "increasing"
        elif slope < -0.5:
            trend = "decreasing"
        else:
            trend = "stable"

        top_items = [
            {"item_name": name, "usage": usage}
            for name, usage in sorted(item_usage.items(), key=lambda row: row[1], reverse=True)[:item_limit]
        ]

        branch_stock_needed = defaultdict(int)
        avg_per_period = (sum(points) / n) if n else 0
        stockout_risk_count = 0
        overstock_risk_count = 0
        for item in inventory_qs:
            qty = item.quantity or 0
            reorder_level = item.minimum_qty or 0
            branch_key = item.branch.name if item.branch else "Unassigned"
            branch_stock_needed[branch_key] += max(0, reorder_level - qty)
            if qty <= reorder_level:
                stockout_risk_count += 1
            if avg_per_period > 0 and qty > (avg_per_period * 6):
                overstock_risk_count += 1

        top_branches = [
            {
                "branch_name": name,
                "usage": branch_usage.get(name, 0),
                "stock_needed": stock_needed,
            }
            for name, stock_needed in sorted(
                branch_stock_needed.items(),
                key=lambda row: (row[1], branch_usage.get(row[0], 0)),
                reverse=True,
            )[:item_limit]
        ]
        highest_demand_product = top_items[0] if top_items else None
        highest_stock_needed_branch = top_branches[0] if top_branches else None

        return Response(
            {
                "period": period,
                "branch_filter": branch_name or "All Branches",
                "time_series": [{"label": label, "usage": usage_by_period[label]} for label in sorted_labels],
                "linear_regression": {
                    "slope": round(slope, 4),
                    "intercept": round(intercept, 4),
                    "next_period_prediction": next_prediction,
                    "trend": trend,
                },
                "top_items": top_items,
                "top_branches": top_branches,
                "highest_demand_product": highest_demand_product,
                "highest_stock_needed_branch": highest_stock_needed_branch,
                "risk_summary": {
                    "stockout_risk_count": stockout_risk_count,
                    "overstock_risk_count": overstock_risk_count,
                },
            }
        )


class InventoryDistributionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        branches = list(Branch.objects.filter(is_active=True).order_by("name"))
        items = list(InventoryItem.objects.filter(is_active=True).select_related("branch").order_by("name"))

        # Group items by base product identity: (name.lower(), category.lower())
        products: dict[tuple[str, str], dict[str, Any]] = defaultdict(lambda: {
            "name": "",
            "category": "",
            "sku": "",
            "price": 0.0,
            "central_stock": 0,
            "central_item_id": None,
            "branch_stocks": {},
            "total_stock": 0,
        })

        for item in items:
            key = (item.name.strip().lower(), (item.category or "").strip().lower())
            p = products[key]
            if not p["name"]:
                p["name"] = item.name
                p["category"] = item.category or "General"
                p["price"] = float(item.price or 0)
                base_sku = item.sku.split("-B")[0] if item.sku else ""
                p["sku"] = base_sku

            qty = item.quantity or 0
            p["total_stock"] += qty

            if item.branch_id is None:
                p["central_stock"] += qty
                p["central_item_id"] = item.id
            else:
                p["branch_stocks"][str(item.branch_id)] = {
                    "branch_id": item.branch_id,
                    "branch_name": item.branch.name if item.branch else "Unknown",
                    "item_id": item.id,
                    "quantity": qty,
                    "minimum_qty": item.minimum_qty or 0,
                    "status": "in_stock" if qty > (item.minimum_qty or 0) else ("low_stock" if qty > 0 else "out_of_stock"),
                }

        distributions = []
        balanced_count = 0
        low_stock_count = 0
        imbalanced_count = 0

        for key, p in sorted(products.items(), key=lambda x: x[1]["name"].lower()):
            has_low_or_out = False
            has_surplus = False

            for b in branches:
                b_stock = p["branch_stocks"].get(str(b.id))
                if not b_stock:
                    p["branch_stocks"][str(b.id)] = {
                        "branch_id": b.id,
                        "branch_name": b.name,
                        "item_id": None,
                        "quantity": 0,
                        "minimum_qty": 0,
                        "status": "not_stocked",
                    }
                else:
                    b_qty = b_stock["quantity"]
                    min_q = b_stock["minimum_qty"]
                    if b_qty <= min_q:
                        has_low_or_out = True
                    if min_q > 0 and b_qty >= (min_q * 3):
                        has_surplus = True

            if has_low_or_out and (has_surplus or p["central_stock"] > 0):
                balance_status = "imbalanced"
                imbalanced_count += 1
            elif has_low_or_out:
                balance_status = "low_stock"
                low_stock_count += 1
            else:
                balance_status = "balanced"
                balanced_count += 1

            p["balance_status"] = balance_status
            distributions.append(p)

        return Response({
            "summary": {
                "total_products": len(distributions),
                "total_stock": sum(d["total_stock"] for d in distributions),
                "balanced_count": balanced_count,
                "low_stock_count": low_stock_count,
                "imbalanced_count": imbalanced_count,
            },
            "branches": [{"id": b.id, "name": b.name} for b in branches],
            "distributions": distributions,
        })


class InventoryCheckAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        items = InventoryItem.objects.filter(is_active=True).select_related("branch")
        alerts_sent = 0
        low_stock_count = 0

        for item in items:
            if (item.quantity or 0) <= (item.minimum_qty or 0) or (item.quantity or 0) <= 0:
                low_stock_count += 1
                if check_and_notify_low_stock(item):
                    alerts_sent += 1

        return Response({
            "checked_items": items.count(),
            "low_stock_items": low_stock_count,
            "alerts_created": alerts_sent,
        })
