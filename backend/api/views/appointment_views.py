from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from ..models import Booking, Branch
from ..serializers.appointment_serializer import AppointmentSerializer


class AdminAppointmentListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        year   = request.query_params.get("year")
        month  = request.query_params.get("month")
        branch = request.query_params.get("branch")

        qs = Booking.objects.select_related(
            "user", "user__customer_profile", "branch"
        ).all()

        if year and month:
            qs = qs.filter(date__year=year, date__month=month)
        if branch:
            qs = qs.filter(branch__name=branch)

        serializer = AppointmentSerializer(qs, many=True)
        return Response(serializer.data)


class AdminAppointmentDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return Booking.objects.select_related(
                "user", "user__customer_profile", "branch"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return None

    def patch(self, request, pk):
        booking = self.get_object(pk)
        if not booking:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = AppointmentSerializer(booking, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        booking = self.get_object(pk)
        if not booking:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)