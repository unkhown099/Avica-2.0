# api/serializers/business_owner_serializers.py
from rest_framework import serializers
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import timedelta
from ..models import Branch, Booking, Service, InventoryItem, Staff, Rating


class BranchSummarySerializer(serializers.ModelSerializer):
    """Full branch card data including aggregated stats."""
    manager_name      = serializers.SerializerMethodField()
    staff_count       = serializers.SerializerMethodField()
    mechanic_count    = serializers.SerializerMethodField()
    services_completed = serializers.SerializerMethodField()
    monthly_revenue   = serializers.SerializerMethodField()
    satisfaction_pct  = serializers.SerializerMethodField()
    bay_utilization   = serializers.SerializerMethodField()

    class Meta:
        model  = Branch
        fields = [
            "id", "name", "address", "hours", "slots", "is_active",
            "manager_name", "staff_count", "mechanic_count",
            "services_completed", "monthly_revenue",
            "satisfaction_pct", "bay_utilization",
        ]

    def _month_start(self):
        today = timezone.now().date()
        return today.replace(day=1)

    def get_manager_name(self, obj):
        mgr = obj.staff_members.filter(role="Branch Manager").first()
        if mgr:
            return f"{mgr.first_name} {mgr.last_name}".strip()
        return "Unassigned"

    def get_staff_count(self, obj):
        return obj.staff_members.count()

    def get_mechanic_count(self, obj):
        return obj.staff_members.filter(role="Employee").count()

    def get_services_completed(self, obj):
        return Booking.objects.filter(
            branch=obj,
            status="done",
            date__gte=self._month_start(),
        ).count()

    def get_monthly_revenue(self, obj):
        result = Booking.objects.filter(
            branch=obj,
            status="done",
            date__gte=self._month_start(),
        ).aggregate(total=Sum("price"))
        return float(result["total"] or 0)

    def get_satisfaction_pct(self, obj):
        result = Rating.objects.filter(branch=obj).aggregate(avg=Avg("score"))
        avg = result["avg"]
        if avg is None:
            return None
        # Convert 1-5 star avg to percentage
        return round((avg / 5) * 100)

    def get_bay_utilization(self, obj):
        """Approximate: bookings today vs total slots."""
        if not obj.slots:
            return 0
        today_count = Booking.objects.filter(
            branch=obj,
            date=timezone.now().date(),
            status__in=["confirmed", "done"],
        ).count()
        return min(round((today_count / obj.slots) * 100), 100)


class DashboardStatsSerializer(serializers.Serializer):
    """Aggregated numbers for the owner dashboard header cards."""
    total_revenue      = serializers.FloatField()
    revenue_change_pct = serializers.FloatField()
    total_branches     = serializers.IntegerField()
    services_completed = serializers.IntegerField()
    services_change_pct = serializers.FloatField()
    avg_satisfaction   = serializers.FloatField(allow_null=True)
    satisfaction_change_pct = serializers.FloatField(allow_null=True)


class RevenueDataPointSerializer(serializers.Serializer):
    label    = serializers.CharField()
    revenue  = serializers.FloatField()
    services = serializers.IntegerField()


class OwnerAppointmentSerializer(serializers.ModelSerializer):
    branch_name   = serializers.CharField(source="branch.name", read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = [
            "id", "service", "price", "date", "time",
            "vehicle", "plate_number", "notes", "status",
            "staff", "created_at", "branch_name",
            "customer_name", "customer_email",
        ]

    def get_customer_name(self, obj):
        try:
            p = obj.user.customer_profile
            return f"{p.first_name} {p.last_name}".strip()
        except Exception:
            return obj.user.email

    def get_customer_email(self, obj):
        return obj.user.email


class OwnerServiceSerializer(serializers.ModelSerializer):
    branch_names = serializers.SerializerMethodField()
    price_range  = serializers.SerializerMethodField()

    class Meta:
        model  = Service
        fields = [
            "id", "name", "category", "description",
            "duration", "price_min", "price_max",
            "price_range", "is_active", "branch_names",
        ]

    def get_branch_names(self, obj):
        return list(obj.branches.values_list("name", flat=True))

    def get_price_range(self, obj):
        lo = int(obj.price_min)
        hi = int(obj.price_max)
        if lo == hi:
            return f"₱{lo:,}"
        return f"₱{lo:,} – ₱{hi:,}"


class OwnerInventorySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True, default="Central")
    status      = serializers.ReadOnlyField()

    class Meta:
        model  = InventoryItem
        fields = [
            "id", "name", "category", "sku", "quantity",
            "minimum_qty", "unit", "price", "supplier",
            "branch_name", "status", "is_active",
        ]

class OwnerStaffSerializer(serializers.ModelSerializer):
    """Staff list serializer for business owner."""
    full_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source="branch.name", read_only=True, default="Unassigned")
    # Remove the source='status' since it's the same as the field name
    status = serializers.CharField(read_only=True)  # Just use the field directly
    created_at = serializers.DateTimeField(source="user.created_at", read_only=True)

    class Meta:
        model = Staff
        fields = [
            "id", "first_name", "last_name", "full_name", "email", "phone",
            "role", "branch_name", "status", "created_at"
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() if obj.first_name or obj.last_name else "Unknown"

    def get_email(self, obj):
        # Get email from the related user
        if obj.user:
            return obj.user.email
        return None