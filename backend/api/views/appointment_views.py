from datetime import datetime, timedelta
from django.utils import timezone
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

        schedule_view = request.query_params.get("schedule_view")
        start_date    = request.query_params.get("start_date")
        end_date      = request.query_params.get("end_date")
        date_param    = request.query_params.get("date")
        year          = request.query_params.get("year")
        month         = request.query_params.get("month")
        status_param  = request.query_params.get("status")
        branch        = request.query_params.get("branch")

        qs = Booking.objects.select_related(
            "user", "user__customer_profile", "branch"
        ).all()

        today = timezone.localtime().date()

        if schedule_view in ["two_weeks", "previous_two_weeks"]:
            two_weeks_ago = today - timedelta(days=14)
            qs = qs.filter(date__gte=two_weeks_ago, date__lte=today)
        elif schedule_view in ["year", "current_year"]:
            target_year = int(year) if (year and str(year).isdigit()) else today.year
            qs = qs.filter(date__year=target_year)
        elif start_date and end_date:
            try:
                sd = datetime.strptime(start_date, "%Y-%m-%d").date()
                ed = datetime.strptime(end_date, "%Y-%m-%d").date()
                qs = qs.filter(date__gte=sd, date__lte=ed)
            except ValueError:
                pass
        elif year and month:
            try:
                qs = qs.filter(date__year=int(year), date__month=int(month))
            except ValueError:
                pass
        elif year:
            try:
                qs = qs.filter(date__year=int(year))
            except ValueError:
                pass
        elif date_param:
            qs = qs.filter(date=date_param)

        if status_param and status_param != "all":
            qs = qs.filter(status=status_param)

        if normalized_role == "branch_manager":
            if requester_staff and requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()
        elif branch and branch not in ["all", "All", "All Branches"]:
            if str(branch).isdigit():
                qs = qs.filter(branch_id=int(branch))
            else:
                qs = qs.filter(branch__name__iexact=str(branch))

        serializer = AppointmentSerializer(qs.order_by("date", "time"), many=True)
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
