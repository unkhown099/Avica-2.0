from rest_framework import serializers


class ManagerScheduleConfigSerializer(serializers.Serializer):
    config = serializers.JSONField()

    def validate_config(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("config must be an object")
        return value
