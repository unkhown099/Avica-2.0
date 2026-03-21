from rest_framework import serializers
from ..models import InventoryTransaction


class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.SerializerMethodField()
    item_sku = serializers.SerializerMethodField()
    performed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = InventoryTransaction
        fields = [
            "id",
            "inventory_item",
            "item_name",
            "item_sku",
            "action_type",
            "quantity_before",
            "quantity_after",
            "quantity_changed",
            "branch_name",
            "target_branch_name",
            "performed_by",
            "performed_by_name",
            "notes",
            "created_at",
        ]

    def get_item_name(self, obj):
        if not obj.inventory_item:
            return "Unknown Item"
        return obj.inventory_item.name

    def get_item_sku(self, obj):
        if not obj.inventory_item:
            return ""
        return obj.inventory_item.sku

    def get_performed_by_name(self, obj):
        if not obj.performed_by:
            return "System"
        return f"{obj.performed_by.first_name} {obj.performed_by.last_name}".strip()
