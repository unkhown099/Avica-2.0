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
        staff = Staff.objects.select_related("user", "branch").all()

        data = [
            {
                "id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "email": s.user.email,
                "phone": s.phone,
                "role": s.role,
                "branch": _branch_name(s),
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
                    "name": f"{staff.first_name} {staff.last_name}",
                    "email": staff.user.email,
                    "phone": staff.phone,
                    "role": staff.role,
                    "branch": _branch_name(staff),
                    "status": staff.status,
                    "lastLogin": staff.user.last_login,
                },
                status=201,
            )
        return Response(serializer.errors, status=400)