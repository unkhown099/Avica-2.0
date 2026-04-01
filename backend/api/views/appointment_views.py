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
        if not requester_staff or requester_staff.role not in ("Admin", "Business Owner", "super_admin", "Branch Manager"):
            return Response({"detail": "Permission denied."}, status=403)

        year   = request.query_params.get("year")
        month  = request.query_params.get("month")
        branch = request.query_params.get("branch")

        qs = Booking.objects.select_related(
            "user", "user__customer_profile", "branch"
        ).all()

        if year and month:
            qs = qs.filter(date__year=year, date__month=month)
        if requester_staff.role == "Branch Manager":
            if requester_staff.branch_id:
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
