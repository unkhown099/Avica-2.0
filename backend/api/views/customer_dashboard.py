from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from api.models import Booking, QueueEntry, Customer

class CustomerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        upcoming = Booking.objects.filter(
            user=user,
            status__in=["pending", "confirmed"]
        ).order_by("date")

        history = QueueEntry.objects.filter(
            booking__user=user,
            status="done"
        ).order_by("-completed_at")

        customer = Customer.objects.filter(user=user).first()

        upcoming_data = [
            {
                "id": b.id,
                "service": b.service,
                "date": b.date,
                "time": b.time,
                "status": b.status,
                "price": b.price
            }
            for b in upcoming
        ]

        history_data = [
            {
                "id": q.id,
                "service": q.service,
                "date": q.completed_at,
                "status": q.status,
                "price": q.booking.price if q.booking else ""
            }
            for q in history
        ]

        stats = {
            "upcoming": upcoming.count(),
            "completed": history.count(),
            "points": customer.loyalty_points if customer else 0,
            "rating": 5.0
        }

        return Response({
            "stats": stats,
            "upcoming_bookings": upcoming_data,
            "service_history": history_data
        })