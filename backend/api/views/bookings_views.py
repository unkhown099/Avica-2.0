import logging
import traceback
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from ..models import Branch, Booking, Notification
from ..serializers.bookings_serializer import BranchSerializer, BookingSerializer
from .queue_views import _booking_to_queue_entry

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

        qs = Booking.objects.all().select_related("branch", "user")

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

        new_status = request.data.get("status")
        allowed = ["pending", "confirmed", "cancelled", "done", "rescheduled"]
        if new_status not in allowed:
            return Response(
                {"detail": f"Invalid status. Allowed: {allowed}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_status == "rescheduled":
            new_date = request.data.get("date")
            new_time = request.data.get("time")
            if not new_date or not new_time:
                return Response(
                    {"detail": "Date and time are required for rescheduling."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            booking.date = new_date
            booking.time = new_time
            
            # Create Notification
            try:
                Notification.objects.create(
                    user=booking.user,
                    title="Appointment Rescheduled",
                    message=f"Your appointment for {booking.service} has been rescheduled to {new_date} at {new_time}.",
                    notification_type="appointment"
                )
            except Exception as e:
                logger.error(f"Failed to create notification: {e}")
                print(f"Failed to create notification: {e}")

            # Send Email
            try:
                subject = "Appointment Rescheduled - Otokwikk"
                html_content = f"""
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #dc2626;">Appointment Rescheduled</h2>
                    <p>Hi,</p>
                    <p>Your appointment for <strong>{booking.service}</strong> at Otokwikk has been rescheduled.</p>
                    <p><strong>New Schedule:</strong> {new_date} at {new_time}</p>
                    <p>If you have any questions, please contact our branch.</p>
                    <br>
                    <p>Best regards,<br>Otokwikk Team</p>
                </div>
                """
                text_content = strip_tags(html_content)
                msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [booking.user.email])
                msg.attach_alternative(html_content, "text/html")
                msg.send()
            except Exception as e:
                print(f"Failed to send reschedule email: {e}")

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
                print(f"[QUEUE] ✅ Success — queue entry #{entry.id} at position #{entry.position}")
            except Exception as e:
                print(f"[QUEUE] ❌ FAILED for booking #{booking.id}: {e}")
                print(traceback.format_exc())
                # Return error response so the frontend knows queue creation failed
                return Response(
                    {"detail": f"Booking confirmed but failed to add to queue: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        from api.serializers.bookings_serializer import BookingSerializer
        return Response(BookingSerializer(booking).data)