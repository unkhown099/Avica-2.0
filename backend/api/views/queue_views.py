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


# ─── Shared helper ────────────────────────────────────────────────────────────

def _booking_to_queue_entry(booking):
    """
    Create a QueueEntry from a confirmed Booking.
    Resolves customer name + phone from the linked Customer profile.
    Safe to call directly from StaffBookingActionView.
    """
    # Avoid duplicates (idempotent)
    if QueueEntry.objects.filter(booking=booking).exists():
        return QueueEntry.objects.get(booking=booking)

    try:
        profile = booking.user.customer_profile  # api.Customer
        customer_name = f"{profile.first_name} {profile.last_name}".strip()
        phone = profile.phone or ""
    except Exception:
        customer_name = booking.user.email
        phone = ""

    branch_name = booking.branch.name if booking.branch else ""

    return QueueEntry.objects.create(
        booking=booking,
        customer_name=customer_name or booking.user.email,
        phone=phone,
        vehicle=booking.vehicle,
        plate_number=booking.plate_number,
        service=booking.service,
        branch=branch_name,
        notes=booking.notes,
        source="booking",
        status="waiting",
    )


# ── GET  /api/queue/ ──────────────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_list(request):
    """Return all active (waiting + in_service) queue entries."""
    entries = QueueEntry.objects.filter(
        status__in=["waiting", "in_service"]
    ).select_related("assigned_employee").order_by("position", "queued_at")
    return Response(QueueEntrySerializer(entries, many=True).data)


# ── POST  /api/queue/walk-in/ ─────────────────────────────────────────────────
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def queue_walk_in(request):
    """Add a walk-in customer straight to the active queue."""
    serializer = QueueEntryCreateSerializer(data=request.data)
    if serializer.is_valid():
        entry = serializer.save(source="walk_in", status="waiting")
        return Response(QueueEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ── POST  /api/queue/from-booking/ ───────────────────────────────────────────
# Kept for manual use, but auto-queue on approve is handled in bookings_views.py
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def queue_from_booking(request):
    """
    Manually promote a confirmed Booking into the queue.
    Payload: { "booking_id": <int> }
    """
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
    """
    Update the status of a queue entry.
    Payload: { "status": "in_service" | "done" | "skipped" | "waiting" }
    """
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    allowed = [s[0] for s in QueueEntry.STATUS_CHOICES]
    new_status = request.data.get("status")
    if new_status not in allowed:
        return Response(
            {"detail": f"Invalid status. Allowed: {allowed}"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    entry.status = new_status
    if new_status == "in_service" and not entry.service_started_at:
        entry.service_started_at = timezone.now()
    if new_status in ("done", "skipped"):
        entry.completed_at = timezone.now()
    entry.save()

    return Response(QueueEntrySerializer(entry).data)


# ── PATCH  /api/queue/<id>/assign/ ───────────────────────────────────────────
@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def queue_assign(request, pk):
    """
    Assign (or un-assign) an employee to a queue entry.
    Payload: { "employee_id": <int> | null }
    """
    try:
        entry = QueueEntry.objects.get(pk=pk)
    except QueueEntry.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = AssignEmployeeSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    employee_id = serializer.validated_data["employee_id"]

    if employee_id is None:
        entry.assigned_employee = None
    else:
        try:
            employee = Staff.objects.get(pk=employee_id, role="Employee")
        except Staff.DoesNotExist:
            return Response(
                {"detail": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        entry.assigned_employee = employee

    entry.save()
    return Response(QueueEntrySerializer(entry).data)


# ── GET  /api/queue/employees/ ────────────────────────────────────────────────
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def queue_employees(request):
    """
    Return all active Employee (Mechanic) staff members for the assign dropdown.
    """
    employees = Staff.objects.filter(role="Employee", status="Active").order_by(
        "first_name", "last_name"
    )
    data = [
        {
            "id": e.id,
            "full_name": f"{e.first_name} {e.last_name}".strip(),
            "branch": e.branch,
        }
        for e in employees
    ]
    return Response(data)


# ── DELETE  /api/queue/<id>/ ──────────────────────────────────────────────────
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
    """Last 50 completed or skipped entries."""
    entries = QueueEntry.objects.filter(
        status__in=["done", "skipped"]
    ).select_related("assigned_employee").order_by("-completed_at")[:50]
    return Response(QueueEntrySerializer(entries, many=True).data)