from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from ..serializers.staff_serializer import StaffSerializer
from ..models import Staff, User


class StaffView(APIView):
    permission_classes = [AllowAny]  # change later to admin-only

    def get(self, request):
        staff = Staff.objects.select_related("user").all()

        data = [
            {
                "id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "email": s.user.email,
                "phone": s.phone,
                "role": s.role,
                "branch": s.branch,
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
            return Response({"success": True, "staff_id": staff.id}, status=201)

        return Response(serializer.errors, status=400)