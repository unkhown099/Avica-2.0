# api/views/inventory_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  # ← changed
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from collections import defaultdict
from ..models import InventoryItem, RestockRequest, InventoryTransaction, Staff, Notification
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


def _notify_roles(*, roles, title, message, branch_id=None, notification_type="inventory"):
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
            )
        )

    if notifications:
        Notification.objects.bulk_create(notifications)


class InventoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]  # ← was IsAdminUser

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        category   = request.query_params.get("category")
        branch     = request.query_params.get("branch")
        search     = request.query_params.get("search")
        inv_status = request.query_params.get("status")
        archived   = request.query_params.get("archived")

        requester_staff = getattr(request.user, "staff_profile", None)
        qs = InventoryItem.objects.select_related("branch").all()

        # Global roles can view inventory across branches; branch-scoped roles stay restricted.
        global_roles = {"super_admin", "Admin", "Business Owner", "Inventory Manager"}
        if requester_staff and role not in global_roles:
            if requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()
        if category:
            qs = qs.filter(category=category)
        if branch:
            qs = qs.filter(branch__name=branch)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(sku__icontains=search)
        if archived == "true":
            qs = qs.filter(is_active=False)
        else:
            qs = qs.filter(is_active=True)

        serializer = InventoryItemSerializer(qs, many=True)
        data = serializer.data
        if inv_status and inv_status != "All Status":
            data = [i for i in data if i["status"] == inv_status]
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
                branch_name=item.branch.name if item.branch else "Central",
                performed_by=getattr(request.user, "staff_profile", None),
                notes=f"Created inventory item ({item.sku})",
            )
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
        serializer = InventoryItemSerializer(item, data=request.data, partial=True)
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
                    branch_name=item.branch.name if item.branch else "Central",
                    performed_by=getattr(request.user, "staff_profile", None),
                    notes=request.data.get("notes", ""),
                )

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

        if requester_staff and requester_staff.role != "Inventory Manager":
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
                title="New Stock Request",
                message=(
                    f"{requester_name} requested {rr.quantity_requested} units of "
                    f"{rr.inventory_item.name} for {rr.branch.name}."
                ),
                notification_type="inventory",
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

        if action not in ["approve", "reject", "receive"]:
            return Response({"detail": "Invalid action."}, status=400)

        if action in ["approve", "reject"]:
            if role not in ["super_admin", "Inventory Manager"]:
                return Response({"detail": "Only Inventory Manager or Super Admin can review restock requests."}, status=403)
            if rr.status != "pending":
                return Response({"detail": "Only pending requests can be reviewed."}, status=400)

            rr.reviewed_by = actor
            rr.reviewer_note = reviewer_note
            rr.reviewed_at = timezone.now()

            if action == "approve":
                central_item = InventoryItem.objects.filter(
                    branch__isnull=True,
                    name=rr.inventory_item.name,
                    category=rr.inventory_item.category,
                ).first()
                if not central_item:
                    return Response(
                        {"detail": "Cannot approve: no central stock found for this item."},
                        status=400,
                    )
                available_qty = central_item.quantity or 0
                if available_qty < rr.quantity_requested:
                    return Response(
                        {
                            "detail": (
                                "Cannot approve: insufficient central stock. "
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
                    title="Stock Request Approved",
                    message=(
                        f"Restock request #{rr.id} for {rr.inventory_item.name} "
                        f"has been approved. Please confirm when stock is received."
                    ),
                    notification_type="inventory",
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
            return Response(RestockRequestSerializer(rr).data)

        # receive action
        if role not in ["super_admin", "Inventory"]:
            return Response({"detail": "Only Inventory staff or Super Admin can confirm stock receipt."}, status=403)
        if not actor or actor.branch_id != rr.branch_id:
            return Response({"detail": "You can only receive stock for your assigned branch."}, status=403)
        if rr.status != "approved":
            return Response({"detail": "Only approved requests can be marked as received."}, status=400)

        central_item = InventoryItem.objects.filter(
            branch__isnull=True,
            name=rr.inventory_item.name,
            category=rr.inventory_item.category,
        ).first()
        if not central_item:
            return Response(
                {"detail": "No central stock found for this item."},
                status=400,
            )
        if (central_item.quantity or 0) < rr.quantity_requested:
            return Response(
                {"detail": "Insufficient central stock for this transfer."},
                status=400,
            )

        with transaction.atomic():
            source_before = central_item.quantity or 0
            central_item.quantity = (central_item.quantity or 0) - rr.quantity_requested
            central_item.save(update_fields=["quantity", "updated_at"])

            target_before = rr.inventory_item.quantity or 0
            rr.inventory_item.quantity = (rr.inventory_item.quantity or 0) + rr.quantity_requested
            rr.inventory_item.save(update_fields=["quantity", "updated_at"])

            rr.status = "received"
            rr.save(update_fields=["status", "updated_at"])

            _log_inventory_transaction(
                inventory_item=central_item,
                action_type="transfer_out",
                quantity_before=source_before,
                quantity_after=central_item.quantity or 0,
                quantity_changed=-(rr.quantity_requested or 0),
                branch_name="Central",
                target_branch_name=rr.branch.name if rr.branch else "",
                performed_by=actor,
                notes=f"Received restock request #{rr.id}",
            )
            _log_inventory_transaction(
                inventory_item=rr.inventory_item,
                action_type="transfer_in",
                quantity_before=target_before,
                quantity_after=rr.inventory_item.quantity or 0,
                quantity_changed=rr.quantity_requested or 0,
                branch_name=rr.branch.name if rr.branch else "",
                target_branch_name="Central",
                performed_by=actor,
                notes=f"Received restock request #{rr.id}",
            )
            _log_inventory_transaction(
                inventory_item=rr.inventory_item,
                action_type="restock_received",
                quantity_before=target_before,
                quantity_after=rr.inventory_item.quantity or 0,
                quantity_changed=rr.quantity_requested or 0,
                branch_name=rr.branch.name if rr.branch else "",
                performed_by=actor,
                notes=f"Inventory confirmed receipt for request #{rr.id}",
            )

        _notify_roles(
            roles=["Inventory Manager"],
            title="Stock Received",
            message=(
                f"Inventory confirmed stock receipt for request #{rr.id} "
                f"({rr.inventory_item.name}, qty {rr.quantity_requested}) in {rr.branch.name}."
            ),
            notification_type="inventory",
        )

        return Response(RestockRequestSerializer(rr).data)


class DirectStockTransferView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = get_staff_role(request)
        if role not in ["super_admin", "Inventory Manager"]:
            return Response({"detail": "Only Inventory Manager or Super Admin can transfer stock."}, status=403)

        source_item_id = request.data.get("source_item_id")
        target_branch_id = request.data.get("target_branch_id")
        quantity = request.data.get("quantity")
        note = request.data.get("note", "")

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

        if source.branch_id is not None:
            return Response({"detail": "Source item must be from central inventory (no branch)."}, status=400)

        if (source.quantity or 0) < quantity:
            return Response({"detail": "Insufficient central stock for transfer."}, status=400)

        target = InventoryItem.objects.filter(
            branch_id=target_branch_id,
            name=source.name,
            category=source.category,
        ).first()

        with transaction.atomic():
            source_before = source.quantity or 0
            source.quantity = (source.quantity or 0) - quantity
            source.save(update_fields=["quantity", "updated_at"])

            if target:
                target_before = target.quantity or 0
                target.quantity = (target.quantity or 0) + quantity
                target.save(update_fields=["quantity", "updated_at"])
            else:
                target_before = 0
                target = InventoryItem.objects.create(
                    name=source.name,
                    category=source.category,
                    sku=_next_branch_sku(source.sku, target_branch_id),
                    quantity=quantity,
                    minimum_qty=source.minimum_qty,
                    unit=source.unit,
                    price=source.price,
                    supplier=source.supplier,
                    branch_id=target_branch_id,
                )

            _log_inventory_transaction(
                inventory_item=source,
                action_type="transfer_out",
                quantity_before=source_before,
                quantity_after=source.quantity or 0,
                quantity_changed=-(quantity or 0),
                branch_name="Central",
                target_branch_name=target.branch.name if target.branch else "",
                performed_by=getattr(request.user, "staff_profile", None),
                notes=note,
            )
            _log_inventory_transaction(
                inventory_item=target,
                action_type="transfer_in",
                quantity_before=target_before,
                quantity_after=target.quantity or 0,
                quantity_changed=quantity or 0,
                branch_name=target.branch.name if target.branch else "",
                target_branch_name="Central",
                performed_by=getattr(request.user, "staff_profile", None),
                notes=note,
            )

        return Response(
            {
                "detail": "Stock transferred successfully.",
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
        if role not in ["super_admin", "Inventory Manager", "Inventory", "Branch Manager"]:
            return Response(
                {"detail": "Only Inventory Manager, Inventory, Branch Manager, or Super Admin can view inventory transactions."},
                status=403,
            )

        limit_raw = request.query_params.get("limit", "50")
        try:
            limit = max(1, min(int(limit_raw), 200))
        except (TypeError, ValueError):
            limit = 50

        qs = InventoryTransaction.objects.select_related("inventory_item", "performed_by").all()

        if role in ["Inventory", "Branch Manager"]:
            requester_staff = getattr(request.user, "staff_profile", None)
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
        if period not in ["daily", "monthly"]:
            return Response({"detail": "period must be daily or monthly."}, status=400)

        branch_name = request.query_params.get("branch")
        item_limit_raw = request.query_params.get("item_limit", "8")
        try:
            item_limit = max(1, min(int(item_limit_raw), 20))
        except (TypeError, ValueError):
            item_limit = 8

        transactions_qs = InventoryTransaction.objects.select_related("inventory_item").all()
        inventory_qs = InventoryItem.objects.select_related("branch").filter(is_active=True)

        requester_staff = getattr(request.user, "staff_profile", None)
        if role in ["Inventory", "Branch Manager", "Staff", "Employee"] and requester_staff and requester_staff.branch:
            allowed_branch_name = requester_staff.branch.name
            transactions_qs = transactions_qs.filter(branch_name=allowed_branch_name)
            inventory_qs = inventory_qs.filter(branch=requester_staff.branch)
        elif role in ["Inventory", "Branch Manager", "Staff", "Employee"]:
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
            change = int(tx.quantity_changed or 0)
            usage = abs(change) if change < 0 else 0
            if usage <= 0:
                continue

            label = tx.created_at.strftime("%Y-%m-%d") if period == "daily" else tx.created_at.strftime("%Y-%m")
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
            qty = int(item.quantity or 0)
            reorder_level = int(item.minimum_qty or 0)
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
