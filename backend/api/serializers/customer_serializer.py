from rest_framework import serializers
from ..models import Customer, Booking, QueueEntry, Rating, CustomerVehicle
from django.db.models import Q
from django.db.models import Sum, Avg


class CustomerVehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerVehicle
        fields = [
            "id",
            "make",
            "model",
            "year",
            "color",
            "plate_number",
            "vehicle_size",
            "is_primary",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CustomerSerializer(serializers.ModelSerializer):
    email        = serializers.EmailField(source="user.email", read_only=True)
    total_spent  = serializers.SerializerMethodField()
    visits       = serializers.SerializerMethodField()
    avg_rating   = serializers.SerializerMethodField()
    segment      = serializers.SerializerMethodField()
    address      = serializers.SerializerMethodField()
    car_make     = serializers.SerializerMethodField()
    car_model    = serializers.SerializerMethodField()
    car_year     = serializers.SerializerMethodField()
    car_color    = serializers.SerializerMethodField()
    car_plate    = serializers.SerializerMethodField()
    vehicles     = serializers.SerializerMethodField()

    class Meta:
        model  = Customer
        fields = [
            "id", "first_name", "last_name", "email", "phone",
            "address", "car_make", "car_model", "car_year", "car_color", "car_plate",
            "vehicles",
            "loyalty_points", "total_spent", "visits", "avg_rating", "segment",
        ]

    def _primary_vehicle(self, obj):
        return obj.vehicles.filter(is_primary=True).first() or obj.vehicles.first()

    def get_address(self, obj):
        return ""

    def get_car_make(self, obj):
        v = self._primary_vehicle(obj)
        return v.make if v else ""

    def get_car_model(self, obj):
        v = self._primary_vehicle(obj)
        return v.model if v else ""

    def get_car_year(self, obj):
        v = self._primary_vehicle(obj)
        return v.year if v else ""

    def get_car_color(self, obj):
        v = self._primary_vehicle(obj)
        return v.color if v else ""

    def get_car_plate(self, obj):
        v = self._primary_vehicle(obj)
        return v.plate_number if v else ""

    def get_vehicles(self, obj):
        return CustomerVehicleSerializer(obj.vehicles.all(), many=True).data

    def _paid_completed_entries(self, obj):
        return QueueEntry.objects.filter(
            Q(booking__user=obj.user) | Q(customer_user=obj.user),
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
