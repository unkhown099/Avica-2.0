from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from ..models import User


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create(
            email=validated_data["email"],
            password_hash=make_password(password)
        )
        return user