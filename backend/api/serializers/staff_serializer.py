# api/serializers/staff_serializer.py
from rest_framework import serializers
from django.db import transaction
from ..models import User, Staff


class StaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Staff
        fields = [
            "id",
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
            "role",
            "branch",
            "status",
        ]

    def create(self, validated_data):
        email = validated_data.pop("email")
        password = validated_data.pop("password")

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password
            )
            staff = Staff.objects.create(user=user, **validated_data)

        return staff