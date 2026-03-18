# api/serializers/branch_serializer.py
from django.db.models import Avg, Count, Sum
from rest_framework import serializers
from api.models import Branch, Staff, Booking, QueueEntry, Rating


class BranchSerializer(serializers.ModelSerializer):
    manager_name       = serializers.SerializerMethodField()
    staff_count        = serializers.SerializerMethodField()
    mechanic_count     = serializers.SerializerMethodField()
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
            "slots",
            "is_active",
            "manager_name",
            "staff_count",
            "mechanic_count",
            "services_completed",
            "monthly_revenue",
            "bay_utilization",
            "satisfaction",
        ]

    def get_manager_name(self, branch):
        manager = (
            Staff.objects
            .filter(branch=branch, role="Branch Manager")
            .first()
        )
        if manager:
            return f"{manager.first_name} {manager.last_name}".strip()
        return "Unassigned"

    def get_staff_count(self, branch):
        return Staff.objects.filter(branch=branch).count()

    def get_mechanic_count(self, branch):
        return Staff.objects.filter(branch=branch, role="Employee").count()

    def get_services_completed(self, branch):
        return Booking.objects.filter(branch=branch, status="confirmed").count()

    def get_monthly_revenue(self, branch):
        result = (
            Booking.objects
            .filter(branch=branch, status="confirmed")
            .aggregate(total=Sum("price"))
        )
        total = result["total"] or 0
        if total == 0:
            return "—"
        return f"₱{total:,.0f}"

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
        # Average rating score (1–5), converted to percentage (out of 100)
        result = Rating.objects.filter(branch=branch).aggregate(avg=Avg("score"))
        avg = result["avg"]
        if avg is None:
            return None   # frontend shows "—"
        # Convert 1–5 scale to 0–100%
        pct = round(((avg - 1) / 4) * 100)
        return pct