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
from ..models import Branch, Booking, BranchScheduleConfig, Staff, Notification
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.html import strip_tags
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


def _render_notification_email_html(*, title, message, detail_text=""):
    detail_block = (
        f'<p style="font-size: 14px; margin-top: 18px; color: #d1d5db;">{detail_text}</p>'
        if detail_text
        else ""
    )
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; background-color: #07070d; color: #ffffff; margin: 0; padding: 24px; }}
            .container {{ max-width: 620px; margin: 0 auto; background: #111827; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }}
            .header {{ background: #000000; padding: 28px; text-align: center; }}
            .logo {{ height: 50px; }}
            .content {{ padding: 36px; text-align: center; }}
            h1 {{ color: #ffffff; font-size: 26px; font-weight: 800; margin-bottom: 12px; }}
            p {{ color: #9ca3af; font-size: 16px; line-height: 1.7; margin: 0; }}
            .divider {{ height: 1px; background: linear-gradient(to right, transparent, rgba(220,38,38,0.35), transparent); margin: 24px 0 18px; }}
            .footer {{ background: rgba(0,0,0,0.28); padding: 22px; text-align: center; }}
            .footer-text {{ color: #4b5563; font-size: 12px; margin: 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://i.ibb.co/vzR0F7Z/otokwikklogo.png" alt="Otokwikk" class="logo">
            </div>
            <div class="content">
                <h1>{title}</h1>
                <p>{message}</p>
                {detail_block}
                <div class="divider"></div>
                <p style="font-size: 14px;">If you have questions, please contact your branch.</p>
            </div>
            <div class="footer">
                <p class="footer-text">© 2026 Otokwikk Services. This is an automated email, please do not reply.</p>
            </div>
        </div>
    </body>
    </html>
    """


def _notify_customer_booking_status(booking, status_value):
    status_config = {
        "confirmed": {
            "title": "Appointment Approved",
            "email_subject": "Appointment Approved - Otokwikk",
            "message": (
                f"Your appointment for {booking.service} has been approved for "
                f"{booking.date} at {booking.time}."
            ),
        },
        "rescheduled": {
            "title": "Appointment Rescheduled",
            "email_subject": "Appointment Rescheduled - Otokwikk",
            "message": (
                f"Your appointment for {booking.service} has been rescheduled to "
                f"{booking.date} at {booking.time}."
            ),
        },
        "cancelled": {
            "title": "Appointment Cancelled",
            "email_subject": "Appointment Cancelled - Otokwikk",
            "message": (
                f"Your appointment for {booking.service} on {booking.date} at "
                f"{booking.time} has been cancelled."
            ),
        },
        "no_show": {
            "title": "Appointment Marked as No Show",
            "email_subject": "Appointment Marked as No Show - Otokwikk",
            "message": (
                f"Your appointment for {booking.service} on {booking.date} at "
                f"{booking.time} was marked as no-show."
            ),
        },
    }

    config = status_config.get(status_value)
    if not config:
        return

    try:
        Notification.objects.create(
            user=booking.user,
            title=config["title"],
            message=config["message"],
            notification_type="appointment",
        )
    except Exception:
        logger.exception(
            "Failed to create booking notification for booking_id=%s status=%s",
            booking.id,
            status_value,
        )

    if not booking.user.email:
        return

    branch_name = booking.branch.name if booking.branch else "your selected branch"
    html_content = _render_notification_email_html(
        title=config["title"],
        message=config["message"],
        detail_text=f"Branch: {branch_name}",
    )
    text_content = strip_tags(html_content)
    try:
        msg = EmailMultiAlternatives(
            config["email_subject"],
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception:
        logger.exception(
            "Failed to send booking status email for booking_id=%s status=%s",
            booking.id,
            status_value,
        )


def _notify_user_inapp_and_email(*, user, title, message, email_subject):
    if not user:
        return
    try:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type="appointment",
        )
    except Exception:
        logger.exception("Failed to create notification for user_id=%s", getattr(user, "id", None))

    if not getattr(user, "email", ""):
        return

    html_content = _render_notification_email_html(
        title=title,
        message=message,
    )
    text_content = strip_tags(html_content)
    try:
        msg = EmailMultiAlternatives(
            email_subject,
            text_content,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception:
        logger.exception("Failed to send notification email for user_id=%s", getattr(user, "id", None))


def _notify_staff_and_manager_new_booking(booking):
    branch = getattr(booking, "branch", None)
    if not branch:
        return

    recipients = (
        Staff.objects.filter(
            branch=branch,
            role__in=["Staff", "Branch Manager"],
            status="Active",
        )
        .select_related("user")
    )

    notifications = []
    appointment_time = to_display_time(str(booking.time))
    message = (
        f"New appointment for {booking.service} on {booking.date} at {appointment_time} "
        f"in {branch.name}."
    )

    for staff_member in recipients:
        if not getattr(staff_member, "user_id", None):
            continue
        notifications.append(
            Notification(
                user_id=staff_member.user_id,
                title="New Appointment",
                message=message,
                notification_type="appointment",
            )
        )

    if not notifications:
        return

    try:
        Notification.objects.bulk_create(notifications)
    except Exception:
        logger.exception(
            "Failed to notify staff/manager for new booking_id=%s branch_id=%s",
            booking.id,
            branch.id,
        )


def _notify_staff_and_manager_cancellation(booking):
    """Notify staff and managers when an appointment is cancelled."""
    branch = getattr(booking, "branch", None)
    if not branch:
        return

    recipients = (
        Staff.objects.filter(
            branch=branch,
            role__in=["Staff", "Branch Manager"],
            status="Active",
        )
        .select_related("user")
    )

    notifications = []
    appointment_time = to_display_time(str(booking.time))
    message = (
        f"Appointment for {booking.service} on {booking.date} at {appointment_time} "
        f"has been cancelled."
    )

    for staff_member in recipients:
        if not getattr(staff_member, "user_id", None):
            continue
        notifications.append(
            Notification(
                user_id=staff_member.user_id,
                title="Appointment Cancelled",
                message=message,
                notification_type="appointment",
            )
        )

    if not notifications:
        return

    try:
        Notification.objects.bulk_create(notifications)
    except Exception:
        logger.exception(
            "Failed to notify staff/manager for cancelled booking_id=%s branch_id=%s",
            booking.id,
            branch.id,
        )


def _normalize_reschedule_options(raw_options):
    if not isinstance(raw_options, list):
        return []
    normalized = []
    for item in raw_options:
        if not isinstance(item, dict):
            continue
        date_value = str(item.get("date", "")).strip()
        time_value = str(item.get("time", "")).strip()
        if not date_value or not time_value:
            continue
        try:
            datetime.strptime(date_value, "%Y-%m-%d")
        except ValueError:
            continue
        normalized.append({"date": date_value, "time": time_value})
    return normalized[:5]


def _is_reschedule_option_available(booking, option):
    branch = booking.branch
    if not branch:
        return False

    try:
        selected_date = datetime.strptime(option["date"], "%Y-%m-%d").date()
    except ValueError:
        return False

    today = timezone.now().date()
    if selected_date < today:
        return False

    target_display_time = to_display_time(option["time"])
    slot_capacity = max(int(branch.slots or 1), 1)

    same_day_bookings = Booking.objects.filter(
        branch=branch,
        date=selected_date,
        status__in=["pending", "confirmed"],
    ).exclude(pk=booking.pk)

    booked_count = sum(
        1 for existing in same_day_bookings if to_display_time(existing.time) == target_display_time
    )
    return booked_count < slot_capacity


def _format_reschedule_options(options):
    return ", ".join([f'{opt["date"]} at {opt["time"]}' for opt in options])


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
            status__in=["pending", "confirmed", "rescheduled"],
        ).exists()

        if has_active_booking:
            raise ValidationError(
                {
                    "non_field_errors": [
                        "You already have an active booking. Please complete or cancel it before creating a new one."
                    ]
                }
            )

        booking = serializer.save(user=self.request.user, status="pending")
        _notify_staff_and_manager_new_booking(booking)


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
            _notify_customer_booking_status(booking, "cancelled")
            _notify_staff_and_manager_cancellation(booking)
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
        
        # Allow same-day booking; only block past dates.
        today = timezone.now().date()
        if selected_date < today:
            return Response(
                {"error": "Bookings cannot be made for past dates"},
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

        preferred_employee_raw = request.query_params.get("preferred_employee_id")
        preferred_employee_id = None
        if preferred_employee_raw not in (None, "", "null", "None"):
            try:
                preferred_employee_id = int(preferred_employee_raw)
            except (TypeError, ValueError):
                return Response(
                    {"error": "preferred_employee_id must be a valid integer"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        active_employees_qs = Staff.objects.filter(
            branch=branch,
            role="Employee",
            status="Active",
        )
        active_employee_ids = set(active_employees_qs.values_list("id", flat=True))

        if preferred_employee_id is not None and preferred_employee_id not in active_employee_ids:
            return Response(
                {"error": "Selected employee is not available in this branch."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get all active bookings for this branch on this date.
        bookings = (
            Booking.objects.filter(
                branch=branch,
                date=selected_date,
                status__in=["confirmed", "pending", "rescheduled"],
            )
            .select_related("queue_entry")
        )

        # Convert time to display format and count bookings per slot.
        from collections import Counter, defaultdict

        booked_slots = []
        slot_busy_employee_ids = defaultdict(set)

        for booking in bookings:
            display_time = to_display_time(booking.time)
            booked_slots.append(display_time)

            assigned_employee_id = None
            queue_entry = getattr(booking, "queue_entry", None)
            if queue_entry and queue_entry.assigned_employee_id:
                assigned_employee_id = queue_entry.assigned_employee_id
            else:
                assigned_employee_id = _extract_preferred_employee_id(getattr(booking, "notes", ""))

            if assigned_employee_id in active_employee_ids:
                slot_busy_employee_ids[display_time].add(assigned_employee_id)

        slot_counts = Counter(booked_slots)

        # Capacity per slot still follows branch slot capacity.
        max_capacity = max(int(branch.slots or 1), 1)

        # Daily cap from manager schedule settings.
        total_bookings_for_day = bookings.count()
        daily_limit_reached = total_bookings_for_day >= max_patients_per_day

        employee_capacity = len(active_employee_ids)

        # Calculate availability for each generated slot.
        available_slots = {}
        for slot in slots:
            current_bookings = slot_counts.get(slot, 0)
            base_available = (not daily_limit_reached) and (current_bookings < max_capacity)

            busy_employee_ids = slot_busy_employee_ids.get(slot, set())
            if preferred_employee_id is not None:
                employee_available = preferred_employee_id not in busy_employee_ids
            else:
                employee_available = True
                if employee_capacity > 0 and len(busy_employee_ids) >= employee_capacity:
                    employee_available = False

            available_slots[slot] = base_available and employee_available

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

        # Employee should only see tasks assigned to their own account.
        if requester_staff and requester_staff.role == "Employee":
            full_name = f"{requester_staff.first_name} {requester_staff.last_name}".strip()
            qs = qs.filter(
                Q(queue_entry__assigned_employee_id=requester_staff.id) |
                Q(staff=full_name)
            )

        date_param   = self.request.query_params.get("date")
        status_param = self.request.query_params.get("status")
        branch_param = self.request.query_params.get("branch")

        if date_param:
            qs = qs.filter(date=date_param)
        if status_param:
            qs = qs.filter(status=status_param)
        if branch_param:
            qs = qs.filter(branch__name=branch_param)

        return qs.distinct().order_by("date", "time")


class StaffBookingActionView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.select_related(
                "branch", "user__customer_profile"
            ).get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not is_staff_or_above(request.user):
            return Response(
                {"detail": "Only staff and managers can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        action_type = request.data.get("action")
        if action_type == "propose_reschedule":
            raw_options = request.data.get("options", [])
            options = _normalize_reschedule_options(raw_options)
            if not options:
                return Response(
                    {"detail": "At least one valid date/time option is required."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            unavailable = [opt for opt in options if not _is_reschedule_option_available(booking, opt)]
            if unavailable:
                return Response(
                    {"detail": "One or more proposed slots are not available. Please choose different options."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            previous_status = booking.status if booking.status != "rescheduled" else (booking.reschedule_previous_status or "confirmed")
            booking.status = "rescheduled"
            booking.reschedule_previous_status = previous_status
            booking.reschedule_status = "pending_customer"
            booking.reschedule_options = options
            booking.reschedule_selected_option = None
            booking.reschedule_note = str(request.data.get("reason", "") or request.data.get("note", "") or "").strip()
            booking.reschedule_request_reason = str(request.data.get("request_reason", "") or "").strip()
            booking.reschedule_proposed_by = getattr(request.user, "staff_profile", None)
            booking.save(
                update_fields=[
                    "status",
                    "reschedule_previous_status",
                    "reschedule_status",
                    "reschedule_options",
                    "reschedule_selected_option",
                    "reschedule_note",
                    "reschedule_proposed_by",
                    "reschedule_request_reason",
                ]
            )

            _notify_user_inapp_and_email(
                user=booking.user,
                title="Reschedule Proposal Received",
                message=(
                    f"We proposed new schedule options for your {booking.service} appointment: "
                    f"{_format_reschedule_options(options)}. Please accept or decline in your bookings."
                ),
                email_subject="Reschedule Options for Your Appointment - Otokwikk",
            )

            from api.serializers.bookings_serializer import BookingSerializer
            return Response(BookingSerializer(booking).data)

        new_status = request.data.get("status", booking.status)
        assignment_provided = "assigned_employee_id" in request.data
        assigned_employee_id = request.data.get("assigned_employee_id", None)
        existing_assigned_employee_id = None
        queue_entry = getattr(booking, "queue_entry", None)
        if queue_entry and queue_entry.assigned_employee_id:
            existing_assigned_employee_id = queue_entry.assigned_employee_id

        normalized_assigned_employee_id = assigned_employee_id
        if normalized_assigned_employee_id in ("", "null", None):
            normalized_assigned_employee_id = None

        # Preserve current assignment unless a valid new employee id is explicitly provided.
        if normalized_assigned_employee_id is None and existing_assigned_employee_id is not None:
            assigned_employee_id = existing_assigned_employee_id
            normalized_assigned_employee_id = existing_assigned_employee_id
            assignment_provided = False

        # If customer picked a preferred employee, auto-use it when staff confirms
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
        allowed = ["pending", "confirmed", "cancelled", "no_show", "done", "rescheduled"]
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

        # Once a confirmed booking already has an assigned employee, do not allow changing it.
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
                    {"detail": "Assigned employee is locked after approval and cannot be changed."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        assigned_employee = None
        if assignment_provided and assigned_employee_id is not None:
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
                    status__in=["pending", "confirmed", "rescheduled"],
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
            _notify_customer_booking_status(booking, "cancelled")
            _notify_staff_and_manager_cancellation(booking)
            
            # Return early - no queue entry for cancelled bookings
            from api.serializers.bookings_serializer import BookingSerializer
            return Response(BookingSerializer(booking).data)

        # If not cancelled, proceed with normal flow
        if new_status == "rescheduled":
            new_date = str(request.data.get("date", "")).strip()
            new_time = str(request.data.get("time", "")).strip()
            if not new_date or not new_time:
                return Response(
                    {"detail": "Date and time are required for a reschedule proposal."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            options = _normalize_reschedule_options([{"date": new_date, "time": new_time}])
            if not options:
                return Response(
                    {"detail": "Invalid date/time proposal."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not _is_reschedule_option_available(booking, options[0]):
                return Response(
                    {"detail": "The proposed slot is not currently available."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            previous_status = booking.status if booking.status != "rescheduled" else (booking.reschedule_previous_status or "confirmed")
            booking.reschedule_status = "pending_customer"
            booking.reschedule_previous_status = previous_status
            booking.reschedule_options = options
            booking.reschedule_selected_option = None
            booking.reschedule_note = str(request.data.get("note", "") or "").strip()
            booking.reschedule_proposed_by = getattr(request.user, "staff_profile", None)
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

                if assignment_provided and assigned_employee_id is not None:
                    entry.assigned_employee = assigned_employee
                    entry.save(update_fields=["assigned_employee"])

                print(f"[QUEUE] ✅ Success — queue entry #{entry.id} at position #{entry.position}")
                _notify_customer_booking_status(booking, "confirmed")
            except Exception as e:
                print(f"[QUEUE] ❌ FAILED for booking #{booking.id}: {e}")
                print(traceback.format_exc())
                # Return error response so the frontend knows queue creation failed
                return Response(
                    {"detail": f"Booking confirmed but failed to add to queue: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        elif assignment_provided and assigned_employee_id is not None and hasattr(booking, "queue_entry"):
            queue_entry = booking.queue_entry
            queue_entry.assigned_employee = assigned_employee
            queue_entry.save(update_fields=["assigned_employee"])

        if new_status == "rescheduled":
            _notify_user_inapp_and_email(
                user=booking.user,
                title="Reschedule Proposal Received",
                message=(
                    f"We proposed a new schedule for your {booking.service} appointment: "
                    f"{booking.reschedule_options[0]['date']} at {booking.reschedule_options[0]['time']}. "
                    "Please accept or decline in your bookings."
                ),
                email_subject="Reschedule Proposal for Your Appointment - Otokwikk",
            )

        from api.serializers.bookings_serializer import BookingSerializer
        return Response(BookingSerializer(booking).data)


class BookingRescheduleResponseView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.select_related("branch", "user", "reschedule_proposed_by__user").get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.user_id != request.user.id:
            return Response({"detail": "You can only respond to your own booking."}, status=status.HTTP_403_FORBIDDEN)

        if booking.reschedule_status != "pending_customer":
            return Response(
                {"detail": "There is no pending reschedule proposal for this booking."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decision = str(request.data.get("decision", "")).strip().lower()
        if decision not in {"accept", "decline"}:
            return Response(
                {"detail": "Decision must be either 'accept' or 'decline'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if decision == "accept":
            selected_option = request.data.get("selected_option")
            if selected_option is None and len(booking.reschedule_options or []) == 1:
                selected_option = booking.reschedule_options[0]

            if not isinstance(selected_option, dict):
                return Response(
                    {"detail": "Please select one proposed option to accept."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            normalized = _normalize_reschedule_options([selected_option])
            if not normalized:
                return Response(
                    {"detail": "Invalid selected reschedule option."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            selected = normalized[0]

            if selected not in (booking.reschedule_options or []):
                return Response(
                    {"detail": "Selected option is not part of the proposal."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if not _is_reschedule_option_available(booking, selected):
                return Response(
                    {"detail": "Selected option is no longer available. Please choose another option."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            booking.date = selected["date"]
            booking.time = selected["time"]
            booking.status = booking.reschedule_previous_status or "confirmed"
            booking.reschedule_status = "accepted"
            booking.reschedule_selected_option = selected
            booking.reschedule_options = []
            booking.save(
                update_fields=[
                    "date",
                    "time",
                    "status",
                    "reschedule_status",
                    "reschedule_selected_option",
                    "reschedule_options",
                ]
            )

            proposer_user = getattr(getattr(booking, "reschedule_proposed_by", None), "user", None)
            _notify_user_inapp_and_email(
                user=proposer_user,
                title="Customer Accepted Reschedule",
                message=(
                    f"The customer accepted your proposed schedule for {booking.service}: "
                    f"{booking.date} at {booking.time}."
                ),
                email_subject="Customer Accepted Reschedule Proposal - Otokwikk",
            )
            _notify_user_inapp_and_email(
                user=booking.user,
                title="Reschedule Confirmed",
                message=f"Your appointment is now confirmed for {booking.date} at {booking.time}.",
                email_subject="Your Appointment Has Been Rescheduled - Otokwikk",
            )
        else:
            booking.status = booking.reschedule_previous_status or "confirmed"
            booking.reschedule_status = "declined"
            booking.reschedule_selected_option = None
            booking.save(
                update_fields=[
                    "status",
                    "reschedule_status",
                    "reschedule_selected_option",
                ]
            )
            proposer_user = getattr(getattr(booking, "reschedule_proposed_by", None), "user", None)
            _notify_user_inapp_and_email(
                user=proposer_user,
                title="Customer Declined Reschedule",
                message=f"The customer declined the reschedule proposal for {booking.service}.",
                email_subject="Customer Declined Reschedule Proposal - Otokwikk",
            )
            _notify_user_inapp_and_email(
                user=booking.user,
                title="Reschedule Declined",
                message=(
                    "You declined the proposed schedule. Our team will contact you with another option."
                ),
                email_subject="Reschedule Proposal Declined - Otokwikk",
            )

        from api.serializers.bookings_serializer import BookingSerializer
        return Response(BookingSerializer(booking).data)

class BookingRescheduleRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = Booking.objects.select_related("branch", "user").get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.user_id != request.user.id:
            return Response(
                {"detail": "You can only request reschedule for your own booking."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if booking.status not in ["pending", "confirmed"]:
            return Response(
                {"detail": "Only pending or confirmed bookings can request a reschedule."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = str(request.data.get("reason", "")).strip()
        if not reason or len(reason) < 10:
            return Response(
                {"detail": "Please provide a reason (at least 10 characters)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(reason) > 300:
            return Response(
                {"detail": "Reason must be under 300 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Save the request reason on the booking
        booking.reschedule_note = reason
        booking.save(update_fields=["reschedule_note"])

        booking.reschedule_request_reason = reason
        booking.save(update_fields=["reschedule_request_reason"])

        # Notify staff and managers at the branch
        branch = booking.branch
        if branch:
            recipients = Staff.objects.filter(
                branch=branch,
                role__in=["Staff", "Branch Manager"],
                status="Active",
            ).select_related("user")

            notifications = []
            appointment_time = to_display_time(str(booking.time))
            for staff_member in recipients:
                if not getattr(staff_member, "user_id", None):
                    continue
                notifications.append(
                    Notification(
                        user_id=staff_member.user_id,
                        title="Customer Requested Reschedule",
                        message=(
                            f"{booking.user.get_username() or booking.user.email} requested a reschedule "
                            f"for their {booking.service} appointment on {booking.date} at {appointment_time}. "
                            f"Reason: {reason}"
                        ),
                        notification_type="appointment",
                    )
                )
            if notifications:
                try:
                    Notification.objects.bulk_create(notifications)
                except Exception:
                    logger.exception(
                        "Failed to notify staff for reschedule request booking_id=%s", booking.id
                    )

        # Confirm back to the customer
        _notify_user_inapp_and_email(
            user=booking.user,
            title="Reschedule Request Sent",
            message=(
                f"Your reschedule request for {booking.service} on {booking.date} "
                f"has been sent. Staff will propose a new time shortly."
            ),
            email_subject="Reschedule Request Received - Otokwikk",
        )

        from api.serializers.bookings_serializer import BookingSerializer
        return Response(BookingSerializer(booking).data)