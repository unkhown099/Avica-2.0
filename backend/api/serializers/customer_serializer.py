from rest_framework import serializers
from ..models import Customer, Booking, QueueEntry, Rating
from django.db.models import Sum, Avg


class CustomerSerializer(serializers.ModelSerializer):
    email        = serializers.EmailField(source="user.email", read_only=True)
    total_spent  = serializers.SerializerMethodField()
    visits       = serializers.SerializerMethodField()
    avg_rating   = serializers.SerializerMethodField()
    segment      = serializers.SerializerMethodField()

    class Meta:
        model  = Customer
        fields = [
            "id", "first_name", "last_name", "email", "phone",
            "loyalty_points", "total_spent", "visits", "avg_rating", "segment",
        ]

    def _paid_completed_entries(self, obj):
        return QueueEntry.objects.filter(
            booking__user=obj.user,
            status="done",
            payment_status="paid",
        )

    def get_total_spent(self, obj):
        total = self._paid_completed_entries(obj).aggregate(total=Sum("price"))["total"]
        return float(total or 0)

    def get_visits(self, obj):
        return Booking.objects.filter(user=obj.user).count()

    def get_avg_rating(self, obj):
        avg = Rating.objects.filter(customer=obj).aggregate(Avg("score"))["score__avg"]
        return round(avg, 1) if avg else None

    def get_segment(self, obj):
        visits = Booking.objects.filter(user=obj.user).count()
        total = float(
            self._paid_completed_entries(obj).aggregate(total=Sum("price"))["total"] or 0
        )
        if total >= 50000 or visits >= 15:
            return "High Value"
        elif visits == 0:
            return "New"
        elif visits <= 3:
            return "New"
        elif total < 10000:
            return "At Risk"
        else:
            return "Regular"