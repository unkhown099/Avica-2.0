from rest_framework import serializers
from ..models import Branch, Booking


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = ["id", "name", "address", "hours", "slots"]


class BookingSerializer(serializers.ModelSerializer):
    branch_detail = BranchSerializer(source="branch", read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True),
        source="branch",
        write_only=True,
        required=False,
    )

    # CharField — expose service name directly (service field IS the name)
    service_name = serializers.CharField(source="service", read_only=True)

    # Read price as float for clean JSON output
    # NOT in read_only_fields so the frontend-sent price value is saved to DB
    price = serializers.SerializerMethodField()

    # Writable price field — accepts the incoming price from the frontend
    price_input = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        write_only=True, required=False, source="price"
    )

    assigned_employee_id = serializers.SerializerMethodField()
    assigned_employee_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    # 👈 ADD THIS FIELD - make it writeable so frontend can send cancellation reason
    cancellation_reason = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True,
        write_only=False  # This makes it readable and writable
    )

    class Meta:
        model  = Booking
        fields = [
            "id", "service", "service_name",
            "price", "price_input",
            "branch_id", "branch_detail",
            "date", "time", "vehicle", "plate_number",
            "notes", "status", "staff",
            "customer_name",
            "assigned_employee_id", "assigned_employee_name",
            "created_at",
            "notes", "status", "staff", "created_at",
            "cancellation_reason",  # 👈 ADD THIS
        ]
        read_only_fields = ["id", "service_name", "staff", "created_at"]

    def get_assigned_employee_id(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.assigned_employee_id:
            return queue_entry.assigned_employee_id
        return None

    def get_assigned_employee_name(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.assigned_employee:
            return f"{queue_entry.assigned_employee.first_name} {queue_entry.assigned_employee.last_name}".strip()
        if instance.staff and instance.staff != "TBA":
            return instance.staff
        return ""

    def get_customer_name(self, instance):
        profile = getattr(instance.user, "customer_profile", None)
        if profile:
            full_name = f"{profile.first_name} {profile.last_name}".strip()
            if full_name:
                return full_name

        notes = (instance.notes or "").strip()
        if notes.lower().startswith("[walk-in]"):
            walkin_payload = notes[len("[walk-in]"):].strip()
            name_part = walkin_payload.split("|")[0].strip()
            if name_part:
                return name_part

        return "Unknown Customer"

    def get_price(self, instance):
        try:
            return float(
                str(instance.price).replace("₱", "").replace(",", "").strip()
            )
        except (ValueError, TypeError):
            return 0.0

    def validate(self, attrs):
        if not attrs.get("branch"):
            raise serializers.ValidationError({"branch_id": "A valid branch is required."})
        return attrs

    def to_internal_value(self, data):
        data = data.copy()
        branch_val = data.get("branch")
        if branch_val and isinstance(branch_val, str) and not branch_val.isdigit():
            data.pop("branch")
            try:
                branch = Branch.objects.get(name=branch_val, is_active=True)
                data["branch_id"] = branch.pk
            except Branch.DoesNotExist:
                raise serializers.ValidationError(
                    {"branch": f"Branch '{branch_val}' not found or is inactive."}
                )

        # Map frontend "price" key → "price_input" so our write field picks it up
        if "price" in data and "price_input" not in data:
            data["price_input"] = data["price"]

        return super().to_internal_value(data)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["branch"] = instance.branch.name if instance.branch else ""
        # Remove the write-only field from output (already excluded, just safety)
        rep.pop("price_input", None)
        return rep
class AvailableSlotsSerializer(serializers.Serializer):
    """Serializer for available time slots response"""
    available_slots = serializers.DictField(
        child=serializers.BooleanField(),
        help_text="Dictionary of time slots with availability status (true = available, false = unavailable)"
    )