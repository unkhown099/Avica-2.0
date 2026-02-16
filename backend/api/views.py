# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import SignupSerializer, StaffSerializer
from .models import Customer
from django.contrib.auth import authenticate, login, logout, get_user_model
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from .models import User, Staff

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

    def get(self, request):
        return Response({"message": "Signup endpoint. Use POST."})

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

        # Determine role: check if this user has a staff profile with role "Admin"
        try:
            staff_profile = user.staff_profile  # OneToOneField related_name
            if staff_profile.role == "Admin":
                user_role = "admin"
            else:
                user_role = "staff"  # other staff roles
        except Staff.DoesNotExist:
            user_role = "customer"

        return Response({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user_role
            }
        }, status=200)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"success": True, "message": "Logged out"}, status=status.HTTP_200_OK)

class StaffView(APIView):
    permission_classes = [AllowAny]  # change later to admin-only

    def get(self, request):
        staff = Staff.objects.select_related("user").all()

        data = []
        for s in staff:
            data.append({
                "id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "email": s.user.email,
                "phone": s.phone,
                "role": s.role,
                "branch": s.branch,
                "status": s.status,
                "lastLogin": s.user.last_login,
            })

        return Response(data)

    def post(self, request):
        serializer = StaffSerializer(data=request.data)
        if serializer.is_valid():
            staff = serializer.save()
            return Response({
                "success": True,
                "staff_id": staff.id
            }, status=201)

        return Response(serializer.errors, status=400)