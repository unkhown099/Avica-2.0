# api/serializers/branch_serializer.py
from django.db.models import Avg, Sum
from django.utils import timezone
from rest_framework import serializers
from api.models import Branch, Staff, Booking, QueueEntry, Rating


def clean_price(value):
    try:
        return float(str(value).replace("₱", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


class BranchSerializer(serializers.ModelSerializer):
    manager_name       = serializers.SerializerMethodField()
    staff_count        = serializers.SerializerMethodField()
    employee_count     = serializers.SerializerMethodField()
    services_completed = serializers.SerializerMethodField()
    monthly_revenue    = serializers.SerializerMethodField()
    bay_utilization    = serializers.SerializerMethodField()
    satisfaction       = serializers.SerializerMethodField()

    class Meta:
        model  = Branch
        fields = [
            "id",
            "name",
            "address",
            "hours",
            "phone",
            "fb_url",
            "latitude",
            "longitude",
            "slots",
            "is_active",
            "manager_name",
            "staff_count",
            "employee_count",
            "services_completed",
            "monthly_revenue",
            "bay_utilization",
            "satisfaction",
        ]

    def get_manager_name(self, branch):
        manager = Staff.objects.filter(branch=branch, role="Branch Manager").first()
        if manager:
            return f"{manager.first_name} {manager.last_name}".strip()
        return "Unassigned"

    def get_staff_count(self, branch):
        return Staff.objects.filter(branch=branch, role="Staff").count()

    def get_employee_count(self, branch):
        return Staff.objects.filter(branch=branch, role="Employee").count()

    def get_services_completed(self, branch):
        return QueueEntry.objects.filter(branch=branch, status="done").count()

    def get_monthly_revenue(self, branch):
        now = timezone.now()
        bookings = Booking.objects.filter(
            branch=branch,
            created_at__year=now.year,
            created_at__month=now.month,
        )
        total = sum(clean_price(b.price) for b in bookings)
        return f"₱{total:,.0f}" if total > 0 else "—"

    def get_bay_utilization(self, branch):
        if not branch.slots:
            return 0
        active = QueueEntry.objects.filter(
            branch=branch,
            status__in=["waiting", "in_service"],
        ).count()
        pct = int((active / branch.slots) * 100)
        return min(pct, 100)

    def get_satisfaction(self, branch):
        result = Rating.objects.filter(branch=branch).aggregate(avg=Avg("score"))
        avg = result["avg"]
        if avg is None:
            return None
        pct = round(((avg - 1) / 4) * 100)
        return pct