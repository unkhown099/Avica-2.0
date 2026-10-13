from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q, Sum, Avg
import math
from api.models import QueueEntry, Customer, Branch


class CustomerHistoryAPIView(APIView):
    """
    Returns service history for the authenticated customer.
    Supports filtering by search query, date range (start_date, end_date),
    branch (numeric ID or name), service name, and pagination.
    Guarantees customer data isolation (strictly scoped to request.user).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Base query: completed/paid services linked to user's bookings or walk-in customer profile
        qs = QueueEntry.objects.filter(
            Q(booking__user=user) | Q(customer_user=user),
            status="done",
            payment_status="paid",
        ).select_related(
            "booking",
            "booking__branch",
            "branch",
            "assigned_employee",
            "customer_user",
        ).order_by("-completed_at")

        # Filters
        search = request.query_params.get("search")
        if search and search.strip():
            s = search.strip()
            qs = qs.filter(
                Q(service__icontains=s) |
                Q(booking__service__icontains=s) |
                Q(plate_number__icontains=s) |
                Q(booking__plate_number__icontains=s) |
                Q(vehicle__icontains=s) |
                Q(booking__vehicle__icontains=s) |
                Q(assigned_employee__first_name__icontains=s) |
                Q(assigned_employee__last_name__icontains=s)
            )

        start_date = request.query_params.get("start_date")
        if start_date and start_date.strip():
            try:
                qs = qs.filter(completed_at__date__gte=start_date.strip())
            except Exception:
                return Response({"detail": "Invalid start_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        end_date = request.query_params.get("end_date")
        if end_date and end_date.strip():
            try:
                qs = qs.filter(completed_at__date__lte=end_date.strip())
            except Exception:
                return Response({"detail": "Invalid end_date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        branch_param = request.query_params.get("branch")
        if branch_param and branch_param.strip() not in {"", "All Branches", "all"}:
            branch_str = branch_param.strip()
            if branch_str.isdigit():
                branch_id = int(branch_str)
                qs = qs.filter(Q(branch_id=branch_id) | Q(booking__branch_id=branch_id))
            else:
                qs = qs.filter(Q(branch__name__iexact=branch_str) | Q(booking__branch__name__iexact=branch_str))

        service_filter = request.query_params.get("service")
        if service_filter and service_filter.strip() not in {"", "All Services", "all"}:
            qs = qs.filter(Q(service__iexact=service_filter.strip()) | Q(booking__service__iexact=service_filter.strip()))

        total_count = qs.count()
        total_spent = float(qs.aggregate(t=Sum("price"))["t"] or 0)

        # Pagination support
        page_param = request.query_params.get("page")
        page_size_param = request.query_params.get("page_size")

        if page_size_param and str(page_size_param).lower() in {"all", "-1"}:
            paginated_qs = qs
            page = 1
            page_size = total_count
            total_pages = 1
        elif page_param or page_size_param:
            try:
                page = max(1, int(page_param or 1))
                page_size = max(1, int(page_size_param or 10))
            except (ValueError, TypeError):
                page = 1
                page_size = 10
            total_pages = max(1, math.ceil(total_count / page_size))
            start_idx = (page - 1) * page_size
            paginated_qs = qs[start_idx : start_idx + page_size]
        else:
            # Default: return all records for full compatibility with unpaginated callers
            paginated_qs = qs
            page = 1
            page_size = total_count
            total_pages = 1

        customer = Customer.objects.filter(user=user).first()
        history_data = []

        for q in paginated_qs:
            price = float(q.price or 0)

            # Resolve employee name
            if q.assigned_employee:
                staff_name = f"{q.assigned_employee.first_name} {q.assigned_employee.last_name}".strip()
            else:
                staff_name = "—"

            # Resolve branch name
            branch_name = ""
            if q.booking and q.booking.branch:
                branch_name = q.booking.branch.name
            elif q.branch:
                branch_name = q.branch.name
            elif q.branch_name:
                branch_name = q.branch_name

            # Resolve vehicle
            vehicle = (q.vehicle or "") or (q.booking.vehicle if q.booking else "") or ""
            plate   = (q.plate_number or "") or (q.booking.plate_number if q.booking else "") or ""

            rating_score = (
                q.booking.rating.score
                if q.booking and hasattr(q.booking, "rating")
                else q.rating_score
            )
            rating_comment = (
                q.booking.rating.comment
                if q.booking and hasattr(q.booking, "rating")
                else (q.rating_comment or "")
            )

            history_data.append({
                "id":           q.id,
                "booking_id":   q.booking.id if q.booking else None,
                "queue_id":     q.id,
                "service":      q.service or (q.booking.service if q.booking else ""),
                "date":         q.completed_at.date().isoformat() if q.completed_at else None,
                "price":        price,
                "staff":        staff_name,
                "branch":       branch_name,
                "vehicle":      vehicle,
                "plate_number": plate,
                "payment_method": q.payment_method or "",
                "status":       q.status,
                "rating":       rating_score,
                "review":       rating_comment,
            })

        # Calculate average rating across customer's history
        ratings = []
        for q in qs:
            if q.booking and hasattr(q.booking, "rating"):
                ratings.append(q.booking.rating.score)
            elif q.rating_score:
                ratings.append(q.rating_score)
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

        return Response({
            "history":        history_data,
            "total_services": total_count,
            "total_spent":    total_spent,
            "avg_rating":     avg_rating,
            "loyalty_points": customer.loyalty_points if customer else 0,
            "page":           page,
            "page_size":      page_size,
            "total_pages":    total_pages,
            "has_next":       page < total_pages,
            "has_previous":   page > 1,
        })
