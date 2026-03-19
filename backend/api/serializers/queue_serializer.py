from rest_framework import serializers
from api.models import QueueEntry, Staff


class AssignedEmployeeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Staff
        fields = ["id", "full_name", "phone", "branch"]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class QueueEntrySerializer(serializers.ModelSerializer):
    wait_minutes      = serializers.SerializerMethodField()
    assigned_employee = AssignedEmployeeSerializer(read_only=True)

    class Meta:
        model = QueueEntry
        fields = [
            "id",
            "booking",
            "customer_name",
            "phone",
            "vehicle",
            "plate_number",
            "service",
            "branch",
            "notes",
            "source",
            "status",
            "position",
            "assigned_employee",
            "queued_at",
            "service_started_at",
            "completed_at",
            "wait_minutes",
            "price",           # ← add
            "payment_status",  # ← add
            "payment_method",  # ← add
        ]
        read_only_fields = ["id", "queued_at", "service_started_at", "completed_at"]

    def get_wait_minutes(self, obj):
        if obj.status != "waiting":
            return None
        ahead = QueueEntry.objects.filter(
            status="waiting", position__lt=obj.position
        ).count()
        return ahead * 30


class QueueEntryCreateSerializer(serializers.ModelSerializer):
    """Used when staff add a walk-in directly to the queue."""

    class Meta:
        model = QueueEntry
        fields = [
            "customer_name",
            "phone",
            "vehicle",
            "plate_number",
            "service",
            "branch",
            "notes",
            "source",
        ]

    def create(self, validated_data):
        validated_data.setdefault("source", "walk_in")
        validated_data.setdefault("status", "waiting")
        return super().create(validated_data)


class BookingToQueueSerializer(serializers.Serializer):
    """Payload for promoting a confirmed booking into the queue."""
    booking_id = serializers.IntegerField()


class AssignEmployeeSerializer(serializers.Serializer):
    """Payload for assigning an employee to a queue entry."""
    employee_id = serializers.IntegerField(allow_null=True)