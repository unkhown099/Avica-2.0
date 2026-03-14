from rest_framework import serializers
from ..models import Branch, Booking


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = ["id", "name", "address", "hours", "slots"]


class BookingSerializer(serializers.ModelSerializer):
    # Read: return branch as nested object
    branch_detail = BranchSerializer(source="branch", read_only=True)

    # Write: accept branch by PK (resolved from name string in to_internal_value)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True),
        source="branch",
        write_only=True,
        required=False,
    )

    class Meta:
        model  = Booking
        fields = [
            "id", "service", "price",
            "branch_id", "branch_detail",
            "date", "time", "vehicle", "plate_number",
            "notes", "status", "staff", "created_at",
        ]
        read_only_fields = ["id", "status", "staff", "created_at"]

    def validate_date(self, value):
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("Booking date cannot be in the past.")
        return value

    def validate(self, attrs):
        if not attrs.get("branch"):
            raise serializers.ValidationError({"branch": "A valid branch is required."})
        return attrs

    def to_internal_value(self, data):
        """
        Frontend sends { "branch": "Caloocan Branch", ... }
        We resolve the name → Branch PK so DRF validates normally.
        """
        data = data.copy()

        if "branch" in data and isinstance(data["branch"], str):
            branch_name = data.pop("branch")
            try:
                branch = Branch.objects.get(name=branch_name, is_active=True)
                data["branch_id"] = branch.pk
            except Branch.DoesNotExist:
                raise serializers.ValidationError(
                    {"branch": f"Branch '{branch_name}' not found or is inactive."}
                )

        return super().to_internal_value(data)

    def to_representation(self, instance):
        """Flatten branch back to name string for the frontend."""
        rep = super().to_representation(instance)
        rep["branch"] = instance.branch.name if instance.branch else ""
        return rep