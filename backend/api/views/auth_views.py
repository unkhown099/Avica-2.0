from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from ..serializers.auth_serializer import SignupSerializer
from ..models import User, Customer, Staff


class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

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


def _get_profile_data(user):
    """
    Returns (role, first_name, last_name, phone) for any user.
    Uses explicit Manager queries instead of reverse accessors to avoid
    'User has no attribute customer/staff_profile' errors regardless of
    how the FK/OneToOne related_name is defined on the model.
    """
    ROLE_MAP = {
        "Admin":          "admin",
        "Business Owner": "business_owner",
        "Branch Manager": "branch_manager",
        "Staff":          "staff",
        "Employee":       "employee",
    }

    # Check staff first
    try:
        staff = Staff.objects.get(user=user)
        return (
            ROLE_MAP.get(staff.role, "staff"),
            getattr(staff, "first_name", "") or "",
            getattr(staff, "last_name",  "") or "",
            getattr(staff, "phone",      "") or "",
        )
    except Staff.DoesNotExist:
        pass

    # Fall back to customer
    try:
        customer = Customer.objects.get(user=user)
        return (
            "customer",
            customer.first_name or "",
            customer.last_name  or "",
            customer.phone      or "",
        )
    except Customer.DoesNotExist:
        pass

    # No profile found at all
    return "customer", "", "", ""


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            email    = request.data.get("email",    "").strip()
            password = request.data.get("password", "").strip()

            print("Login attempt:", email)

            if not email or not password:
                return Response(
                    {"success": False, "message": "Email and password required"},
                    status=400,
                )

            user = authenticate(email=email, password=password)
            print("User authenticated?", user)

            if not user:
                return Response(
                    {"success": False, "message": "Invalid credentials"},
                    status=401,
                )

            user_role, first_name, last_name, phone = _get_profile_data(user)

            # Build JWT with extra claims so the frontend can decode the name
            refresh = RefreshToken.for_user(user)
            refresh["first_name"] = first_name
            refresh["last_name"]  = last_name
            refresh["email"]      = user.email
            refresh["role"]       = user_role
            refresh["phone"]      = phone

            access_token = str(refresh.access_token)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": {
                        "id":         user.id,
                        "email":      user.email,
                        "role":       user_role,
                        "first_name": first_name,
                        "last_name":  last_name,
                        "phone":      phone,
                    },
                    "tokens": {
                        "access":  access_token,
                        "refresh": str(refresh),
                    },
                },
                status=200,
            )

        except Exception as e:
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
        user_role, first_name, last_name, phone = _get_profile_data(user)

        return Response({
            "id":         user.id,
            "email":      user.email,
            "role":       user_role,
            "first_name": first_name,
            "last_name":  last_name,
            "phone":      phone,
        })