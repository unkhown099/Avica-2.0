from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone
from api.models import Booking, QueueEntry, Customer


class CustomerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        now = timezone.now()
        today = now.date()

        # FIX 1: Only return upcoming bookings with a future date
        # Bookings that are pending/confirmed but dated in the past are excluded
        upcoming = Booking.objects.filter(
            user=user,
            status__in=["pending", "confirmed"],
            date__gte=today          # must be today or future
        ).order_by("date", "time")

        # Service history — all completed queue entries, newest first
        # No date filter: return full history
        history = QueueEntry.objects.filter(
            Q(booking__user=user) | Q(customer_user=user),
            status="done",
            payment_status="paid",
        ).select_related("booking").order_by("-completed_at")

        customer = Customer.objects.filter(user=user).first()

        # FIX 2: Safely resolve service name and price whether they are
        # plain fields, related objects, or decorated properties
        def resolve_service(obj):
            val = getattr(obj, "service", None)
            if val is None:
                return ""
            # If it's a related model instance, try common name fields
            if hasattr(val, "name"):
                return str(val.name)
            return str(val)

        def resolve_price(obj):
            val = getattr(obj, "price", None)
            if val is None:
                return ""
            return str(val)

        upcoming_data = [
            {
                "id": b.id,
                "service": resolve_service(b),
                # Always send date as ISO string — frontend formatDate() handles display
                "date": b.date.isoformat() if b.date else None,
                # Send time as HH:MM — b.time is stored as a string, slice to strip seconds
                "time": str(b.time)[:5] if b.time else None,
                "status": b.status,
                "price": resolve_price(b),
            }
            for b in upcoming
        ]

        history_data = [
            {
                "id": q.id,
                "service": resolve_service(q),
                # completed_at is a datetime — send date portion only
                "date": q.completed_at.date().isoformat() if q.completed_at else None,
                "status": q.status,
                "price": resolve_price(q) if q.price is not None else (resolve_price(q.booking) if q.booking else ""),
            }
            for q in history
        ]

        # FIX 3: Count completed history from DB, not the queryset slice
        completed_count = QueueEntry.objects.filter(
            Q(booking__user=user) | Q(customer_user=user),
            status="done",
            payment_status="paid",
        ).count()

        stats = {
            "upcoming": upcoming.count(),
            "completed": completed_count,
            "points": customer.loyalty_points if customer else 0,
            "rating": 5.0,
        }

        return Response({
            "stats": stats,
            "upcoming_bookings": upcoming_data,
            "service_history": history_data,
        })
