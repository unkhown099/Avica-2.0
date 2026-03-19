from rest_framework import serializers
from ..models import Booking
import decimal


class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    branch_name   = serializers.CharField(source="branch.name", read_only=True)
    price         = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = [
            "id", "customer_name", "service", "vehicle", "plate_number",
            "date", "time", "status", "staff", "notes",
            "branch", "branch_name", "price", "created_at",
        ]

    def get_customer_name(self, obj):
        try:
            p = obj.user.customer_profile
            return f"{p.first_name} {p.last_name}".strip()
        except Exception:
            return obj.user.email

    def get_price(self, obj):
        try:
            return float(str(obj.price).replace("₱", "").replace(",", "").strip())
        except Exception:
            return 0.0