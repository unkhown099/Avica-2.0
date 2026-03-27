# api/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from ..models import Booking, BranchScheduleConfig, Customer, QueueEntry, Rating, Staff
from ..serializers.dashboard_serializer import DashboardStatsSerializer, RecentTransactionSerializer
from ..serializers.manager_schedule_serializer import ManagerScheduleConfigSerializer
from django.db.models import Avg, Count, Sum, Value, DecimalField
from django.utils import timezone
from django.db.models.functions import Coalesce
from collections import defaultdict
from datetime import timedelta

MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

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

def clean_price(value):
    """Strip currency symbols and commas, return float."""
    try:
        return float(str(value).replace("₱", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        current_year = now.year

        # ── Stats ────────────────────────────────────────────────────────────
        paid_revenue = float(
            QueueEntry.objects.filter(payment_status="paid").aggregate(
                t=Coalesce(
                    Sum("price"),
                    Value(0, output_field=DecimalField(max_digits=10, decimal_places=2)),
                )
            )["t"]
            or 0
        )
        total_revenue = paid_revenue
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
        paid_entries_this_year = QueueEntry.objects.filter(
            payment_status="paid",
            completed_at__year=current_year,
        )

        monthly_revenue = defaultdict(float)
        for q in paid_entries_this_year.only("price", "completed_at"):
            if not q.completed_at:
                continue
            month = q.completed_at.month
            monthly_revenue[month] += clean_price(q.price)

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

        # ── Analytics ─────────────────────────────────────────────────────────
        today = now.date()
        thirty_days_ago = now - timedelta(days=30)

        bookings_today = Booking.objects.filter(created_at__date=today).count()
        new_customers_30d = Customer.objects.filter(
            user__created_at__gte=thirty_days_ago
        ).count()

        total_queue_entries = QueueEntry.objects.count()
        done_queue_entries = QueueEntry.objects.filter(status="done").count()
        completion_rate = (
            round((done_queue_entries / total_queue_entries) * 100, 1)
            if total_queue_entries > 0
            else 0.0
        )

        paid_queue_entries = QueueEntry.objects.filter(payment_status="paid").count()
        payment_rate = (
            round((paid_queue_entries / total_queue_entries) * 100, 1)
            if total_queue_entries > 0
            else 0.0
        )

        service_counts = list(
            QueueEntry.objects.filter(
                status="done",
                completed_at__year=current_year,
                completed_at__month=now.month,
            )
            .values("service")
            .annotate(count=Count("id"))
            .order_by("-count")
        )
        total_service_count = sum(item["count"] for item in service_counts)
        service_distribution = [
            {
                "label": item["service"] or "Other",
                "count": item["count"],
                "pct": round(
                    (item["count"] / total_service_count) * 100, 1
                ) if total_service_count else 0.0,
            }
            for item in service_counts[:6]
        ]

        top_services_qs = (
            QueueEntry.objects.filter(status="done", payment_status="paid")
            .values("service")
            .annotate(
                count=Count("id"),
                revenue=Coalesce(
                    Sum("price"),
                    Value(0, output_field=DecimalField(max_digits=10, decimal_places=2)),
                ),
            )
            .order_by("-revenue", "-count")
        )
        top_services = [
            {
                "service": row["service"] or "Other",
                "count": row["count"],
                "revenue": round(float(row["revenue"] or 0), 2),
            }
            for row in top_services_qs[:6]
        ]

        revenue_by_branch_map = defaultdict(float)

        paid_branch_revenue = (
            QueueEntry.objects.filter(payment_status="paid")
            .values("branch__name", "branch_name")
            .annotate(
                revenue=Coalesce(
                    Sum("price"),
                    Value(0, output_field=DecimalField(max_digits=10, decimal_places=2)),
                )
            )
        )
        for row in paid_branch_revenue:
            branch_name = row["branch__name"] or row["branch_name"] or "Unassigned"
            revenue_by_branch_map[branch_name] += float(row["revenue"] or 0)

        revenue_by_branch = [
            {
                "branch": branch,
                "revenue": round(revenue, 2),
            }
            for branch, revenue in sorted(
                revenue_by_branch_map.items(), key=lambda item: item[1], reverse=True
            )[:8]
        ]

        # ── Recent Transactions ───────────────────────────────────────────────
        recent_transactions = []
        recent_paid_entries = QueueEntry.objects.filter(
            payment_status="paid",
        ).order_by("-completed_at", "-queued_at")[:5]
        for q in recent_paid_entries:
            recent_transactions.append(
                {
                    "customer_name": q.customer_name or "Walk-in Customer",
                    "service": q.service or "Walk-in Service",
                    "amount": clean_price(q.price),
                    "status": "paid",
                    "_ts": q.completed_at or q.queued_at,
                }
            )

        recent_transactions = sorted(
            recent_transactions,
            key=lambda tx: tx.get("_ts") or now,
            reverse=True,
        )[:5]

        recent_transactions = [
            {k: v for k, v in tx.items() if k != "_ts"} for tx in recent_transactions
        ]

        recent_transactions = RecentTransactionSerializer(recent_transactions, many=True).data

        return Response({
            "stats": stats,
            "recent_transactions": recent_transactions,
            "chart": {
                "labels": chart_labels,
                "revenue": chart_revenue,
                "services": chart_services,
            },
            "analytics": {
                "bookings_today": bookings_today,
                "new_customers_30d": new_customers_30d,
                "completion_rate": completion_rate,
                "payment_rate": payment_rate,
                "service_distribution": service_distribution,
                "top_services": top_services,
                "revenue_by_branch": revenue_by_branch,
            },
        })


class ManagerDashboardView(APIView):
    permission_classes = [IsAuthenticated] # Actually IsAuthenticated + check in get

    def get(self, request):
        try:
            staff = getattr(request.user, "staff_profile", None)
            if not staff or staff.role not in ["Admin", "Branch Manager"]:
                return Response({"detail": "Permission denied."}, status=403)
            
            branch = staff.branch
            if not branch:
                return Response({"detail": "No branch assigned to this manager profile."}, status=400)

            now = timezone.now()
            this_month = now.month
            this_year = now.year
            
            # Simple last month calculation
            last_month_date = now.replace(day=1) - timedelta(days=1)
            last_month = last_month_date.month
            last_month_year = last_month_date.year

            # Stats
            rev_this = QueueEntry.objects.filter(
                branch=branch,
                payment_status="paid",
                completed_at__month=this_month,
                completed_at__year=this_year,
            ).aggregate(t=Sum("price"))["t"] or 0
            rev_last = QueueEntry.objects.filter(
                branch=branch,
                payment_status="paid",
                completed_at__month=last_month,
                completed_at__year=last_month_year,
            ).aggregate(t=Sum("price"))["t"] or 0
            rev_change = round(((float(rev_this) - float(rev_last)) / float(rev_last)) * 100, 1) if rev_last else 0

            svc_this = Booking.objects.filter(branch=branch, status="done", date__month=this_month, date__year=this_year).count()
            svc_last = Booking.objects.filter(branch=branch, status="done", date__month=last_month, date__year=last_month_year).count()
            svc_change = round(((svc_this - svc_last) / svc_last) * 100, 1) if svc_last else 0

            cust_this = Booking.objects.filter(branch=branch, date__month=this_month, date__year=this_year).values("user").distinct().count()
            cust_last = Booking.objects.filter(branch=branch, date__month=last_month, date__year=last_month_year).values("user").distinct().count()
            cust_change = round(((cust_this - cust_last) / cust_last) * 100, 1) if cust_last else 0

            sat_this = Rating.objects.filter(booking__branch=branch, created_at__month=this_month, created_at__year=this_year).aggregate(a=Avg("score"))["a"] or 0
            sat_last = Rating.objects.filter(booking__branch=branch, created_at__month=last_month, created_at__year=last_month_year).aggregate(a=Avg("score"))["a"] or 0
            sat_pct = round((float(sat_this) / 5) * 100, 1) if sat_this else 0
            sat_prev = round((float(sat_last) / 5) * 100, 1) if sat_last else 0
            sat_change = round(sat_pct - sat_prev, 1)

            # Chart Data (Trend)
            trend = []
            for i in range(5, -1, -1):
                d = now.replace(day=1) - timedelta(days=i*30)
                m = d.month
                y = d.year
                qs = QueueEntry.objects.filter(
                    branch=branch,
                    payment_status="paid",
                    completed_at__month=m,
                    completed_at__year=y,
                )
                trend.append({
                    "label": MONTH_LABELS[m-1],
                    "revenue": float(qs.aggregate(t=Sum("price"))["t"] or 0),
                    "services": qs.count()
                })

            # Service Distribution
            service_counts = Booking.objects.filter(branch=branch, status="done", date__month=this_month, date__year=this_year).values("service").annotate(count=Count("id")).order_by("-count")
            total_svc = sum(s["count"] for s in service_counts)
            distribution = [
                {
                    "label": s["service"] or "Other",
                    "val": s["count"],
                    "pct": f"{round((s['count']/total_svc)*100)}%" if total_svc else "0%",
                    "color": ["#ef4444", "#a855f7", "#3b82f6", "#10b981", "#f59e0b"][idx % 5]
                }
                for idx, s in enumerate(service_counts[:5])
            ]

            return Response({
                "branch_name": branch.name,
                "stats": [
                    {"title": "Branch Revenue", "value": f"₱{float(rev_this):,.0f}", "change": f"{'+' if rev_change >= 0 else ''}{rev_change}% from last month"},
                    {"title": "Services Completed", "value": str(svc_this), "change": f"{'+' if svc_change >= 0 else ''}{svc_change}% from last month"},
                    {"title": "Active Customers", "value": str(cust_this), "change": f"{'+' if cust_change >= 0 else ''}{cust_change}% from last month"},
                    {"title": "Customer Satisfaction", "value": f"{sat_pct}%", "change": f"{'+' if sat_change >= 0 else ''}{sat_change}% from last month"},
                ],
                "trend": trend,
                "distribution": distribution
            })
        except Exception as e:
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)


class ManagerScheduleConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_staff_branch(self, request):
        staff = getattr(request.user, "staff_profile", None)
        if not staff or staff.role not in ["Admin", "Branch Manager"]:
            return None, None
        return staff, staff.branch

    def get(self, request):
        staff, branch = self._get_staff_branch(request)
        if not staff:
            return Response({"detail": "Permission denied."}, status=403)
        if not branch:
            return Response({"detail": "No branch assigned to this manager profile."}, status=400)

        schedule_obj, _ = BranchScheduleConfig.objects.get_or_create(
            branch=branch,
            defaults={"config": default_manager_schedule_config()},
        )

        config = merge_manager_schedule_config(schedule_obj.config)
        return Response(
            {
                "branch_id": branch.id,
                "branch_name": branch.name,
                "config": config,
            }
        )

    def put(self, request):
        staff, branch = self._get_staff_branch(request)
        if not staff:
            return Response({"detail": "Permission denied."}, status=403)
        if not branch:
            return Response({"detail": "No branch assigned to this manager profile."}, status=400)

        serializer = ManagerScheduleConfigSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        config = merge_manager_schedule_config(serializer.validated_data["config"])

        schedule_obj, _ = BranchScheduleConfig.objects.get_or_create(branch=branch)
        schedule_obj.config = config
        schedule_obj.save(update_fields=["config", "updated_at"])

        return Response(
            {
                "detail": "Schedule configuration saved.",
                "branch_id": branch.id,
                "branch_name": branch.name,
                "config": config,
            }
        )
