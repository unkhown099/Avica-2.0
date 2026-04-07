from rest_framework import serializers
from api.models import DirectMessage

class DirectMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = DirectMessage
        fields = [
            "id", "customer", "employee", "sender_type", 
            "sender_name", "message", "is_read", "created_at"
        ]
        read_only_fields = ["id", "created_at", "sender_name"]

    def get_sender_name(self, obj):
        if obj.sender_type == "employee":
            return f"{obj.employee.first_name} {obj.employee.last_name}"
        elif obj.sender_type == "customer":
            return f"{obj.customer.first_name} {obj.customer.last_name}"
        return "System"
