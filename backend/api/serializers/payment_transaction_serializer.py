from rest_framework import serializers

from api.models import PaymentTransaction


class PaymentTransactionSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    vehicle = serializers.SerializerMethodField()
    plate_number = serializers.SerializerMethodField()
    service = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            "id",
            "staff",
            "staff_name",
            "branch",
            "branch_name",
            "queue_entry",
            "customer_name",
            "vehicle",
            "plate_number",
            "service",
            "phone",
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

    def get_customer_name(self, obj):
        if obj.queue_entry:
            return obj.queue_entry.customer_name or ""
        return ""

    def get_vehicle(self, obj):
        if obj.queue_entry:
            return obj.queue_entry.vehicle or ""
        return ""

    def get_plate_number(self, obj):
        if obj.queue_entry:
            return obj.queue_entry.plate_number or ""
        return ""

    def get_service(self, obj):
        if obj.queue_entry:
            return obj.queue_entry.service or ""
        return obj.description or ""

    def get_phone(self, obj):
        if obj.queue_entry:
            return obj.queue_entry.phone or ""
        return ""

