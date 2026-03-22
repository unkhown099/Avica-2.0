# api/serializers/token_serializer.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        try:
            token["role"] = user.staff_profile.role
        except Exception:
            token["role"] = None
        return token