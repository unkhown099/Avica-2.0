import logging
from datetime import datetime, timedelta
from django.utils import timezone
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
        allowed = ["pending", "confirmed", "cancelled"]
        if new_status not in allowed:
            return Response(
                {"detail": f"Invalid status. Allowed: {allowed}"},
                status=status.HTTP_400_BAD_REQUEST,
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

        from api.serializers.bookings_serializer import BookingSerializer
        return Response(BookingSerializer(booking).data)