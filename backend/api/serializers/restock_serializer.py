from rest_framework import serializers
from ..models import RestockRequest


class RestockRequestSerializer(serializers.ModelSerializer):
    inventory_item_name = serializers.CharField(source="inventory_item.name", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    requested_by_name = serializers.SerializerMethodField()
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = RestockRequest
        fields = [
            "id",
            "inventory_item",
            "inventory_item_name",
            "branch",
            "branch_name",
            "requested_by",
            "requested_by_name",
            "quantity_requested",
            "notes",
            "request_type",
            "status",
            "reviewed_by",
            "reviewed_by_name",
            "reviewer_note",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "requested_by",
            "reviewed_by",
            "reviewed_at",
            "created_at",
            "updated_at",
            "status",
            "request_type",
        ]

    def get_requested_by_name(self, obj):
        if not obj.requested_by:
            return ""
        return f"{obj.requested_by.first_name} {obj.requested_by.last_name}".strip()

    def get_reviewed_by_name(self, obj):
        if not obj.reviewed_by:
            return ""
        return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}".strip()
