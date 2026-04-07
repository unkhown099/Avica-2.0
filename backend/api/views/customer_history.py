from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from api.models import QueueEntry, Customer


class CustomerHistoryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Include paid completed services from:
        # 1) booking-linked entries for this user
        # 2) walk-ins linked to this user's account
        history = QueueEntry.objects.filter(
            Q(booking__user=user) | Q(customer_user=user),
            status="done",
            payment_status="paid",
        ).select_related(
            "booking",
            "booking__branch",
            "assigned_employee",
            "customer_user",
        ).order_by("-completed_at")

        customer = Customer.objects.filter(user=user).first()

        history_data = []
        total_spent = 0.0

        for q in history:
            price = float(q.price or 0)
            total_spent += price

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
                # Rating data — None if not yet rated
                "rating":       rating_score,
                "review":       rating_comment,
            })

        # Summary stats
        ratings = []
        for q in history:
            if q.booking and hasattr(q.booking, "rating"):
                ratings.append(q.booking.rating.score)
            elif q.rating_score:
                ratings.append(q.rating_score)
        avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else None

        return Response({
            "history":      history_data,
            "total_services": len(history_data),
            "total_spent":  total_spent,
            "avg_rating":   avg_rating,
            "loyalty_points": customer.loyalty_points if customer else 0,
        })
