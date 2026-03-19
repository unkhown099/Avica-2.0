from rest_framework import serializers
from ..models import Service, Branch


class BranchNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ["id", "name"]


class ServiceSerializer(serializers.ModelSerializer):
    branches     = BranchNameSerializer(many=True, read_only=True)
    branch_ids   = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), many=True, write_only=True, source="branches"
    )
    price_display = serializers.SerializerMethodField()

    class Meta:
        model  = Service
        fields = [
            "id", "name", "category", "description",
            "duration", "price_min", "price_max", "price_display",
            "is_active", "branches", "branch_ids", "created_at",
        ]

    def get_price_display(self, obj):
        lo = int(obj.price_min)
        hi = int(obj.price_max)
        if lo == hi:
            return f"₱{lo:,}"
        return f"₱{lo:,} - ₱{hi:,}"