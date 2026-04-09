import re
from decimal import Decimal

from rest_framework import serializers
from ..models import Branch, Booking, Staff


PREFERRED_EMPLOYEE_PATTERN = re.compile(r"\[preferred_employee_id=(\d+)\]", re.IGNORECASE)
PRODUCTS_ADDED_PATTERN = re.compile(r"^\[Products Added\]\s*(.+?)(?:\s*\(\+.*\))?$", re.IGNORECASE)
PRODUCT_ENTRY_PATTERN = re.compile(r"^(?P<name>.+?)\s*x(?P<qty>\d+)$", re.IGNORECASE)


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
    # Keep user-facing notes clean after marker removal.
    return re.sub(r"\n{3,}", "\n\n", cleaned).strip()


def _inject_preferred_employee_marker(notes, employee_id):
    cleaned_notes = _strip_preferred_employee_marker(notes)
    marker = f"[preferred_employee_id={employee_id}]"
    return f"{cleaned_notes}\n{marker}".strip() if cleaned_notes else marker


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Branch
        fields = ["id", "name", "address", "hours", "slots"]


class BookingSerializer(serializers.ModelSerializer):
    branch_detail = BranchSerializer(source="branch", read_only=True)
    branch_id = serializers.PrimaryKeyRelatedField(
        queryset=Branch.objects.filter(is_active=True),
        source="branch",
        write_only=True,
        required=False,
    )

    # CharField — expose service name directly (service field IS the name)
    service_name = serializers.CharField(source="service", read_only=True)

    # Read price as float for clean JSON output
    # NOT in read_only_fields so the frontend-sent price value is saved to DB
    price = serializers.SerializerMethodField()

    # Writable price field — accepts the incoming price from the frontend
    price_input = serializers.DecimalField(
        max_digits=10, decimal_places=2,
        write_only=True, required=False, source="price"
    )

    assigned_employee_id = serializers.SerializerMethodField()
    assigned_employee_name = serializers.SerializerMethodField()
    queue_id = serializers.SerializerMethodField()
    preferred_employee_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    preferred_employee_name = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    used_products = serializers.SerializerMethodField()
    receipt_total = serializers.SerializerMethodField()
    receipt_number = serializers.SerializerMethodField()
    payment_method = serializers.SerializerMethodField()
    completed_at = serializers.SerializerMethodField()
    # 👈 ADD THIS FIELD - make it writeable so frontend can send cancellation reason
    cancellation_reason = serializers.CharField(
        required=False, 
        allow_blank=True, 
        allow_null=True,
        write_only=False  # This makes it readable and writable
    )

    class Meta:
        model  = Booking
        fields = [
            "id", "service", "service_name",
            "price", "price_input",
            "branch_id", "branch_detail",
            "date", "time", "vehicle", "plate_number",
            "notes", "status", "staff",
            "reschedule_status",
            "reschedule_previous_status",
            "reschedule_options",
            "reschedule_selected_option",
            "reschedule_note",
            "reschedule_request_reason",
            "customer_name",
            "used_products", "receipt_total", "receipt_number", "payment_method", "completed_at",
            "assigned_employee_id", "assigned_employee_name", "queue_id",
            "preferred_employee_id", "preferred_employee_name",
            "created_at",
            "notes", "status", "staff", "created_at",
            "cancellation_reason",  # 👈 ADD THIS
        ]
        read_only_fields = ["id", "service_name", "staff", "created_at"]

    def get_assigned_employee_id(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.assigned_employee_id:
            return queue_entry.assigned_employee_id
        return None

    def get_queue_id(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry:
            return queue_entry.id
        return None

    def get_assigned_employee_name(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.assigned_employee:
            return f"{queue_entry.assigned_employee.first_name} {queue_entry.assigned_employee.last_name}".strip()
        if instance.staff and instance.staff != "TBA":
            return instance.staff
        return ""

    def get_customer_name(self, instance):
        profile = getattr(instance.user, "customer_profile", None)
        if profile:
            full_name = f"{profile.first_name} {profile.last_name}".strip()
            if full_name:
                return full_name

        notes = (instance.notes or "").strip()
        if notes.lower().startswith("[walk-in]"):
            walkin_payload = notes[len("[walk-in]"):].strip()
            name_part = walkin_payload.split("|")[0].strip()
            if name_part:
                return name_part

        return "Unknown Customer"

    def get_used_products(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        notes = (getattr(queue_entry, "notes", "") or "").splitlines()

        merged = {}
        order = []
        for raw_line in notes:
            line = (raw_line or "").strip()
            if not line:
                continue
            match = PRODUCTS_ADDED_PATTERN.match(line)
            if not match:
                continue

            product_blob = match.group(1) or ""
            entries = [chunk.strip() for chunk in product_blob.split(",") if chunk.strip()]
            for entry in entries:
                parsed = PRODUCT_ENTRY_PATTERN.match(entry)
                if not parsed:
                    continue
                name = parsed.group("name").strip()
                qty = int(parsed.group("qty"))
                if name not in merged:
                    merged[name] = 0
                    order.append(name)
                merged[name] += qty

        return [{"name": name, "quantity": merged[name]} for name in order]

    def get_receipt_total(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.price is not None:
            try:
                return float(queue_entry.price)
            except (TypeError, ValueError):
                pass

        try:
            return float(Decimal(str(instance.price or 0)))
        except (TypeError, ValueError):
            return 0.0

    def get_receipt_number(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.id:
            return f"Q-{str(queue_entry.id).zfill(6)}"
        return f"B-{str(instance.id).zfill(6)}"

    def get_payment_method(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.payment_method:
            return queue_entry.payment_method
        return ""

    def get_completed_at(self, instance):
        queue_entry = getattr(instance, "queue_entry", None)
        if queue_entry and queue_entry.completed_at:
            return queue_entry.completed_at
        return None

    def get_preferred_employee_name(self, instance):
        preferred_id = _extract_preferred_employee_id(instance.notes)
        if not preferred_id:
            return ""

        try:
            employee = Staff.objects.get(pk=preferred_id, role="Employee")
        except Staff.DoesNotExist:
            return ""

        return f"{employee.first_name} {employee.last_name}".strip()

    def get_price(self, instance):
        try:
            return float(
                str(instance.price).replace("₱", "").replace(",", "").strip()
            )
        except (ValueError, TypeError):
            return 0.0

    def validate(self, attrs):
        if not attrs.get("branch"):
            raise serializers.ValidationError({"branch_id": "A valid branch is required."})

        preferred_employee_id = attrs.get("preferred_employee_id", serializers.empty)
        if preferred_employee_id is not serializers.empty and preferred_employee_id is not None:
            branch = attrs.get("branch")
            try:
                employee = Staff.objects.get(pk=preferred_employee_id, role="Employee", status="Active")
            except Staff.DoesNotExist:
                raise serializers.ValidationError({"preferred_employee_id": "Selected employee is not available."})

            if branch and employee.branch_id != branch.id:
                raise serializers.ValidationError(
                    {"preferred_employee_id": "Selected employee must belong to the selected branch."}
                )

        return attrs

    def create(self, validated_data):
        preferred_employee_id = validated_data.pop("preferred_employee_id", serializers.empty)
        notes = validated_data.get("notes", "")

        if preferred_employee_id is serializers.empty:
            validated_data["notes"] = _strip_preferred_employee_marker(notes)
            return super().create(validated_data)

        if preferred_employee_id is None:
            validated_data["notes"] = _strip_preferred_employee_marker(notes)
            validated_data["staff"] = "TBA"
            return super().create(validated_data)

        employee = Staff.objects.get(pk=preferred_employee_id, role="Employee", status="Active")
        validated_data["notes"] = _inject_preferred_employee_marker(notes, preferred_employee_id)
        validated_data["staff"] = f"{employee.first_name} {employee.last_name}".strip() or "TBA"
        return super().create(validated_data)

    def update(self, instance, validated_data):
        preferred_employee_id = validated_data.pop("preferred_employee_id", serializers.empty)
        notes = validated_data.get("notes", instance.notes)

        if preferred_employee_id is serializers.empty:
            validated_data["notes"] = _strip_preferred_employee_marker(notes)
            return super().update(instance, validated_data)

        if preferred_employee_id is None:
            validated_data["notes"] = _strip_preferred_employee_marker(notes)
            validated_data["staff"] = "TBA"
            return super().update(instance, validated_data)

        employee = Staff.objects.get(pk=preferred_employee_id, role="Employee", status="Active")
        validated_data["notes"] = _inject_preferred_employee_marker(notes, preferred_employee_id)
        validated_data["staff"] = f"{employee.first_name} {employee.last_name}".strip() or "TBA"
        return super().update(instance, validated_data)

    def to_internal_value(self, data):
        data = data.copy()
        branch_val = data.get("branch")
        if branch_val and isinstance(branch_val, str) and not branch_val.isdigit():
            data.pop("branch")
            try:
                branch = Branch.objects.get(name=branch_val, is_active=True)
                data["branch_id"] = branch.pk
            except Branch.DoesNotExist:
                raise serializers.ValidationError(
                    {"branch": f"Branch '{branch_val}' not found or is inactive."}
                )

        # Map frontend "price" key → "price_input" so our write field picks it up
        if "price" in data and "price_input" not in data:
            data["price_input"] = data["price"]

        return super().to_internal_value(data)

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["branch"] = instance.branch.name if instance.branch else ""
        rep["notes"] = _strip_preferred_employee_marker(instance.notes)
        # Remove the write-only field from output (already excluded, just safety)
        rep.pop("price_input", None)
        return rep
class AvailableSlotsSerializer(serializers.Serializer):
    """Serializer for available time slots response"""
    available_slots = serializers.DictField(
        child=serializers.BooleanField(),
        help_text="Dictionary of time slots with availability status (true = available, false = unavailable)"
    )
