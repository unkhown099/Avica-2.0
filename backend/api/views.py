# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import SignupSerializer
from .models import Customer
from django.contrib.auth import authenticate, login, logout, get_user_model
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from .models import User
class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Create corresponding customer record
            Customer.objects.create(
                user=user,
                first_name=request.data.get('first_name'),
                last_name=request.data.get('last_name'),
                phone=request.data.get('phone'),
                loyalty_points=0
            )

            return Response({
                "success": True,
                "title": "Account Created!",
                "message": "Welcome! Your customer account has been successfully created."
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "success": False,
            "title": "Signup Failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()

        if not email or not password:
            return Response({"success": False, "message": "Email and password required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"success": False, "message": "Invalid credentials"}, status=401)

        if not check_password(password, user.password_hash):
            return Response({"success": False, "message": "Invalid credentials"}, status=401)

        login(request, user)
        return Response({"success": True, "message": "Login successful", "user": {"id": user.id, "email": user.email}}, status=200)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"success": True, "message": "Logged out"}, status=status.HTTP_200_OK)