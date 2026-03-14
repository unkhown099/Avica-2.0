from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from ..models import Branch, Booking
from ..serializers.bookings_serializer import BranchSerializer, BookingSerializer  # ✅ correct import


# ─── Helper: check if user is staff/manager/admin ────────────────────────────

def is_staff_or_above(user):
    """Returns True if the user has a staff profile with a privileged role."""
    try:
        role = user.staff_profile.role
        return role in ["Admin", "Business Owner", "Branch Manager", "Staff", "Employee"]
    except Exception:
        return False


# ─── Customer-facing views ────────────────────────────────────────────────────

class BranchListView(generics.ListAPIView):
    """GET /api/branches/ — public list of active branches"""
    queryset           = Branch.objects.filter(is_active=True)
    serializer_class   = BranchSerializer
    permission_classes = [permissions.AllowAny]


class BookingListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/bookings/      — customer sees their own bookings
    POST /api/bookings/      — customer creates a booking
    """
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status="pending")


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/bookings/<id>/   — customer views own booking
    PATCH  /api/bookings/<id>/   — customer reschedules or cancels
    DELETE /api/bookings/<id>/   — customer deletes
    """
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.status == "cancelled":
            return Response(
                {"detail": "Cancelled bookings cannot be modified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().partial_update(request, *args, **kwargs)


# ─── Staff / Manager views ────────────────────────────────────────────────────

class StaffBookingListView(generics.ListAPIView):
    """
    GET /api/staff/bookings/
    Staff & managers see ALL bookings (optionally filtered by date or status).
    Query params:
      ?date=2026-03-14        filter by date
      ?status=pending         filter by status
      ?branch=Caloocan Branch filter by branch name
    """
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_staff_or_above(self.request.user):
            return Booking.objects.none()

        qs = Booking.objects.all().select_related("branch", "user")

        date   = self.request.query_params.get("date")
        status = self.request.query_params.get("status")
        branch = self.request.query_params.get("branch")

        if date:
            qs = qs.filter(date=date)
        if status:
            qs = qs.filter(status=status)
        if branch:
            qs = qs.filter(branch__name=branch)

        return qs.order_by("date", "time")


class StaffBookingActionView(APIView):
    """
    PATCH /api/staff/bookings/<id>/action/
    Staff or manager approves (confirmed) or rejects (cancelled) a booking.
    Body: { "status": "confirmed" } or { "status": "cancelled" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not is_staff_or_above(request.user):
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status not in ["confirmed", "cancelled"]:
            return Response(
                {"detail": "Status must be 'confirmed' or 'cancelled'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if booking.status == "cancelled":
            return Response(
                {"detail": "This booking has already been cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        booking.status = new_status
        booking.save()

        serializer = BookingSerializer(booking)
        return Response(serializer.data, status=status.HTTP_200_OK)