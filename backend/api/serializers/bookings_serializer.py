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
            "notes", "status", "staff", "created_at",
            "cancellation_reason",  # 👈 ADD THIS
        ]
        read_only_fields = ["id", "service_name", "staff", "created_at"]

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