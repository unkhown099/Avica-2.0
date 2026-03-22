from rest_framework import serializers
from ..models import InventoryItem, Branch


class InventoryItemSerializer(serializers.ModelSerializer):
    status      = serializers.ReadOnlyField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch      = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model  = InventoryItem
        fields = [
            "id", "name", "category", "sku", "quantity", "minimum_qty",
            "unit", "price", "supplier", "branch", "branch_name",
            "status", "is_active", "created_at", "updated_at",
        ]
        extra_kwargs = {
            "sku": {"required": False},
        }

    def _generate_sku(self, category):
        prefix_map = {
            "Lubricants": "LUB",
            "Brakes": "BRK",
            "Filters": "FIL",
            "Batteries": "BAT",
            "Tires": "TIR",
            "Ignition": "IGN",
            "Other": "OTH",
        }
        prefix = prefix_map.get(category, "ITM")
        next_number = InventoryItem.objects.filter(category=category).count() + 1

        while True:
            candidate = f"{prefix}-{next_number:04d}"
            if not InventoryItem.objects.filter(sku=candidate).exists():
                return candidate
            next_number += 1

    def create(self, validated_data):
        if not validated_data.get("sku"):
            validated_data["sku"] = self._generate_sku(validated_data.get("category"))
        return super().create(validated_data)
