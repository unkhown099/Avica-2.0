import logging
import traceback
from django.db.models import Q
from datetime import datetime, timedelta
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from ..models import Branch, Booking, Notification
from ..models import Branch, Booking, Staff
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


def to_display_time(time_str):
    """Convert API time format to display format (e.g., 14:30:00 -> 2:30 PM)"""
    if not time_str:
        return ""
    if "AM" in time_str or "PM" in time_str:
        return time_str
    try:
        time_obj = datetime.strptime(time_str, '%H:%M:%S')
        return time_obj.strftime('%I:%M %p').lstrip('0')
    except:
        return time_str


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
        
        # Handle customer cancellation with reason
        if request.data.get("status") == "cancelled":
            cancellation_reason = request.data.get("cancellation_reason", "")
            booking.status = "cancelled"
            booking.cancellation_reason = cancellation_reason
            booking.save()
            return Response(self.get_serializer(booking).data)
        
        return super().partial_update(request, *args, **kwargs)


# ─── Available Slots View ────────────────────────────────────────────────────

class AvailableSlotsView(APIView):
    """
    Get available time slots for a specific branch and date
    Query parameters:
        - branch_id: ID of the branch
        - date: Date in YYYY-MM-DD format
    Returns:
        {
            "available_slots": {
                "8:00 AM": true,
                "9:00 AM": false,
                ...
            }
        }
    """
    permission_classes = [IsAuthenticated]
    
    # Define the time slots in order
    TIME_SLOTS = [
        "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
        "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
    ]
    
    def get(self, request):
        # Get query parameters
        branch_id = request.query_params.get('branch_id')
        date_str = request.query_params.get('date')
        
        # Validate parameters
        if not branch_id:
            return Response(
                {"error": "branch_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not date_str:
            return Response(
                {"error": "date is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate branch exists
        try:
            branch = Branch.objects.get(id=branch_id, is_active=True)
        except Branch.DoesNotExist:
            return Response(
                {"error": "Branch not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate date format
        try:
            selected_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {"error": "Invalid date format. Use YYYY-MM-DD"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if date is tomorrow or later (no same-day bookings)
        tomorrow = timezone.now().date() + timedelta(days=1)
        if selected_date < tomorrow:
            return Response(
                {"error": "Bookings can only be made for tomorrow or later"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all confirmed/pending bookings for this branch on this date
        bookings = Booking.objects.filter(
            branch=branch,
            date=selected_date,
            status__in=['confirmed', 'pending']  # Count both confirmed and pending bookings
        )
        
        # Convert time to display format and count bookings per slot
        from collections import Counter
        booked_slots = []
        for booking in bookings:
            display_time = to_display_time(booking.time)
            booked_slots.append(display_time)
        
        slot_counts = Counter(booked_slots)
        
        # Use branch.slots as max capacity (from your Branch model)
        max_capacity = branch.slots
        
        # Calculate availability for each time slot
        available_slots = {}
        for slot in self.TIME_SLOTS:
            current_bookings = slot_counts.get(slot, 0)
            is_available = current_bookings < max_capacity
            available_slots[slot] = is_available
        
        # Optional: Add lunch break constraints or branch-specific rules
        # Example: Make 12:00 PM unavailable for certain branches during lunch
        if branch.name == "Main Branch":  # You can customize this per branch
            # available_slots["12:00 PM"] = False  # Uncomment if needed
            pass
        
        return Response({'available_slots': available_slots})


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

        new_status = request.data.get("status")
        allowed = ["pending", "confirmed", "cancelled", "done", "rescheduled"]
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

        # Save cancellation reason if status is cancelled
        if new_status == "cancelled":
            cancellation_reason = request.data.get("cancellation_reason", "")
            booking.cancellation_reason = cancellation_reason
            booking.status = "cancelled"
            booking.save()
            
            # Return early - no queue entry for cancelled bookings
            from api.serializers.bookings_serializer import BookingSerializer
            return Response(BookingSerializer(booking).data)

        # If not cancelled, proceed with normal flow
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