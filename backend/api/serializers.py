# api/serializers.py
from rest_framework import serializers
from .models import User, Staff
from django.contrib.auth.hashers import make_password
from django.db import transaction

class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'password']

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['password_hash'] = make_password(password)
        return super().create(validated_data)

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

        with transaction.atomic():  # start transaction
            user = User.objects.create(
                email=email,
                password_hash=make_password(password)
            )
            staff = Staff.objects.create(user=user, **validated_data)
        
        return staff