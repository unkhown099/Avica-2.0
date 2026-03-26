import logging
from datetime import date
from datetime import datetime
from datetime import timedelta
from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import QueueEntry, Booking, Staff
from api.serializers.queue_serializer import (
    QueueEntrySerializer,
    QueueEntryCreateSerializer,
    BookingToQueueSerializer,
    AssignEmployeeSerializer,
)

logger = logging.getLogger(__name__)


# ─── Shared helper ────────────────────────────────────────────────────────────

def _get_requester_staff(user):
    try:
        return user.staff_profile
    except Staff.DoesNotExist:
        return None


def _scope_to_requester_branch(queryset, requester_staff):
    if not requester_staff or requester_staff.role == "Admin":
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


def _auto_mark_no_show_entries(queryset):
    now = timezone.localtime(timezone.now())
    for entry in queryset.filter(source="booking", status="waiting").select_related("booking"):
        scheduled_at = _get_booking_scheduled_datetime(entry.booking)
        if not scheduled_at:
            continue

        no_show_deadline = scheduled_at + timedelta(minutes=10)
        if now >= no_show_deadline:
            entry.status = "skipped"
            entry.completed_at = timezone.now()
            entry.save(update_fields=["status", "completed_at"])

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
            queryset = queryset.filter(completed_at__date=selected_date)
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
        price = request.data.get('price', 0)

        save_kwargs = {
            "source": "walk_in",
            "status": "waiting",
            "price": price,
            "payment_status": 'unpaid',
        }

        # For non-admin staff, force walk-ins into their branch so entries don't disappear on refresh.
        if requester_staff and requester_staff.role != "Admin":
            if not requester_staff.branch_id:
                return Response(
                    {"detail": "Your staff account has no branch assigned."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            save_kwargs["branch"] = requester_staff.branch

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
        if scheduled_at and now < scheduled_at:
            return Response(
                {
                    "detail": (
                        f"Cannot start this queue yet. "
                        f"Scheduled appointment starts at {scheduled_at.strftime('%Y-%m-%d %I:%M %p')}."
                    )
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
            status__in=["waiting", "in_service"],
        ).exclude(pk=entry.pk).exists()
        if busy_entry_exists:
            return Response(
                {"detail": "This employee already has an active queue assignment."},
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
    return Response(QueueEntrySerializer(entry).data)


# ── GET  /api/queue/employees/ ────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_employees(request):
    requester_staff = _get_requester_staff(request.user)
    employees = Staff.objects.filter(
        role="Employee", status="Active"
    ).select_related("branch").order_by("first_name", "last_name")

    employees = _scope_to_requester_branch(employees, requester_staff)

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
    requester_staff = getattr(request.user, "staff_profile", None)
    date_param = request.query_params.get('date')
    entries = QueueEntry.objects.filter(
        status__in=["done", "skipped"]
    ).select_related("assigned_employee", "branch", "booking")

    # Non-admin staff can only view queue history from their own branch.
    if requester_staff and requester_staff.role != "Admin":
        if requester_staff.branch_id:
            entries = entries.filter(branch_id=requester_staff.branch_id)
        else:
            entries = entries.none()

    if date_param:
        try:
            selected_date = date.fromisoformat(date_param)
        except ValueError:
            return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)
        entries = entries.filter(completed_at__date=selected_date)

    entries = entries.order_by("-completed_at")[:50]
    return Response(QueueEntrySerializer(entries, many=True).data)


# ── PATCH  /api/queue/<id>/mark-paid/ ────────────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_mark_paid(request, pk):
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=404)

    entry.payment_status = request.data.get("payment_status", "paid")
    entry.payment_method = request.data.get("payment_method", "")
    if "price" in request.data:
        entry.price = request.data["price"]
    entry.save()
    return Response(QueueEntrySerializer(entry).data)
