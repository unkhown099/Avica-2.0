import logging
import re
from django.db.models import Q
from datetime import datetime, timedelta
from django.utils import timezone
import traceback
from rest_framework import generics, permissions, status
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from ..models import Branch, Booking, BranchScheduleConfig, Staff
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
from ..models import Branch, Booking, Notification
from ..serializers.bookings_serializer import BranchSerializer, BookingSerializer
from .queue_views import _booking_to_queue_entry

logger = logging.getLogger(__name__)

PREFERRED_EMPLOYEE_PATTERN = re.compile(r"\[preferred_employee_id=(\d+)\]", re.IGNORECASE)
WEEK_DAYS = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
]


def default_manager_schedule_config():
    days = {}
    for day in WEEK_DAYS:
        days[day] = {
            "enabled": day != "Sunday",
            "start": "08:00",
            "end": "17:00",
            "hasBreak": True,
            "breakStart": "12:00",
            "breakEnd": "13:00",
        }

    return {
        "recurringWeekly": True,
        "slotDuration": "30",
        "maxPatientsPerDay": 35,
        "days": days,
        "assignments": {},
        "exceptions": [],
    }


def merge_manager_schedule_config(raw):
    base = default_manager_schedule_config()
    if not isinstance(raw, dict):
        return base

    merged = {**base, **raw}

    raw_days = raw.get("days") if isinstance(raw.get("days"), dict) else {}
    merged_days = {}
    for day in WEEK_DAYS:
        default_day = base["days"][day]
        custom_day = raw_days.get(day) if isinstance(raw_days.get(day), dict) else {}
        merged_days[day] = {**default_day, **custom_day}

    merged["days"] = merged_days
    merged["assignments"] = raw.get("assignments") if isinstance(raw.get("assignments"), dict) else {}
    merged["exceptions"] = raw.get("exceptions") if isinstance(raw.get("exceptions"), list) else []
    return merged


def _parse_hhmm(value):
    if not value:
        return None
    try:
        return datetime.strptime(str(value), "%H:%M").time()
    except ValueError:
        return None


def _slot_overlaps(window_start, window_end, slot_start, slot_end):
    return slot_start < window_end and slot_end > window_start


def _format_display_time(time_obj):
    return time_obj.strftime("%I:%M %p").lstrip("0")


def _extract_preferred_employee_id(notes):
    raw_notes = notes or ""
    match = PREFERRED_EMPLOYEE_PATTERN.search(raw_notes)
    if not match:
        return None
    try:
        return int(match.group(1))
    except (TypeError, ValueError):
        return None


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
        has_active_booking = Booking.objects.filter(
            user=self.request.user,
            status__in=["pending", "confirmed"],
        ).exists()

        if has_active_booking:
            raise ValidationError(
                {
                    "non_field_errors": [
                        "You already have an active booking. Please complete or cancel it before creating a new one."
                    ]
                }
            )

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

    def _build_meta(
        self,
        *,
        day_name,
        slot_duration,
        open_start=None,
        open_end=None,
        break_start=None,
        break_end=None,
        closed=False,
        closure_reason="",
    ):
        return {
            "day": day_name,
            "slot_duration": slot_duration,
            "open_start": _format_display_time(open_start) if open_start else None,
            "open_end": _format_display_time(open_end) if open_end else None,
            "break_start": _format_display_time(break_start) if break_start else None,
            "break_end": _format_display_time(break_end) if break_end else None,
            "closed": bool(closed),
            "closure_reason": closure_reason or "",
        }
    
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
        
        # Resolve branch schedule config (from manager contents settings).
        schedule_obj = BranchScheduleConfig.objects.filter(branch=branch).first()
        schedule_config = merge_manager_schedule_config(
            schedule_obj.config if schedule_obj else {}
        )

        day_name = selected_date.strftime("%A")
        day_cfg = schedule_config.get("days", {}).get(day_name, {})

        slot_duration = 30
        try:
            slot_duration = int(schedule_config.get("slotDuration", 30))
        except (TypeError, ValueError):
            slot_duration = 30
        if slot_duration <= 0:
            slot_duration = 30

        # Day disabled in schedule => no available slots.
        if not bool(day_cfg.get("enabled", False)):
            return Response(
                {
                    "available_slots": {},
                    "meta": self._build_meta(
                        day_name=day_name,
                        slot_duration=slot_duration,
                        closed=True,
                        closure_reason="Closed on this day.",
                    ),
                }
            )

        open_start = _parse_hhmm(day_cfg.get("start"))
        open_end = _parse_hhmm(day_cfg.get("end"))
        if not open_start or not open_end or open_start >= open_end:
            return Response(
                {
                    "available_slots": {},
                    "meta": self._build_meta(
                        day_name=day_name,
                        slot_duration=slot_duration,
                        closed=True,
                        closure_reason="Invalid schedule window.",
                    ),
                }
            )

        break_start = None
        break_end = None
        if bool(day_cfg.get("hasBreak", False)):
            break_start = _parse_hhmm(day_cfg.get("breakStart"))
            break_end = _parse_hhmm(day_cfg.get("breakEnd"))
            if not break_start or not break_end or break_start >= break_end:
                break_start = None
                break_end = None

        max_patients_per_day = schedule_config.get("maxPatientsPerDay", 35)
        try:
            max_patients_per_day = int(max_patients_per_day)
        except (TypeError, ValueError):
            max_patients_per_day = 35
        if max_patients_per_day <= 0:
            max_patients_per_day = 35

        date_key = selected_date.isoformat()
        matching_exceptions = [
            item
            for item in schedule_config.get("exceptions", [])
            if isinstance(item, dict) and str(item.get("date", "")) == date_key
        ]

        # Full-day closures from exceptions.
        for item in matching_exceptions:
            ex_type = str(item.get("type", "")).strip().lower()
            if ex_type in {"holiday", "emergency_closure"}:
                reason = "Holiday" if ex_type == "holiday" else "Emergency closure"
                return Response(
                    {
                        "available_slots": {},
                        "meta": self._build_meta(
                            day_name=day_name,
                            slot_duration=slot_duration,
                            closed=True,
                            closure_reason=reason,
                        ),
                    }
                )

        # Half-day override uses explicit start/end in exception for that date.
        for item in matching_exceptions:
            ex_type = str(item.get("type", "")).strip().lower()
            if ex_type != "half_day":
                continue
            ex_start = _parse_hhmm(item.get("start"))
            ex_end = _parse_hhmm(item.get("end"))
            if ex_start and ex_end and ex_start < ex_end:
                open_start = ex_start
                open_end = ex_end

        schedule_meta = self._build_meta(
            day_name=day_name,
            slot_duration=slot_duration,
            open_start=open_start,
            open_end=open_end,
            break_start=break_start,
            break_end=break_end,
            closed=False,
        )

        # Additional closure windows from exceptions with start/end.
        blocked_windows = []
        for item in matching_exceptions:
            ex_start = _parse_hhmm(item.get("start"))
            ex_end = _parse_hhmm(item.get("end"))
            if ex_start and ex_end and ex_start < ex_end:
                blocked_windows.append((ex_start, ex_end))

        # Build slots from schedule windows.
        slots = []
        cursor = datetime.combine(selected_date, open_start)
        close_dt = datetime.combine(selected_date, open_end)
        while cursor + timedelta(minutes=slot_duration) <= close_dt:
            slot_start = cursor.time()
            slot_end = (cursor + timedelta(minutes=slot_duration)).time()

            # Exclude configured break window.
            if break_start and break_end and _slot_overlaps(break_start, break_end, slot_start, slot_end):
                cursor += timedelta(minutes=slot_duration)
                continue

            # Exclude exception closure windows.
            blocked = any(
                _slot_overlaps(win_start, win_end, slot_start, slot_end)
                for (win_start, win_end) in blocked_windows
            )
            if blocked:
                cursor += timedelta(minutes=slot_duration)
                continue

            slots.append(_format_display_time(slot_start))
            cursor += timedelta(minutes=slot_duration)

        if not slots:
            return Response({"available_slots": {}, "meta": schedule_meta})

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
        
        # Capacity per slot still follows branch slot capacity.
        max_capacity = max(int(branch.slots or 1), 1)

        # Daily cap from manager schedule settings.
        total_bookings_for_day = bookings.count()
        daily_limit_reached = total_bookings_for_day >= max_patients_per_day
        
        # Calculate availability for each generated slot
        available_slots = {}
        for slot in slots:
            current_bookings = slot_counts.get(slot, 0)
            is_available = (not daily_limit_reached) and (current_bookings < max_capacity)
            available_slots[slot] = is_available

        return Response({'available_slots': available_slots, 'meta': schedule_meta})


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

        # If customer picked a preferred mechanic, auto-use it when staff confirms
        # and no manual assignment is provided yet.
        if (
            new_status == "confirmed"
            and normalized_assigned_employee_id is None
            and existing_assigned_employee_id is None
        ):
            preferred_employee_id = _extract_preferred_employee_id(booking.notes)
            if preferred_employee_id:
                normalized_assigned_employee_id = preferred_employee_id
                assigned_employee_id = preferred_employee_id

        allowed = ["pending", "confirmed"]
        new_status = request.data.get("status")
        allowed = ["pending", "confirmed", "cancelled", "done", "rescheduled"]
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