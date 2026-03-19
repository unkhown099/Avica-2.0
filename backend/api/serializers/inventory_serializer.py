from rest_framework import serializers
from ..models import InventoryItem, Branch


class InventoryItemSerializer(serializers.ModelSerializer):
    status      = serializers.ReadOnlyField()
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    branch      = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.all(), allow_null=True
    )

    class Meta:
        model  = InventoryItem
        fields = [
            "id", "name", "category", "sku", "quantity", "minimum_qty",
            "unit", "price", "supplier", "branch", "branch_name",
            "status", "created_at", "updated_at",
        ]