import logging
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from ..models import Branch, Booking, Staff
from ..serializers.bookings_serializer import BranchSerializer, BookingSerializer
from api.views.queue_views import _booking_to_queue_entry

logger = logging.getLogger(__name__)


# ─── Helper ───────────────────────────────────────────────────────────────────

def is_staff_or_above(user):
    try:
        role = user.staff_profile.role
        return role in ["Admin", "Business Owner", "Branch Manager", "Staff", "Employee"]
    except Exception:
        return False


# ─── Customer-facing views ────────────────────────────────────────────────────

class BranchListView(generics.ListAPIView):
    queryset           = Branch.objects.filter(is_active=True)
    serializer_class   = BranchSerializer
    permission_classes = [permissions.AllowAny]


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Booking.objects
            .filter(user=self.request.user)
            .select_related("branch")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, status="pending")


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Booking.objects
            .filter(user=self.request.user)
            .select_related("branch")
        )

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()
        if booking.status == "cancelled":
            return Response(
                {"detail": "Cancelled bookings cannot be modified."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if request.data.get("status") == "cancelled":
            booking.status = "cancelled"
            booking.save()
            return Response(self.get_serializer(booking).data)
        return super().partial_update(request, *args, **kwargs)


# ─── Staff views ──────────────────────────────────────────────────────────────

class StaffBookingListView(generics.ListAPIView):
    serializer_class   = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not is_staff_or_above(self.request.user):
            return Booking.objects.none()

        requester_staff = getattr(self.request.user, "staff_profile", None)
        qs = Booking.objects.all().select_related("branch", "user")

        # Non-admin users can only see appointments from their own branch.
        if requester_staff and requester_staff.role != "Admin":
            if requester_staff.branch_id:
                qs = qs.filter(branch_id=requester_staff.branch_id)
            else:
                return Booking.objects.none()

        date_param   = self.request.query_params.get("date")
        status_param = self.request.query_params.get("status")
        branch_param = self.request.query_params.get("branch")

        if date_param:
            qs = qs.filter(date=date_param)
        if status_param:
            qs = qs.filter(status=status_param)
        if branch_param:
            qs = qs.filter(branch__name=branch_param)

        return qs.order_by("date", "time")


class StaffBookingActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.select_related(
                "branch", "user__customer_profile"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status", booking.status)
        assigned_employee_id = request.data.get("assigned_employee_id", None)
        existing_assigned_employee_id = None
        queue_entry = getattr(booking, "queue_entry", None)
        if queue_entry and queue_entry.assigned_employee_id:
            existing_assigned_employee_id = queue_entry.assigned_employee_id

        normalized_assigned_employee_id = assigned_employee_id
        if normalized_assigned_employee_id in ("", "null"):
            normalized_assigned_employee_id = None

        allowed = ["pending", "confirmed"]
        if new_status not in allowed:
            return Response(
                {"detail": f"Invalid status. Allowed: {allowed}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Enforce assignment before approval.
        if (
            new_status == "confirmed"
            and normalized_assigned_employee_id is None
            and existing_assigned_employee_id is None
        ):
            return Response(
                {"detail": "Assign a staff before approving this appointment."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Once a confirmed booking already has an assigned mechanic, do not allow changing it.
        if (
            booking.status == "confirmed"
            and assigned_employee_id is not None
            and existing_assigned_employee_id is not None
        ):
            normalized_assigned = assigned_employee_id
            if normalized_assigned in ("", "null", None):
                normalized_assigned = None

            if normalized_assigned is None or int(normalized_assigned) != int(existing_assigned_employee_id):
                return Response(
                    {"detail": "Assigned mechanic is locked after approval and cannot be changed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        assigned_employee = None
        if assigned_employee_id is not None:
            assigned_employee_id = normalized_assigned_employee_id

            if assigned_employee_id is None:
                booking.staff = "TBA"
            else:
                try:
                    assigned_employee = Staff.objects.select_related("branch").get(
                        pk=assigned_employee_id,
                        role="Employee",
                        status="Active",
                    )
                except Staff.DoesNotExist:
                    return Response(
                        {"detail": "Assigned employee not found."},
                        status=status.HTTP_404_NOT_FOUND,
                    )

                if booking.branch_id and assigned_employee.branch_id != booking.branch_id:
                    return Response(
                        {"detail": "Assigned employee must belong to the same branch as this booking."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                employee_full_name = (
                    f"{assigned_employee.first_name} {assigned_employee.last_name}".strip()
                )

                has_time_conflict = Booking.objects.filter(
                    date=booking.date,
                    time=booking.time,
                    status__in=["pending", "confirmed"],
                ).exclude(pk=booking.pk).filter(
                    Q(staff=employee_full_name) | Q(queue_entry__assigned_employee_id=assigned_employee.id)
                ).exists()

                if has_time_conflict:
                    return Response(
                        {
                            "detail": (
                                "This employee is already assigned to another appointment "
                                "at the same date and time."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                booking.staff = (
                    f"{assigned_employee.first_name} {assigned_employee.last_name}".strip()
                    or "TBA"
                )

        booking.status = new_status
        booking.save()

        if new_status == "confirmed":
            try:
                print(f"[QUEUE] Attempting to create queue entry for booking #{booking.id}...")
                print(f"[QUEUE] booking.branch={booking.branch}, booking.user={booking.user}, booking.service={booking.service}")
                
                # Validate branch exists before attempting to create queue entry
                if booking.branch is None:
                    print(f"[QUEUE] ❌ FAILED for booking #{booking.id}: No branch assigned to this booking")
                    return Response(
                        {"detail": "Booking confirmed but cannot add to queue: No branch assigned."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                
                entry = _booking_to_queue_entry(booking)

                if assigned_employee_id is not None:
                    entry.assigned_employee = assigned_employee
                    entry.save(update_fields=["assigned_employee"])

                print(f"[QUEUE] ✅ Success — queue entry #{entry.id} at position #{entry.position}")
            except Exception as e:
                import traceback
                print(f"[QUEUE] ❌ FAILED for booking #{booking.id}: {e}")
                print(traceback.format_exc())
                # Return error response so the frontend knows queue creation failed
                return Response(
                    {"detail": f"Booking confirmed but failed to add to queue: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        elif assigned_employee_id is not None and hasattr(booking, "queue_entry"):
            queue_entry = booking.queue_entry
            queue_entry.assigned_employee = assigned_employee
            queue_entry.save(update_fields=["assigned_employee"])

        from api.serializers.bookings_serializer import BookingSerializer
        return Response(BookingSerializer(booking).data)