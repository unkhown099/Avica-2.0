from decimal import Decimal
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import PaymentTransaction, Staff, QueueEntry
from api.serializers.payment_transaction_serializer import PaymentTransactionSerializer


def _get_requester_staff(user):
    try:
        return user.staff_profile
    except Staff.DoesNotExist:
        return None


class PaymentTransactionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        requester_staff = _get_requester_staff(request.user)
        if not requester_staff or requester_staff.role not in ("Staff", "Employee"):
            return Response({"detail": "Permission denied."}, status=403)

        payload = request.data.copy()
        queue_entry = None
        queue_entry_id = payload.get("queue_entry")
        if queue_entry_id:
            try:
                queue_entry = QueueEntry.objects.get(pk=queue_entry_id)
            except QueueEntry.DoesNotExist:
                return Response({"detail": "Queue entry not found."}, status=404)

        amount = payload.get("amount", 0)
        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response({"detail": "Invalid amount."}, status=400)

        transaction_type = (payload.get("transaction_type") or "").strip()
        if transaction_type not in {"appointment", "walk_in", "service", "product"}:
            return Response({"detail": "Invalid transaction_type."}, status=400)

        try:
            quantity = max(int(payload.get("quantity", 1) or 1), 1)
        except (TypeError, ValueError):
            return Response({"detail": "Invalid quantity."}, status=400)

        transaction = PaymentTransaction.objects.create(
            staff=requester_staff,
            branch=(queue_entry.branch if queue_entry else requester_staff.branch),
            queue_entry=queue_entry,
            transaction_type=transaction_type,
            description=payload.get("description", "") or "",
            quantity=quantity,
            amount=amount,
            payment_method=payload.get("payment_method", "") or "",
            notes=payload.get("notes", "") or "",
        )
        return Response(PaymentTransactionSerializer(transaction).data, status=201)

    def get(self, request):
        requester_staff = _get_requester_staff(request.user)
        if not requester_staff:
            return Response({"detail": "Staff profile not found."}, status=403)

        qs = PaymentTransaction.objects.select_related("staff", "branch", "queue_entry").all()
        role = (requester_staff.role or "").strip()

        if role in ("Staff", "Employee"):
            qs = qs.filter(staff_id=requester_staff.id)
        elif role in ("Branch Manager", "Inventory", "Inventory Manager"):
            if requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()
        elif role not in ("Admin", "Business Owner", "super_admin", "Super Admin"):
            return Response({"detail": "Permission denied."}, status=403)

        transaction_type = request.query_params.get("type")
        if transaction_type:
            qs = qs.filter(transaction_type=transaction_type)

        payment_method = request.query_params.get("payment_method")
        if payment_method:
            qs = qs.filter(payment_method__iexact=payment_method)

        date_from = request.query_params.get("date_from")
        if date_from:
            qs = qs.filter(paid_at__date__gte=date_from)

        date_to = request.query_params.get("date_to")
        if date_to:
            qs = qs.filter(paid_at__date__lte=date_to)

        search = (request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(description__icontains=search)
                | Q(notes__icontains=search)
                | Q(queue_entry__customer_name__icontains=search)
            )

        data = PaymentTransactionSerializer(qs.order_by("-paid_at", "-created_at"), many=True).data
        return Response(data)
