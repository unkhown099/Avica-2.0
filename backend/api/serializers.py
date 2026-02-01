from rest_framework import serializers
from .models import User
from django.contrib.auth.hashers import make_password

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'password_hash']

    def create(self, validated_data):
        validated_data['password_hash'] = make_password(validated_data['password_hash'])
        return super().create(validated_data)
