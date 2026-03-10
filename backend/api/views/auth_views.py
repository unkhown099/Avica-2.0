from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.hashers import check_password
from ..serializers.auth_serializer import SignupSerializer
from ..models import User, Customer, Staff

class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Create corresponding customer record
            Customer.objects.create(
                user=user,
                first_name=request.data.get("first_name"),
                last_name=request.data.get("last_name"),
                phone=request.data.get("phone"),
                loyalty_points=0,
            )

            return Response(
                {
                    "success": True,
                    "title": "Account Created!",
                    "message": "Welcome! Your customer account has been successfully created.",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "title": "Signup Failed", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            email = request.data.get("email", "").strip()
            password = request.data.get("password", "").strip()

            print("Login attempt:", email, password)

            if not email or not password:
                return Response({"success": False, "message": "Email and password required"}, status=400)

            user = authenticate(email=email, password=password)
            print("User authenticated?", user)

            if not user:
                return Response({"success": False, "message": "Invalid credentials"}, status=401)

            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)

            ROLE_MAP = {
                "Admin": "admin",
                "Business Owner": "business_owner",
                "Branch Manager": "branch_manager",
                "Staff": "staff",
                "Employee": "employee",
            }

            try:
                staff_profile = user.staff_profile
                user_role = ROLE_MAP.get(staff_profile.role, "staff")
            except Staff.DoesNotExist:
                user_role = "customer"

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": {"id": user.id, "email": user.email, "role": user_role},
                    "tokens": {"access": access_token, "refresh": str(refresh)},
                },
                status=200,
            )
        except Exception as e:
            # Always return JSON for debugging
            print("Login error:", e)
            return Response({"success": False, "message": str(e)}, status=500)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"success": False, "message": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"success": True, "message": "Logged out successfully"},
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {"success": False, "message": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
    
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            role = user.staff_profile.role.lower()
        except Staff.DoesNotExist:
            role = "customer"

        return Response({
            "id": user.id,
            "email": user.email,
            "role": role
        })