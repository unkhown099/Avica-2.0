from rest_framework import serializers
from ..models import Booking, Staff
import decimal
import re


PREFERRED_EMPLOYEE_PATTERN = re.compile(r"\[preferred_employee_id=(\d+)\]", re.IGNORECASE)


def _extract_preferred_employee_id(notes):
    raw_notes = notes or ""
    match = PREFERRED_EMPLOYEE_PATTERN.search(raw_notes)
    if not match:
        return None
    try:
        return int(match.group(1))
    except (TypeError, ValueError):
        return None


def _strip_preferred_employee_marker(notes):
    raw_notes = notes or ""
    cleaned = PREFERRED_EMPLOYEE_PATTERN.sub("", raw_notes)
    return re.sub(r"\n{3,}", "\n\n", cleaned).strip()


class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    branch_name   = serializers.CharField(source="branch.name", read_only=True)
    price         = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = [
            "id", "customer_name", "service", "vehicle", "plate_number",
            "date", "time", "status", "staff", "notes",
            "branch", "branch_name", "price", "created_at",
        ]

    def get_customer_name(self, obj):
        try:
            p = obj.user.customer_profile
            return f"{p.first_name} {p.last_name}".strip()
        except Exception:
            return obj.user.email

    def get_price(self, obj):
        try:
            return float(str(obj.price).replace("₱", "").replace(",", "").strip())
        except Exception:
            return 0.0

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and getattr(queue_entry, "assigned_employee", None):
            full_name = f"{queue_entry.assigned_employee.first_name} {queue_entry.assigned_employee.last_name}".strip()
            rep["staff"] = full_name or rep.get("staff")
        elif rep.get("staff") in ("", None, "TBA"):
            preferred_employee_id = _extract_preferred_employee_id(instance.notes)
            if preferred_employee_id:
                preferred_employee = Staff.objects.filter(pk=preferred_employee_id, role="Employee").first()
                if preferred_employee:
                    rep["staff"] = (
                        f"{preferred_employee.first_name} {preferred_employee.last_name}".strip()
                        or ""
                    )
                else:
                    rep["staff"] = ""
            if rep.get("staff") in ("", None, "TBA"):
                rep["staff"] = ""
        elif rep.get("staff") in ("", None, "TBA"):
            rep["staff"] = ""
        rep["notes"] = _strip_preferred_employee_marker(instance.notes)
        return rep
