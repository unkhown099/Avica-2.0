import re
from rest_framework import serializers
from api.models import QueueEntry, Staff


class AssignedEmployeeSerializer(serializers.ModelSerializer):
    full_name  = serializers.SerializerMethodField()
    branch     = serializers.SerializerMethodField()   # ← return name string, not FK int

    class Meta:
        model  = Staff
        fields = ["id", "full_name", "phone", "branch"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_branch(self, obj):
        # obj.branch is a FK — return the name string so frontend gets "Caloocan Branch"
        return obj.branch.name if obj.branch else obj.branch_name or ""


class QueueEntrySerializer(serializers.ModelSerializer):
    wait_minutes      = serializers.SerializerMethodField()
    assigned_employee = AssignedEmployeeSerializer(read_only=True)
    branch            = serializers.SerializerMethodField()   # ← return name string, not FK int
    appointment_date  = serializers.SerializerMethodField()
    appointment_time  = serializers.SerializerMethodField()

    class Meta:
        model  = QueueEntry
        fields = [
            "id",
            "booking",
            "customer_name",
            "phone",
            "vehicle",
            "vehicle_type",
            "plate_number",
            "service",
            "branch",
            "notes",
            "source",
            "status",
            "position",
            "assigned_employee",
            "appointment_date",
            "appointment_time",
            "queued_at",
            "service_started_at",
            "completed_at",
            "wait_minutes",
            "service_base_price",
            "price",
            "payment_status",
            "payment_method",
            "rating_score",
            "rating_comment",
            "rated_at",
        ]
        read_only_fields = ["id", "queued_at", "service_started_at", "completed_at"]

    def get_branch(self, obj):
        # Prefer FK name, fall back to legacy branch_name CharField
        if obj.branch:
            return obj.branch.name
        return obj.branch_name or ""

    def get_wait_minutes(self, obj):
        if obj.status != "waiting":
            return None
        ahead = QueueEntry.objects.filter(
            status="waiting", position__lt=obj.position
        ).count()
        return ahead * 30

    def get_appointment_date(self, obj):
        if not obj.booking_id or not obj.booking or not obj.booking.date:
            return None
        return obj.booking.date.isoformat()

    def get_appointment_time(self, obj):
        if not obj.booking_id or not obj.booking or not obj.booking.time:
            return None
        return str(obj.booking.time)


class QueueEntryCreateSerializer(serializers.ModelSerializer):
    """Used when staff add a walk-in directly to the queue."""
    customer_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model  = QueueEntry
        fields = [
            "customer_name",
            "phone",
            "vehicle",
            "plate_number",
            "service",
            "branch",
            "notes",
            "source",
            "customer_user",
            "customer_id",
        ]
        extra_kwargs = {
            "branch": {"required": False, "allow_null": True},
            "customer_user": {"required": False, "allow_null": True},
        }

    def create(self, validated_data):
        validated_data.pop("customer_id", None)
        validated_data.setdefault("source", "walk_in")
        validated_data.setdefault("status", "waiting")
        return super().create(validated_data)

    def validate_phone(self, value):
        phone = str(value or "").strip().replace(" ", "")
        if not re.fullmatch(r"^\+63\d{10}$", phone):
            raise serializers.ValidationError("Phone number must be in +63XXXXXXXXXX format.")
        return phone

    def validate_customer_name(self, value):
        name = str(value or "").strip()
        if len(name) < 2:
            raise serializers.ValidationError("Customer name must be at least 2 characters.")
        return name

    def validate_vehicle(self, value):
        vehicle = str(value or "").strip()
        if len(vehicle) < 2:
            raise serializers.ValidationError("Vehicle must be at least 2 characters.")
        return vehicle


class BookingToQueueSerializer(serializers.Serializer):
    """Payload for promoting a confirmed booking into the queue."""
    booking_id = serializers.IntegerField()


class AssignEmployeeSerializer(serializers.Serializer):
    """Payload for assigning an employee to a queue entry."""
    employee_id = serializers.IntegerField(allow_null=True)

from api.models import ServiceMessage

class ServiceMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = ServiceMessage
        fields = [
            "id", "queue_entry", "sender_user", "sender_type", 
            "sender_name", "message", "is_read", "created_at"
        ]
        read_only_fields = ["id", "created_at", "sender_name", "sender_user"]

    def get_sender_name(self, obj):
        if obj.sender_type == "employee" and obj.sender_user:
            # check if staff
            if hasattr(obj.sender_user, "staff_profile"):
                return f"{obj.sender_user.staff_profile.first_name} {obj.sender_user.staff_profile.last_name}"
            return "Employee"
        elif obj.sender_type == "customer":
            if obj.sender_user and hasattr(obj.sender_user, "customer_profile"):
                return f"{obj.sender_user.customer_profile.first_name} {obj.sender_user.customer_profile.last_name}"
            return "Customer"
        return "System"
