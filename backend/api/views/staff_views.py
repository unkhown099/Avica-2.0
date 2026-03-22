# api/views/staff_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..serializers.staff_serializer import StaffSerializer
from ..models import Staff


def _branch_name(staff):
    """Return branch as a plain string — handles FK or legacy branch_name."""
    if staff.branch:
        return staff.branch.name
    return staff.branch_name or ""


class StaffView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = getattr(request.user, "staff_profile", None)
        staff = Staff.objects.select_related("user", "branch").all()

        # Non-admin staff can only view staff in their own branch.
        if requester_staff and requester_staff.role != "Admin":
            if requester_staff.branch_id:
                staff = staff.filter(branch_id=requester_staff.branch_id)
            else:
                staff = staff.none()

        data = [
            {
                "id": s.id,
                "first_name": s.first_name,
                "last_name": s.last_name,
                "name": f"{s.first_name} {s.last_name}",
                "email": s.user.email,
                "phone": s.phone,
                "role": s.role,
                "branch": _branch_name(s),
                "branch_id": s.branch_id,
                "status": s.status,
                "lastLogin": s.user.last_login,
            }
            for s in staff
        ]

        return Response(data)

    def post(self, request):
        serializer = StaffSerializer(data=request.data)
        if serializer.is_valid():
            staff = serializer.save()
            return Response(
                {
                    "id": staff.id,
                    "first_name": staff.first_name,
                    "last_name": staff.last_name,
                    "name": f"{staff.first_name} {staff.last_name}",
                    "email": staff.user.email,
                    "phone": staff.phone,
                    "role": staff.role,
                    "branch": _branch_name(staff),
                    "branch_id": staff.branch_id,
                    "status": staff.status,
                    "lastLogin": staff.user.last_login,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)


class StaffDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        requester_staff = getattr(request.user, "staff_profile", None)
        try:
            staff = Staff.objects.select_related("user", "branch").get(pk=pk)
        except Staff.DoesNotExist:
            return Response({"detail": "Staff not found."}, status=404)

        if (
            requester_staff
            and requester_staff.role != "Admin"
            and requester_staff.branch_id != staff.branch_id
        ):
            return Response({"detail": "Not authorized."}, status=403)

        serializer = StaffSerializer(staff, data=request.data, partial=True)
        if serializer.is_valid():
            updated_staff = serializer.save()
            return Response(
                {
                    "id": updated_staff.id,
                    "first_name": updated_staff.first_name,
                    "last_name": updated_staff.last_name,
                    "name": f"{updated_staff.first_name} {updated_staff.last_name}",
                    "email": updated_staff.user.email,
                    "phone": updated_staff.phone,
                    "role": updated_staff.role,
                    "branch": _branch_name(updated_staff),
                    "branch_id": updated_staff.branch_id,
                    "status": updated_staff.status,
                    "lastLogin": updated_staff.user.last_login,
                }
            )
        return Response(serializer.errors, status=400)


class VerifyPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        password = request.data.get("password", "")
        if not password:
            return Response({"detail": "Password is required."}, status=400)
        if not request.user.check_password(password):
            return Response({"detail": "Invalid password."}, status=400)
        return Response({"verified": True}, status=200)
