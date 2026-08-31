from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from ..models import Booking, Branch
from ..serializers.appointment_serializer import AppointmentSerializer


class AdminAppointmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = getattr(request.user, "staff_profile", None)
        is_superuser = getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False)
        staff_role = requester_staff.role if requester_staff else ""
        normalized_role = staff_role.lower().replace(" ", "_")

        allowed_roles = {"admin", "business_owner", "super_admin", "branch_manager"}
        if not is_superuser and normalized_role not in allowed_roles:
            return Response({"detail": "Permission denied."}, status=403)

        year   = request.query_params.get("year")
        month  = request.query_params.get("month")
        branch = request.query_params.get("branch")

        qs = Booking.objects.select_related(
            "user", "user__customer_profile", "branch"
        ).all()

        if year and month:
            qs = qs.filter(date__year=year, date__month=month)
        if normalized_role == "branch_manager":
            if requester_staff and requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()
        elif branch:
            qs = qs.filter(branch__name=branch)

        serializer = AppointmentSerializer(qs, many=True)
        return Response(serializer.data)


class AdminAppointmentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Booking.objects.select_related(
                "user", "user__customer_profile", "branch"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        return Response(
            {"detail": "Admin appointments are view-only."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )

    def delete(self, request, pk):
        return Response(
            {"detail": "Admin appointments are view-only."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
