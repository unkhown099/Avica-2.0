from rest_framework import serializers

from api.models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "staff",
            "staff_name",
            "branch",
            "branch_name",
            "queue_entry",
            "transaction_type",
            "description",
            "quantity",
            "amount",
            "payment_method",
            "notes",
            "paid_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "staff",
            "staff_name",
            "branch",
            "branch_name",
            "created_at",
        ]

    def get_staff_name(self, obj):
        if not obj.staff:
            return "System"
        return f"{obj.staff.first_name} {obj.staff.last_name}".strip()

    def get_branch_name(self, obj):
        if not obj.branch:
            return ""
        return obj.branch.name
