import logging
from datetime import date
from datetime import datetime
from datetime import timedelta
from decimal import Decimal
from django.db.models import Q
from django.db import transaction
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils import timezone
from django.utils.html import strip_tags
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import QueueEntry, Booking, Staff, InventoryItem, Service, Notification, Customer
from api.serializers.queue_serializer import (
    QueueEntrySerializer,
    QueueEntryCreateSerializer,
    BookingToQueueSerializer,
    AssignEmployeeSerializer,
)

logger = logging.getLogger(__name__)
VEHICLE_TYPE_KEYS = {"motor", "small", "medium", "large", "xl"}


# ─── Shared helper ────────────────────────────────────────────────────────────

def _get_requester_staff(user):
    try:
        return user.staff_profile
    except Staff.DoesNotExist:
        return None


def _scope_to_requester_branch(queryset, requester_staff):
    if not requester_staff or requester_staff.role in ("Admin", "Business Owner", "super_admin"):
        return queryset
    if requester_staff.branch_id:
        return queryset.filter(branch_id=requester_staff.branch_id)
    return queryset.none()


def _get_booking_scheduled_datetime(booking):
    if not booking or not booking.date or not booking.time:
        return None

    time_formats = ["%I:%M %p", "%H:%M", "%H:%M:%S"]
    parsed_time = None
    for fmt in time_formats:
        try:
            parsed_time = datetime.strptime(str(booking.time).strip(), fmt).time()
            break
        except ValueError:
            continue

    if not parsed_time:
        return None

    scheduled = datetime.combine(booking.date, parsed_time)
    if timezone.is_naive(scheduled):
        scheduled = timezone.make_aware(scheduled, timezone.get_current_timezone())
    return scheduled


def _notify_booking_no_show(booking_id):
    if not booking_id:
        return
    try:
        booking = Booking.objects.select_related("user", "branch").get(pk=booking_id)
    except Booking.DoesNotExist:
        return

    try:
        # Lazy import avoids module import cycle (bookings_views imports queue_views).
        from api.views.bookings_views import _notify_customer_booking_status
        _notify_customer_booking_status(booking, "no_show")
    except Exception:
        logger.exception("Failed to send no-show notification for booking_id=%s", booking_id)


def _notify_booking_customer_event(booking_id, event_key):
    if not booking_id:
        return
    try:
        booking = Booking.objects.select_related("user", "branch").get(pk=booking_id)
    except Booking.DoesNotExist:
        return

    event_config = {
        "in_service": {
            "title": "Appointment In Progress",
            "email_subject": "Appointment In Progress - Otokwikk",
            "message": (
                f"Your appointment for {booking.service} on {booking.date} at "
                f"{booking.time} is now in progress."
            ),
        },
        "done": {
            "title": "Appointment Completed",
            "email_subject": "Appointment Completed - Otokwikk",
            "message": (
                f"Your appointment for {booking.service} on {booking.date} at "
                f"{booking.time} has been completed."
            ),
        },
        "paid": {
            "title": "Payment Received",
            "email_subject": "Payment Received - Otokwikk",
            "message": (
                f"Payment for your appointment ({booking.service} on {booking.date} at "
                f"{booking.time}) has been marked as paid."
            ),
        },
    }

    config = event_config.get(event_key)
    if not config:
        return

    try:
        Notification.objects.create(
            user=booking.user,
            title=config["title"],
            message=config["message"],
            notification_type="appointment",
            target_path="/bookings",
        )
    except Exception:
        logger.exception("Failed to create %s notification for booking_id=%s", event_key, booking_id)

    if not booking.user.email:
        return

    branch_name = booking.branch.name if booking.branch else "your selected branch"
    html_content = f"""
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
                <h1>{config["title"]}</h1>
                <p>{config["message"]}</p>
                <p style="font-size: 14px; margin-top: 18px; color: #d1d5db;">Branch: {branch_name}</p>
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
    try:
        msg = EmailMultiAlternatives(
            config["email_subject"],
            strip_tags(html_content),
            settings.DEFAULT_FROM_EMAIL,
            [booking.user.email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception:
        logger.exception("Failed to send %s email for booking_id=%s", event_key, booking_id)


def _notify_queue_customer_event(entry, event_key):
    if not entry:
        return
    if entry.booking_id:
        _notify_booking_customer_event(entry.booking_id, event_key)
        return
    if not entry.customer_user_id:
        return

    event_config = {
        "in_service": {
            "title": "Walk-in Service In Progress",
            "email_subject": "Walk-in Service In Progress - Otokwikk",
            "message": f"Your walk-in service ({entry.service}) is now in progress.",
        },
        "done": {
            "title": "Walk-in Service Completed",
            "email_subject": "Walk-in Service Completed - Otokwikk",
            "message": f"Your walk-in service ({entry.service}) has been completed.",
        },
        "paid": {
            "title": "Walk-in Payment Received",
            "email_subject": "Walk-in Payment Received - Otokwikk",
            "message": f"Payment for your walk-in service ({entry.service}) has been marked as paid.",
        },
    }
    config = event_config.get(event_key)
    if not config:
        return

    try:
        Notification.objects.create(
            user=entry.customer_user,
            title=config["title"],
            message=config["message"],
            notification_type="appointment",
            target_path="/bookings",
        )
    except Exception:
        logger.exception("Failed to create %s notification for queue_entry_id=%s", event_key, entry.id)

    user_email = getattr(entry.customer_user, "email", "")
    if not user_email:
        return

    branch_name = entry.branch.name if entry.branch else (entry.branch_name or "your selected branch")
    html_content = f"""
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
                <h1>{config["title"]}</h1>
                <p>{config["message"]}</p>
                <p style="font-size: 14px; margin-top: 18px; color: #d1d5db;">Branch: {branch_name}</p>
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
    try:
        msg = EmailMultiAlternatives(
            config["email_subject"],
            strip_tags(html_content),
            settings.DEFAULT_FROM_EMAIL,
            [user_email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
    except Exception:
        logger.exception("Failed to send %s walk-in email for queue_entry_id=%s", event_key, entry.id)


def _auto_mark_no_show_entries(queryset):
    now = timezone.localtime(timezone.now())
    for entry in queryset.filter(source="booking", status="waiting").select_related("booking"):
        scheduled_at = _get_booking_scheduled_datetime(entry.booking)
        if not scheduled_at:
            continue

        no_show_deadline = scheduled_at + timedelta(minutes=10)
        # Allow service start up to and including the 10-minute mark.
        if now > no_show_deadline:
            entry.status = "skipped"
            entry.completed_at = timezone.now()
            entry.save(update_fields=["status", "completed_at"])
            if entry.booking_id:
                Booking.objects.filter(pk=entry.booking_id).update(
                    status="no_show",
                    cancellation_reason="Marked as no-show: service was not started within 10 minutes of schedule.",
                )
                _notify_booking_no_show(entry.booking_id)


def _local_date(dt):
    if not dt:
        return None
    return timezone.localtime(dt).date()


def _entry_matches_selected_date(entry, selected_date):
    if _local_date(entry.completed_at) == selected_date:
        return True
    if entry.source == "booking" and entry.booking and entry.booking.date == selected_date:
        return True
    if entry.source == "walk_in" and _local_date(entry.queued_at) == selected_date:
        return True
    return False


def _booking_to_queue_entry(booking):
    """
    Convert a confirmed Booking into a QueueEntry.
    Safe to call multiple times — returns existing entry if already created.
    """
    import traceback
    
    print("\n" + "="*50)
    print(f"DEBUG: _booking_to_queue_entry called for booking #{booking.id}")
    print("="*50)
    
    # Guard: don't create duplicates
    existing = QueueEntry.objects.filter(booking=booking).first()
    if existing:
        print(f"DEBUG: Found existing queue entry #{existing.id}")
        return existing

    # Resolve customer name + phone safely
    customer_name = ""
    phone = ""
    try:
        profile = booking.user.customer_profile
        customer_name = f"{profile.first_name} {profile.last_name}".strip()
        phone = profile.phone or ""
        print(f"DEBUG: Customer profile found: {customer_name}, {phone}")
    except Exception as e:
        print(f"DEBUG: Could not get customer profile: {e}")

    if not customer_name:
        customer_name = booking.user.email or "Unknown"
        print(f"DEBUG: Using email as customer name: {customer_name}")

    branch_obj = booking.branch
    
    if branch_obj is None:
        error_msg = f"Booking #{booking.id} has no branch associated! Cannot create queue entry."
        print(f"ERROR: {error_msg}")
        raise ValueError(error_msg)
    
    branch_id   = branch_obj.id
    branch_name = branch_obj.name
    
    print(f"DEBUG: Creating queue entry with branch_id={branch_id}, branch_name={branch_name}")

    try:
        entry_data = {
            'booking':        booking,
            'customer_name':  customer_name,
            'phone':          phone,
            'vehicle':        booking.vehicle or "",
            'plate_number':   booking.plate_number or "",
            'service':        booking.service or "",
            'branch':         branch_obj,
            'branch_name':    branch_name,
            'notes':          booking.notes or "",
            'source':         "booking",
            'status':         "waiting",
            'payment_method': '',
            'payment_status': 'unpaid',
            'price':          booking.price if booking.price else 0,
        }
        
        print(f"DEBUG: Creating QueueEntry with data:")
        for key, value in entry_data.items():
            if key == 'booking':
                print(f"  - {key}: {value.id} ({value})")
            elif key == 'branch':
                print(f"  - {key}: {value.name} (ID: {value.id}) - Branch OBJECT")
            else:
                print(f"  - {key}: {value}")
        
        entry = QueueEntry.objects.create(**entry_data)
        print(f"DEBUG: Queue entry created successfully with ID: {entry.id}")
        
    except Exception as e:
        print(f"ERROR: Failed to create queue entry: {e}")
        print(f"ERROR type: {type(e)}")
        print(f"ERROR details: {traceback.format_exc()}")
        raise

    print(f"✅ Queue entry #{entry.id} created at position #{entry.position}")
    print("="*50 + "\n")
    return entry


def _notify_employee_task_assigned(queue_entry):
    """Notify employee when a task is assigned to them."""
    assigned_employee = getattr(queue_entry, "assigned_employee", None)
    if not assigned_employee:
        return

    user = getattr(assigned_employee, "user", None)
    if not user:
        return

    customer_name = getattr(queue_entry, "customer_name", "Customer")
    service = getattr(queue_entry, "service", "Service")
    vehicle = getattr(queue_entry, "vehicle", "")
    
    message = f"New task assigned: {service} for {customer_name}"
    if vehicle:
        message += f" ({vehicle})"

    try:
        Notification.objects.create(
            user=user,
            title="Task Assigned",
            message=message,
            notification_type="task",
            target_path="/employee/active-jobs",
        )
    except Exception:
        logger.exception(
            "Failed to notify employee for task assignment entry_id=%s employee_id=%s",
            queue_entry.id,
            assigned_employee.id,
        )


# ── GET  /api/queue/ ──────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_list(request):
    status_param   = request.query_params.get('status')
    payment_status = request.query_params.get('payment_status')
    date_param = request.query_params.get('date')
    requester_staff = _get_requester_staff(request.user)
    
    queryset = QueueEntry.objects.all().select_related("assigned_employee", "branch", "booking")
    queryset = _scope_to_requester_branch(queryset, requester_staff)

    # Auto-mark overdue booking entries as no-show after 10 minutes past schedule.
    _auto_mark_no_show_entries(queryset)
    
    if status_param:
        queryset = queryset.filter(status=status_param)
    else:
        queryset = queryset.filter(status__in=["waiting", "in_service"])
    
    if payment_status:
        queryset = queryset.filter(payment_status=payment_status)

    if date_param:
        try:
            selected_date = date.fromisoformat(date_param)
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        # Keep ongoing services visible across date filters so active work does not disappear.
        if not status_param:
            queryset = queryset.filter(
                Q(status="in_service")
                | Q(status="waiting", booking__date=selected_date)
                | Q(status="waiting", booking__isnull=True, queued_at__date=selected_date)
            )
        elif status_param == "in_service":
            pass
        elif status_param == "waiting":
            queryset = queryset.filter(
                Q(booking__date=selected_date)
                | Q(booking__isnull=True, queued_at__date=selected_date)
            )
        elif status_param in ["done", "skipped"]:
            queryset = queryset.filter(
                Q(completed_at__date=selected_date)
                | Q(source="booking", status__in=["done", "skipped"], booking__date=selected_date)
                | Q(source="walk_in", status="done", queued_at__date=selected_date)
            )
        else:
            queryset = queryset.filter(
                Q(booking__date=selected_date)
                | Q(booking__isnull=True, queued_at__date=selected_date)
            )
    
    queryset = queryset.order_by("position", "queued_at")
    return Response(QueueEntrySerializer(queryset, many=True).data)


# ── POST  /api/queue/walk-in/ ─────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def queue_walk_in(request):
    requester_staff = _get_requester_staff(request.user)
    serializer = QueueEntryCreateSerializer(data=request.data)
    if serializer.is_valid():
        service_name = (serializer.validated_data.get("service") or "").strip()
        incoming_name = (serializer.validated_data.get("customer_name") or "").strip()
        incoming_phone = (serializer.validated_data.get("phone") or "").strip()
        raw_price = request.data.get("price")

        try:
            price = Decimal(str(raw_price)) if raw_price not in (None, "") else None
        except Exception:
            price = None

        if price is None and service_name:
            service = Service.objects.filter(name__iexact=service_name, is_active=True).first()
            if service:
                price = service.price or Decimal("0.00")

        if price is None:
            price = Decimal("0.00")

        save_kwargs = {
            "source": "walk_in",
            "status": "waiting",
            "price": price,
            "payment_status": 'unpaid',
        }

        customer_id = serializer.validated_data.get("customer_id")
        customer = None
        if customer_id not in (None, ""):
            customer = Customer.objects.filter(pk=customer_id).select_related("user").first()
            if not customer:
                return Response(
                    {"detail": "Selected customer not found."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            save_kwargs["customer_user"] = customer.user
            name_parts = incoming_name.split(None, 1)
            customer.first_name = name_parts[0] if name_parts else customer.first_name
            customer.last_name = name_parts[1] if len(name_parts) > 1 else customer.last_name
            customer.phone = incoming_phone or customer.phone
            customer.save(update_fields=["first_name", "last_name", "phone"])

        # For non-admin staff, force walk-ins into their branch so entries don't disappear on refresh.
        if requester_staff and requester_staff.role != "Admin":
            if not requester_staff.branch_id:
                return Response(
                    {"detail": "Your staff account has no branch assigned."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            save_kwargs["branch"] = requester_staff.branch

        active_entries = QueueEntry.objects.filter(status__in=["waiting", "in_service"])
        if save_kwargs.get("branch"):
            active_entries = active_entries.filter(branch=save_kwargs["branch"])

        duplicate_filter = Q()
        has_duplicate_key = False
        if customer and customer.user_id:
            duplicate_filter |= Q(customer_user_id=customer.user_id)
            has_duplicate_key = True
        if incoming_phone:
            duplicate_filter |= Q(phone__iexact=incoming_phone)
            has_duplicate_key = True
        if incoming_name:
            duplicate_filter |= Q(customer_name__iexact=incoming_name)
            has_duplicate_key = True

        if has_duplicate_key and active_entries.filter(duplicate_filter).exists():
            return Response(
                {"detail": "This customer is already queued and currently in process."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        entry = serializer.save(
            **save_kwargs,
        )
        return Response(QueueEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── POST  /api/queue/from-booking/ ───────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def queue_from_booking(request):
    serializer = BookingToQueueSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    booking_id = serializer.validated_data["booking_id"]
    try:
        booking = Booking.objects.select_related(
            "branch", "user__customer_profile"
        ).get(id=booking_id, status="confirmed")
    except Booking.DoesNotExist:
        return Response(
            {"detail": "Booking not found or not confirmed."},
            status=status.HTTP_404_NOT_FOUND,
        )

    entry = _booking_to_queue_entry(booking)
    return Response(QueueEntrySerializer(entry).data, status=status.HTTP_201_CREATED)


# ── PATCH  /api/queue/<id>/action/ ───────────────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_action(request, pk):
    try:
        entry = QueueEntry.objects.select_related("booking").get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    allowed     = [s[0] for s in QueueEntry.STATUS_CHOICES]
    new_status  = request.data.get("status")
    if new_status not in allowed:
        return Response(
            {"detail": f"Invalid status. Allowed: {allowed}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_status == "in_service" and not entry.assigned_employee_id:
        return Response(
            {"detail": "Assign an employee before starting service."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if new_status == "in_service" and entry.source == "booking" and entry.booking_id:
        scheduled_at = _get_booking_scheduled_datetime(entry.booking)
        now = timezone.localtime(timezone.now())
        if scheduled_at:
            start_window_open = scheduled_at
            no_show_deadline = scheduled_at + timedelta(minutes=10)

            if now < start_window_open:
                return Response(
                    {
                        "detail": (
                            "Cannot start this queue yet. "
                            f"You can only start at the appointment time and within 10 minutes after "
                            f"({scheduled_at.strftime('%Y-%m-%d %I:%M %p')} to {no_show_deadline.strftime('%I:%M %p')})."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if now > no_show_deadline:
                entry.status = "skipped"
                entry.completed_at = timezone.now()
                entry.save(update_fields=["status", "completed_at"])
                Booking.objects.filter(pk=entry.booking_id).update(
                    status="no_show",
                    cancellation_reason="Marked as no-show: service was not started within 10 minutes of schedule.",
                )
                _notify_booking_no_show(entry.booking_id)
                return Response(
                    {
                        "detail": "Appointment exceeded the 10-minute grace period and was marked as no-show.",
                        "entry": QueueEntrySerializer(entry).data,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

    entry.status = new_status

    if new_status == "in_service" and not entry.service_started_at:
        entry.service_started_at = timezone.now()

    if new_status in ("done", "skipped"):
        entry.completed_at = timezone.now()

    entry.save()

    # FIX: When a queue entry is marked "done", sync the linked Booking status.
    # This is what makes "Completed" show up on the customer dashboard instead
    # of staying stuck on "Confirmed" forever.
    if new_status == "done" and entry.booking_id:
        Booking.objects.filter(pk=entry.booking_id).update(status="done")
    if new_status == "done":
        _notify_queue_customer_event(entry, "done")

    if new_status == "in_service":
        _notify_queue_customer_event(entry, "in_service")

    return Response(QueueEntrySerializer(entry).data)


# ── PATCH  /api/queue/<id>/assign/ ───────────────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_assign(request, pk):
    requester_staff = _get_requester_staff(request.user)
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    # Non-admin staff can only assign employees for queue entries in their branch.
    if requester_staff and requester_staff.role != "Admin":
        if not requester_staff.branch_id or entry.branch_id != requester_staff.branch_id:
            return Response({"detail": "You can only manage queue entries in your branch."}, status=status.HTTP_403_FORBIDDEN)

    serializer = AssignEmployeeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    employee_id = serializer.validated_data["employee_id"]
    if employee_id is None:
        if entry.assigned_employee_id:
            return Response(
                {"detail": "Assigned employee cannot be removed once set."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        entry.assigned_employee = None
    else:
        try:
            employee = Staff.objects.get(pk=employee_id, role="Employee")
        except Staff.DoesNotExist:
            return Response({"detail": "Employee not found."}, status=status.HTTP_404_NOT_FOUND)

        busy_entry_exists = QueueEntry.objects.filter(
            assigned_employee_id=employee.id,
            status="in_service",
        ).exclude(pk=entry.pk).exists()
        if busy_entry_exists:
            return Response(
                {"detail": "This employee is currently in progress on another queue."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Keep assignment branch-consistent.
        if entry.branch_id and employee.branch_id != entry.branch_id:
            return Response({"detail": "Employee must belong to the same branch as the queue entry."}, status=status.HTTP_400_BAD_REQUEST)

        if requester_staff and requester_staff.role != "Admin":
            if employee.branch_id != requester_staff.branch_id:
                return Response({"detail": "You can only assign employees from your branch."}, status=status.HTTP_403_FORBIDDEN)

        entry.assigned_employee = employee

    entry.save()
    
    # Notify employee if a task was assigned (not if cleared)
    if entry.assigned_employee:
        _notify_employee_task_assigned(entry)
    
    return Response(QueueEntrySerializer(entry).data)


# ── GET  /api/queue/employees/ ────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_employees(request):
    requester_staff = _get_requester_staff(request.user)
    branch_id = request.query_params.get("branch_id")

    employees = Staff.objects.filter(
        role="Employee", status="Active"
    ).select_related("branch").order_by("first_name", "last_name")

    employees = _scope_to_requester_branch(employees, requester_staff)

    if branch_id:
        if not str(branch_id).isdigit():
            return Response({"detail": "branch_id must be a valid integer."}, status=status.HTTP_400_BAD_REQUEST)
        employees = employees.filter(branch_id=int(branch_id))

    data = [
        {
            "id":        e.id,
            "full_name": f"{e.first_name} {e.last_name}".strip(),
            "branch":    e.branch.name if e.branch else e.branch_name or "",
        }
        for e in employees
    ]
    return Response(data)


# ── DELETE  /api/queue/<id>/ ─────────────────────────────────────────────────
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def queue_remove(request, pk):
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
    entry.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


# ── GET  /api/queue/history/ ─────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_history(request):
    requester_staff = _get_requester_staff(request.user)
    date_param = request.query_params.get('date')

    # Ensure auto no-shows are reflected immediately in today's history.
    base_scope = QueueEntry.objects.all().select_related("booking")
    base_scope = _scope_to_requester_branch(base_scope, requester_staff)
    _auto_mark_no_show_entries(base_scope)

    entries = QueueEntry.objects.filter(
        status__in=["done", "skipped"]
    ).select_related("assigned_employee", "branch", "booking")

    # Non-admin/owner staff can only view queue history from their own branch.
    if requester_staff and requester_staff.role not in ("Admin", "Business Owner", "super_admin"):
        if requester_staff.branch_id:
            entries = entries.filter(branch_id=requester_staff.branch_id)
        else:
            entries = entries.none()

    if date_param:
        try:
            selected_date = date.fromisoformat(date_param)
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        entries = [entry for entry in entries if _entry_matches_selected_date(entry, selected_date)]
    else:
        entries = list(entries)

    entries.sort(
        key=lambda e: (
            e.completed_at or e.queued_at or timezone.make_aware(datetime.min)
        ),
        reverse=True,
    )
    rows = QueueEntrySerializer(entries[:50], many=True).data
    for idx, entry in enumerate(entries[:50]):
        duration_minutes = None
        if entry.service_started_at and entry.completed_at:
            delta = entry.completed_at - entry.service_started_at
            duration_minutes = max(int(delta.total_seconds() // 60), 0)

        rating_score = None
        rating_comment = ""
        if entry.booking_id and hasattr(entry.booking, "rating"):
            rating_score = entry.booking.rating.score
            rating_comment = entry.booking.rating.comment or ""
        elif entry.rating_score:
            rating_score = entry.rating_score
            rating_comment = entry.rating_comment or ""

        rows[idx]["duration_minutes"] = duration_minutes
        rows[idx]["rating_score"] = rating_score
        rows[idx]["rating_comment"] = rating_comment

    return Response(rows)


# ── PATCH  /api/queue/<id>/mark-paid/ ────────────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_mark_paid(request, pk):
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    previous_payment_status = entry.payment_status
    entry.payment_status = request.data.get("payment_status", "paid")
    entry.payment_method = request.data.get("payment_method", "")
    if "price" in request.data:
        entry.price = request.data["price"]
    entry.save()

    if previous_payment_status != "paid" and entry.payment_status == "paid":
        _notify_queue_customer_event(entry, "paid")

    return Response(QueueEntrySerializer(entry).data)


# ── GET  /api/queue/<id>/products/ ──────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_available_products(request, pk):
    requester_staff = _get_requester_staff(request.user)
    if not requester_staff or requester_staff.role != "Employee":
        return Response({"detail": "Only employees can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)

    try:
        entry = QueueEntry.objects.select_related("branch").get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if entry.status != "in_service":
        return Response({"detail": "Products can only be added while job is in progress."}, status=status.HTTP_400_BAD_REQUEST)

    if entry.assigned_employee_id != requester_staff.id:
        return Response({"detail": "You can only manage products for your assigned job."}, status=status.HTTP_403_FORBIDDEN)

    if not entry.branch_id:
        return Response({"detail": "Queue entry has no branch assigned."}, status=status.HTTP_400_BAD_REQUEST)

    items = InventoryItem.objects.filter(
        branch_id=entry.branch_id,
        is_active=True,
        quantity__gt=0,
    ).order_by("name")

    data = [
        {
            "id": i.id,
            "name": i.name,
            "price": str(i.price),
            "quantity": i.quantity,
            "unit": i.unit,
            "category": i.category,
        }
        for i in items
    ]
    return Response(data)


# ── PATCH  /api/queue/<id>/add-products/ ────────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_add_products(request, pk):
    requester_staff = _get_requester_staff(request.user)
    if not requester_staff or requester_staff.role != "Employee":
        return Response({"detail": "Only employees can add products."}, status=status.HTTP_403_FORBIDDEN)

    try:
        entry = QueueEntry.objects.select_related("branch").get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if entry.status != "in_service":
        return Response({"detail": "Products can only be added while job is in progress."}, status=status.HTTP_400_BAD_REQUEST)

    if entry.assigned_employee_id != requester_staff.id:
        return Response({"detail": "You can only add products to your assigned job."}, status=status.HTTP_403_FORBIDDEN)

    if not entry.branch_id:
        return Response({"detail": "Queue entry has no branch assigned."}, status=status.HTTP_400_BAD_REQUEST)

    items = request.data.get("items")
    if not isinstance(items, list) or len(items) == 0:
        return Response({"detail": "items must be a non-empty list."}, status=status.HTTP_400_BAD_REQUEST)

    normalized = []
    for row in items:
        if not isinstance(row, dict):
            return Response({"detail": "Each item must be an object."}, status=status.HTTP_400_BAD_REQUEST)

        item_id = row.get("inventory_item_id")
        qty = row.get("quantity")
        try:
            item_id = int(item_id)
            qty = int(qty)
        except (TypeError, ValueError):
            return Response({"detail": "inventory_item_id and quantity must be integers."}, status=status.HTTP_400_BAD_REQUEST)

        if qty <= 0:
            return Response({"detail": "quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        normalized.append((item_id, qty))

    added_total = Decimal("0.00")
    added_rows = []

    with transaction.atomic():
        for item_id, qty in normalized:
            try:
                inv = InventoryItem.objects.select_for_update().get(
                    pk=item_id,
                    branch_id=entry.branch_id,
                    is_active=True,
                )
            except InventoryItem.DoesNotExist:
                return Response({"detail": f"Inventory item {item_id} not found in this branch."}, status=status.HTTP_404_NOT_FOUND)

            if inv.quantity < qty:
                return Response(
                    {"detail": f"Insufficient stock for {inv.name}. Available: {inv.quantity}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inv.quantity -= qty
            inv.save(update_fields=["quantity", "updated_at"])

            line_total = (inv.price or Decimal("0.00")) * qty
            added_total += line_total
            added_rows.append({
                "inventory_item_id": inv.id,
                "name": inv.name,
                "quantity": qty,
                "unit_price": str(inv.price),
                "line_total": str(line_total),
            })

        entry.price = (entry.price or Decimal("0.00")) + added_total
        existing_notes = entry.notes or ""
        appended = ", ".join([f"{r['name']} x{r['quantity']}" for r in added_rows])
        note_line = f"[Products Added] {appended} (+{added_total})"
        entry.notes = f"{existing_notes}\n{note_line}".strip()
        entry.save(update_fields=["price", "notes"])

    return Response(
        {
            "detail": "Products added successfully.",
            "added_total": str(added_total),
            "added_items": added_rows,
            "entry": QueueEntrySerializer(entry).data,
        },
        status=status.HTTP_200_OK,
    )


# ── PATCH  /api/queue/<id>/service-details/ ────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_edit_service_details(request, pk):
    requester_staff = _get_requester_staff(request.user)
    if not requester_staff or requester_staff.role != "Employee":
        return Response({"detail": "Only employees can edit service details."}, status=status.HTTP_403_FORBIDDEN)

    try:
        entry = QueueEntry.objects.select_related("branch").get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    if entry.status != "in_service":
        return Response({"detail": "Service details can only be edited while job is in progress."}, status=status.HTTP_400_BAD_REQUEST)

    if entry.assigned_employee_id != requester_staff.id:
        return Response({"detail": "You can only edit details for your assigned job."}, status=status.HTTP_403_FORBIDDEN)

    if not entry.branch_id:
        return Response({"detail": "Queue entry has no branch assigned."}, status=status.HTTP_400_BAD_REQUEST)

    vehicle_type = (request.data.get("vehicle_type") or "").strip().lower()
    if vehicle_type and vehicle_type not in VEHICLE_TYPE_KEYS:
        return Response(
            {"detail": f"Invalid vehicle_type. Allowed: {sorted(VEHICLE_TYPE_KEYS)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    items = request.data.get("items", [])
    if items is None:
        items = []
    if not isinstance(items, list):
        return Response({"detail": "items must be a list."}, status=status.HTTP_400_BAD_REQUEST)

    normalized = []
    for row in items:
        if not isinstance(row, dict):
            return Response({"detail": "Each item must be an object."}, status=status.HTTP_400_BAD_REQUEST)

        item_id = row.get("inventory_item_id")
        qty = row.get("quantity")
        try:
            item_id = int(item_id)
            qty = int(qty)
        except (TypeError, ValueError):
            return Response({"detail": "inventory_item_id and quantity must be integers."}, status=status.HTTP_400_BAD_REQUEST)

        if qty <= 0:
            return Response({"detail": "quantity must be greater than 0."}, status=status.HTTP_400_BAD_REQUEST)

        normalized.append((item_id, qty))

    service_obj = Service.objects.filter(name__iexact=(entry.service or "").strip()).first()
    base_price = Decimal(str(service_obj.price if service_obj else 0))
    if service_obj and vehicle_type:
        tier_prices = service_obj.price_list if isinstance(service_obj.price_list, dict) else {}
        tier_value = tier_prices.get(vehicle_type)
        if tier_value not in (None, ""):
            try:
                base_price = Decimal(str(tier_value))
            except Exception:
                pass

    previous_base = Decimal(str(entry.service_base_price or 0))
    previous_total = Decimal(str(entry.price or 0))
    previous_products_total = previous_total - previous_base
    if previous_products_total < Decimal("0.00"):
        previous_products_total = Decimal("0.00")

    added_total = Decimal("0.00")
    added_rows = []

    with transaction.atomic():
        for item_id, qty in normalized:
            try:
                inv = InventoryItem.objects.select_for_update().get(
                    pk=item_id,
                    branch_id=entry.branch_id,
                    is_active=True,
                )
            except InventoryItem.DoesNotExist:
                return Response({"detail": f"Inventory item {item_id} not found in this branch."}, status=status.HTTP_404_NOT_FOUND)

            if inv.quantity < qty:
                return Response(
                    {"detail": f"Insufficient stock for {inv.name}. Available: {inv.quantity}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inv.quantity -= qty
            inv.save(update_fields=["quantity", "updated_at"])

            line_total = (inv.price or Decimal("0.00")) * qty
            added_total += line_total
            added_rows.append(
                {
                    "inventory_item_id": inv.id,
                    "name": inv.name,
                    "quantity": qty,
                    "unit_price": str(inv.price),
                    "line_total": str(line_total),
                }
            )

        new_total = previous_products_total + base_price + added_total
        entry.service_base_price = base_price
        if vehicle_type:
            entry.vehicle_type = vehicle_type
        entry.price = new_total

        existing_notes = entry.notes or ""
        # Keep user notes clean: remove prior auto-generated service detail lines.
        cleaned_notes = "\n".join(
            line for line in existing_notes.splitlines()
            if not line.strip().startswith("[Service Details]")
            and not line.strip().startswith("[Required Products]")
        ).strip()
        entry.notes = cleaned_notes

        entry.save(update_fields=["service_base_price", "vehicle_type", "price", "notes"])

        return Response({
            "message": "Service details updated successfully",
            "entry": QueueEntrySerializer(entry).data
        }, status=200)

from api.models import ServiceMessage
from api.serializers.queue_serializer import ServiceMessageSerializer

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def queue_messages(request, pk):
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"error": "Queue entry not found"}, status=404)

    # Resolve partner parties to enable history continuation
    partner_employee = entry.assigned_employee
    partner_customer = entry.customer_user if entry.customer_user else (entry.booking.user if entry.booking else None)

    # Identifiers for the pair
    is_customer = False
    is_staff_handling = False
    is_staff = hasattr(request.user, "staff_profile")
    
    # Staff handling: entry.assigned_employee or any Admin/Branch Manager in same branch
    if is_staff:
        staff_profile = request.user.staff_profile
        if staff_profile.role in ["Admin", "Business Owner", "super_admin", "Branch Manager"]:
             # Admin roles can see any chat in their branch
             if not staff_profile.branch_id or entry.branch_id == staff_profile.branch_id:
                  is_staff_handling = True
        elif partner_employee and staff_profile.id == partner_employee.id:
            is_staff_handling = True
    elif partner_customer and request.user.id == partner_customer.id:
        is_customer = True

    if not is_staff_handling and not is_customer:
        return Response({"error": "You do not have access to this conversation"}, status=403)

    if request.method == "GET":
        # History Continuation: Fetch messages for THIS PAIR across ALL their shared entries
        if partner_employee and partner_customer:
            all_shared_entries = QueueEntry.objects.filter(
                Q(assigned_employee=partner_employee, customer_user=partner_customer) |
                Q(assigned_employee=partner_employee, booking__user=partner_customer)
            ).values_list('id', flat=True)
            messages = ServiceMessage.objects.filter(queue_entry_id__in=all_shared_entries).order_by("created_at")
        else:
            # Fallback for unassigned or incomplete pairs
            messages = ServiceMessage.objects.filter(queue_entry=entry).order_by("created_at")
        
        # Mark unread messages as read for this entire pair's history
        if is_staff_handling:
            messages.filter(sender_type="customer", is_read=False).update(is_read=True)
        else:
            messages.filter(sender_type="employee", is_read=False).update(is_read=True)
            
        serializer = ServiceMessageSerializer(messages, many=True)
        return Response(serializer.data, status=200)

    elif request.method == "POST":
        message_text = request.data.get("message", "").strip()
        if not message_text:
            return Response({"error": "Message content is required"}, status=400)

        sender_type = "employee" if is_staff_handling else "customer"

        msg = ServiceMessage.objects.create(
            queue_entry=entry,
            sender_user=request.user,
            sender_type=sender_type,
            message=message_text,
            is_read=False
        )

        # Notify the other party
        # Chat messages are handled in real-time or via their own unread markers,
        # so we don't spam the system Notifications bell.

        return Response(ServiceMessageSerializer(msg).data, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_conversations(request):
    user = request.user
    
    # Identify the user's role and profile
    is_customer = hasattr(user, 'customer_profile')
    is_staff = hasattr(user, 'staff_profile')
    
    if is_customer:
        # Customers see conversations for their bookings (linked to queue_entry) or direct walk-ins
        queryset = QueueEntry.objects.filter(
            Q(booking__user=user) | Q(customer_user=user)
        ).select_related('assigned_employee', 'branch').order_by('-queued_at')
    
    elif is_staff:
        staff = user.staff_profile
        if staff.role == 'Employee':
            # Employees see conversations they are assigned to
            queryset = QueueEntry.objects.filter(
                assigned_employee=staff
            ).select_related('branch').order_by('-queued_at')
        else:
            # Admins/Branch Managers etc. are NOT allowed to use messaging features
            return Response([])
    else:
        return Response([])

    data = []
    processed_pairs = set()
    
    # Fetch recent conversations, processed to show unique pairs (history continuation)
    for entry in queryset:
        # Resolve the customer user
        cust_user = entry.customer_user if entry.customer_user else (entry.booking.user if entry.booking else None)
        
        if not cust_user or not entry.assigned_employee:
            # Individual entry fallback if parties are not linked
            pair_key = f"entry_{entry.id}"
        else:
            # Use a tuple of IDs as a unique key for the pair
            # We add a prefix to staff IDs to avoid overlaps if same ID exists in User and Staff
            pair_key = tuple(sorted([f"u_{cust_user.id}", f"s_{entry.assigned_employee.id}"]))

        if pair_key in processed_pairs:
            continue
        processed_pairs.add(pair_key)

        # Count unread messages across all shared entries for this pair
        unread_count = 0
        all_shared_entries = QueueEntry.objects.filter(
            Q(assigned_employee=entry.assigned_employee, customer_user=cust_user) |
            Q(assigned_employee=entry.assigned_employee, booking__user=cust_user)
        ) if cust_user and entry.assigned_employee else QueueEntry.objects.filter(id=entry.id)

        if is_staff:
            unread_count = ServiceMessage.objects.filter(
                queue_entry__in=all_shared_entries,
                sender_type='customer',
                is_read=False
            ).count()
        else:
            unread_count = ServiceMessage.objects.filter(
                queue_entry__in=all_shared_entries,
                sender_type='employee',
                is_read=False
            ).count()

        # Get the absolute latest message for this pair
        last_msg = ServiceMessage.objects.filter(queue_entry__in=all_shared_entries).order_by('-created_at').first()
            
        # Determine overall conversation status
        # An entry is truly active only if it's waiting/in_service AND the booking isn't finalized
        active_entries = all_shared_entries.filter(status__in=['waiting', 'in_service']).exclude(
            booking__status__in=['done', 'no_show', 'cancelled', 'cancelled_by_customer']
        )
        active_entry = active_entries.order_by('-queued_at').first()
        
        # Determine what to show in the UI
        display_entry = active_entry if active_entry else entry
        display_status = display_entry.status
        
        # If there's a booking, its status is often more descriptive (e.g., No Show/Cancelled)
        if display_entry.booking and display_entry.booking.status in ['done', 'no_show', 'cancelled', 'cancelled_by_customer']:\
            display_status = display_entry.booking.status
            
        def get_pic_url(user):
            if not user: return None
            
            def resolve_url(pic_field):
                if not pic_field: return None
                # If it's a string or the raw name in DB starts with http, it's an external URL
                try:
                    name = getattr(pic_field, 'name', '') or str(pic_field)
                    if name.startswith('http'):
                        return name
                    if hasattr(pic_field, 'url'):
                        return pic_field.url
                except:
                    pass
                return None

            try:
                if hasattr(user, 'customer_profile') and user.customer_profile.profile_picture:
                    pic = resolve_url(user.customer_profile.profile_picture)
                    if pic: return pic
            except:
                pass
            try:
                if hasattr(user, 'staff_profile') and user.staff_profile.profile_picture:
                    pic = resolve_url(user.staff_profile.profile_picture)
                    if pic: return pic
            except:
                pass
            return None

        data.append({
            "id": display_entry.id,
            "customer_name": entry.customer_name,
            "customer_pic": get_pic_url(cust_user),
            "service": entry.service,
            "status": display_status,
            "employee_name": f"{entry.assigned_employee.first_name} {entry.assigned_employee.last_name}" if entry.assigned_employee else "TBA",
            "employee_pic": get_pic_url(entry.assigned_employee.user) if entry.assigned_employee else None,
            "last_message": last_msg.message if last_msg else None,
            "last_message_at": last_msg.created_at if last_msg else None,
            "unread_count": unread_count,
            "branch": entry.branch.name if entry.branch else entry.branch_name or "TBA"
        })
        
        if len(data) >= 20: break
    
    return Response(data)

