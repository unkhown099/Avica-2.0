# api/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from ..models import Booking, Customer, QueueEntry, Rating
from ..serializers.dashboard_serializer import DashboardStatsSerializer, RecentTransactionSerializer
from django.db.models import Avg, Count
from django.utils import timezone
from collections import defaultdict

MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

def clean_price(value):
    """Strip currency symbols and commas, return float."""
    try:
        return float(str(value).replace("₱", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        current_year = timezone.now().year

        # ── Stats ────────────────────────────────────────────────────────────
        total_revenue = sum(
            clean_price(b.price) for b in Booking.objects.only("price")
        )
        total_customers = Customer.objects.count()
        services_completed = QueueEntry.objects.filter(status="done").count()
        try:
            avg_satisfaction = Rating.objects.aggregate(Avg("score"))["score__avg"] or 0
        except Exception:
            avg_satisfaction = 0

        stats = DashboardStatsSerializer({
            "total_revenue": total_revenue,
            "total_customers": total_customers,
            "services_completed": services_completed,
            "avg_satisfaction": avg_satisfaction,
        }).data

        # ── Monthly Chart Data (current year) ────────────────────────────────
        bookings_this_year = Booking.objects.filter(created_at__year=current_year)

        monthly_revenue = defaultdict(float)
        for b in bookings_this_year.only("price", "created_at"):
            month = b.created_at.month  # 1–12
            monthly_revenue[month] += clean_price(b.price)

        monthly_services = defaultdict(int)
        queue_this_year = QueueEntry.objects.filter(
            status="done", completed_at__year=current_year
        ).values("completed_at__month").annotate(count=Count("id"))
        for row in queue_this_year:
            monthly_services[row["completed_at__month"]] = row["count"]

        # Build ordered lists for all 12 months
        current_month = timezone.now().month
        chart_labels   = MONTH_LABELS[:current_month]
        chart_revenue  = [round(monthly_revenue.get(m, 0), 2) for m in range(1, current_month + 1)]
        chart_services = [monthly_services.get(m, 0) for m in range(1, current_month + 1)]

        # ── Recent Transactions ───────────────────────────────────────────────
        recent_bookings = Booking.objects.select_related(
            "user", "user__customer_profile", "user__staff_profile"
        ).order_by("-created_at")[:5]

        recent_transactions = []
        for b in recent_bookings:
            try:
                p = b.user.customer_profile
                name = f"{p.first_name} {p.last_name}".strip()
            except Exception:
                try:
                    p = b.user.staff_profile
                    name = f"{p.first_name} {p.last_name}".strip()
                except Exception:
                    name = b.user.email

            recent_transactions.append({
                "customer_name": name,
                "service": b.service,
                "amount": clean_price(b.price),
                "status": b.status,
            })

        recent_transactions = RecentTransactionSerializer(recent_transactions, many=True).data

        return Response({
            "stats": stats,
            "recent_transactions": recent_transactions,
            "chart": {
                "labels": chart_labels,
                "revenue": chart_revenue,
                "services": chart_services,
            }
        })