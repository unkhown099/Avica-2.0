# api/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Booking, Branch, BranchScheduleConfig, Customer, Notification, QueueEntry, Rating, Staff
from ..serializers.dashboard_serializer import DashboardStatsSerializer, RecentTransactionSerializer
from ..serializers.manager_schedule_serializer import ManagerScheduleConfigSerializer
from django.db.models import Avg, Count, Sum, Value, DecimalField
from django.utils import timezone
from django.db.models import Q
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = getattr(request.user, "staff_profile", None)
        if not requester_staff:
            return Response({"detail": "Staff access required."}, status=403)

        allowed_roles = {"Admin", "Business Owner", "super_admin", "Branch Manager"}
        if requester_staff.role not in allowed_roles:
            return Response({"detail": "Permission denied."}, status=403)

        now = timezone.now()
        current_year = now.year
        branch_id_raw = request.query_params.get("branch_id")
        selected_branch = None
        branch_scope = "all"

        if requester_staff.role == "Branch Manager":
            if not requester_staff.branch_id:
                return Response({"detail": "No branch assigned to this manager profile."}, status=400)
            selected_branch = requester_staff.branch
            branch_scope = "single_branch"
        elif branch_id_raw not in [None, ""]:
            try:
                selected_branch = Branch.objects.get(pk=int(branch_id_raw))
            except (ValueError, Branch.DoesNotExist):
                return Response({"detail": "Invalid branch_id."}, status=400)
            branch_scope = "single_branch"

        queue_scope = QueueEntry.objects.all()
        booking_scope = Booking.objects.all()
        rating_scope = Rating.objects.all()
        customer_scope = Customer.objects.all()

        if selected_branch:
            queue_scope = queue_scope.filter(
                Q(branch_id=selected_branch.id) |
                Q(branch__isnull=True, branch_name=selected_branch.name)
            )
            booking_scope = booking_scope.filter(branch_id=selected_branch.id)
            rating_scope = rating_scope.filter(booking__branch_id=selected_branch.id)
            customer_scope = customer_scope.filter(user__bookings__branch_id=selected_branch.id).distinct()

        # ── Stats ────────────────────────────────────────────────────────────
        paid_revenue = float(
            queue_scope.filter(payment_status="paid").aggregate(
                t=Coalesce(
                    Sum("price"),
                    Value(0, output_field=DecimalField(max_digits=10, decimal_places=2)),
                )
            )["t"]
            or 0
        )
        total_revenue = paid_revenue
        total_customers = customer_scope.count()
        services_completed = queue_scope.filter(status="done").count()
        try:
            avg_satisfaction = rating_scope.aggregate(Avg("score"))["score__avg"] or 0
        except Exception:
            avg_satisfaction = 0

        stats = DashboardStatsSerializer({
            "total_revenue": total_revenue,
            "total_customers": total_customers,
            "services_completed": services_completed,
            "avg_satisfaction": avg_satisfaction,
        }).data

        # ── Monthly Chart Data (current year) ────────────────────────────────
        paid_entries_this_year = queue_scope.filter(
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
        queue_this_year = queue_scope.filter(
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

        bookings_today = booking_scope.filter(created_at__date=today).count()
        new_customers_30d = customer_scope.filter(user__created_at__gte=thirty_days_ago).count()

        total_queue_entries = queue_scope.count()
        done_queue_entries = queue_scope.filter(status="done").count()
        completion_rate = (
            round((done_queue_entries / total_queue_entries) * 100, 1)
            if total_queue_entries > 0
            else 0.0
        )

        paid_queue_entries = queue_scope.filter(payment_status="paid").count()
        payment_rate = (
            round((paid_queue_entries / total_queue_entries) * 100, 1)
            if total_queue_entries > 0
            else 0.0
        )

        service_counts = list(
            queue_scope.filter(
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
            queue_scope.filter(status="done", payment_status="paid")
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
            queue_scope.filter(payment_status="paid")
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

        branch_daily_demand_map = defaultdict(lambda: defaultdict(int))
        for entry in queue_scope.select_related("branch").all():
            branch_name = entry.branch.name if entry.branch else entry.branch_name or "Unassigned"
            base_dt = entry.completed_at or entry.queued_at
            if not base_dt:
                continue
            branch_daily_demand_map[branch_name][base_dt.date().isoformat()] += 1

        all_branch_day_labels = sorted(
            {label for branch_map in branch_daily_demand_map.values() for label in branch_map.keys()}
        )
        branch_demand_time_series = []
        for label in all_branch_day_labels:
            point = {"label": label}
            for branch_name in sorted(branch_daily_demand_map.keys()):
                point[branch_name] = branch_daily_demand_map[branch_name].get(label, 0)
            branch_demand_time_series.append(point)

        branch_forecasts = []
        for branch_name, daily_map in branch_daily_demand_map.items():
            labels = sorted(daily_map.keys())
            values = [daily_map[label] for label in labels]
            n = len(values)
            if n > 0:
                x_vals = list(range(n))
                x_sum = sum(x_vals)
                y_sum = sum(values)
                x2_sum = sum(x * x for x in x_vals)
                xy_sum = sum(x * y for x, y in zip(x_vals, values))
                denominator = (n * x2_sum) - (x_sum * x_sum)
                slope = ((n * xy_sum) - (x_sum * y_sum)) / denominator if denominator else 0
                intercept = (y_sum - slope * x_sum) / n if n else 0
                next_value = max(0, round((slope * n) + intercept, 2))
            else:
                slope = 0
                next_value = 0

            trend = "increasing" if slope > 0.2 else "decreasing" if slope < -0.2 else "stable"
            total_demand = sum(values)
            branch_forecasts.append({
                "branch": branch_name,
                "total_demand": total_demand,
                "slope": round(slope, 4),
                "predicted_next_demand": next_value,
                "trend": trend,
            })

        branch_forecasts.sort(
            key=lambda row: (row["predicted_next_demand"], row["total_demand"]),
            reverse=True,
        )
        highest_demand_branch = branch_forecasts[0] if branch_forecasts else None

        employee_workload = defaultdict(lambda: {
            "employee_id": None,
            "employee_name": "Unassigned",
            "branch": "Unknown Branch",
            "total": 0,
            "completed": 0,
            "skipped": 0,
        })

        employee_daily_demand_map = defaultdict(lambda: defaultdict(int))
        for entry in queue_scope.select_related("assigned_employee", "branch").all():
            if entry.assigned_employee:
                employee_name = f"{entry.assigned_employee.first_name} {entry.assigned_employee.last_name}".strip()
                employee_id = entry.assigned_employee.id
                branch_name = (
                    entry.branch.name
                    if entry.branch
                    else entry.assigned_employee.branch.name if entry.assigned_employee.branch else entry.assigned_employee.branch_name or "Unknown Branch"
                )
            else:
                employee_name = "Unassigned"
                employee_id = None
                branch_name = entry.branch.name if entry.branch else entry.branch_name or "Unknown Branch"

            workload = employee_workload[employee_name]
            workload["employee_id"] = employee_id
            workload["employee_name"] = employee_name
            workload["branch"] = branch_name
            workload["total"] += 1
            if entry.status == "done":
                workload["completed"] += 1
            if entry.status == "skipped":
                workload["skipped"] += 1

            base_dt = entry.completed_at or entry.queued_at
            if base_dt:
                employee_daily_demand_map[employee_name][base_dt.date().isoformat()] += 1

        employee_workload_rows = sorted(
            employee_workload.values(),
            key=lambda row: (row["total"], row["completed"]),
            reverse=True,
        )
        highest_demand_employee = employee_workload_rows[0] if employee_workload_rows else None

        rating_rows = (
            rating_scope.select_related("booking__queue_entry__assigned_employee")
            .exclude(booking__queue_entry__assigned_employee__isnull=True)
            .values(
                "booking__queue_entry__assigned_employee_id",
                "booking__queue_entry__assigned_employee__first_name",
                "booking__queue_entry__assigned_employee__last_name",
            )
            .annotate(avg_rating=Avg("score"), total_ratings=Count("id"))
            .order_by("-avg_rating", "-total_ratings")
        )
        employee_ratings = [
            {
                "employee_id": row["booking__queue_entry__assigned_employee_id"],
                "employee_name": (
                    f"{row['booking__queue_entry__assigned_employee__first_name']} "
                    f"{row['booking__queue_entry__assigned_employee__last_name']}"
                ).strip(),
                "avg_rating": round(float(row["avg_rating"] or 0), 2),
                "total_ratings": row["total_ratings"],
            }
            for row in rating_rows
        ]
        highest_rated_employee = employee_ratings[0] if employee_ratings else None

        employee_forecast_rows = []
        for row in employee_workload_rows:
            employee_name = row["employee_name"]
            daily = employee_daily_demand_map.get(employee_name, {})
            labels = sorted(daily.keys())
            values = [daily[label] for label in labels]
            n = len(values)
            if n > 0:
                x_vals = list(range(n))
                x_sum = sum(x_vals)
                y_sum = sum(values)
                x2_sum = sum(x * x for x in x_vals)
                xy_sum = sum(x * y for x, y in zip(x_vals, values))
                denominator = (n * x2_sum) - (x_sum * x_sum)
                slope = ((n * xy_sum) - (x_sum * y_sum)) / denominator if denominator else 0
                intercept = (y_sum - slope * x_sum) / n if n else 0
                next_value = max(0, round((slope * n) + intercept, 2))
            else:
                slope = 0
                next_value = 0

            trend = "increasing" if slope > 0.2 else "decreasing" if slope < -0.2 else "stable"
            employee_forecast_rows.append({
                "employee_id": row["employee_id"],
                "employee_name": employee_name,
                "slope": round(slope, 4),
                "predicted_next_jobs": next_value,
                "trend": trend,
                "total_jobs": row["total"],
            })

        employee_forecast_rows.sort(
            key=lambda row: (row["predicted_next_jobs"], row["total_jobs"]),
            reverse=True,
        )
        employee_forecast_leader = employee_forecast_rows[0] if employee_forecast_rows else None

        moving_average_points = []
        for idx, label in enumerate(chart_labels):
            start_idx = max(0, idx - 2)
            window = chart_revenue[start_idx:idx + 1]
            moving_average_points.append(
                {
                    "label": label,
                    "revenue": round(float(chart_revenue[idx]), 2),
                    "moving_avg_3": round(sum(window) / len(window), 2) if window else 0,
                }
            )

        yearly_rows = (
            queue_scope.filter(payment_status="paid", completed_at__isnull=False)
            .values("completed_at__year")
            .annotate(
                revenue=Coalesce(
                    Sum("price"),
                    Value(0, output_field=DecimalField(max_digits=10, decimal_places=2)),
                )
            )
            .order_by("completed_at__year")
        )
        yearly_revenue = [
            {"year": row["completed_at__year"], "revenue": float(row["revenue"] or 0)}
            for row in yearly_rows
            if row["completed_at__year"] is not None
        ]

        cagr_percent = 0.0
        if len(yearly_revenue) >= 2:
            first = yearly_revenue[0]
            last = yearly_revenue[-1]
            year_span = int(last["year"]) - int(first["year"])
            if first["revenue"] > 0 and year_span > 0:
                cagr_percent = round((((last["revenue"] / first["revenue"]) ** (1 / year_span)) - 1) * 100, 2)

        demand_by_branch_rows = (
            queue_scope.values("branch__name", "branch_name")
            .annotate(demand=Count("id"))
            .order_by("-demand")
        )
        demand_by_branch = [
            {
                "branch": row["branch__name"] or row["branch_name"] or "Unassigned",
                "demand": row["demand"],
            }
            for row in demand_by_branch_rows
        ]

        # ── Recent Transactions ───────────────────────────────────────────────
        recent_transactions = []
        recent_paid_entries = queue_scope.filter(
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
                "scope": branch_scope,
                "branch_id": selected_branch.id if selected_branch else None,
                "branch_name": selected_branch.name if selected_branch else None,
                "bookings_today": bookings_today,
                "new_customers_30d": new_customers_30d,
                "completion_rate": completion_rate,
                "payment_rate": payment_rate,
                "service_distribution": service_distribution,
                "top_services": top_services,
                "revenue_by_branch": revenue_by_branch,
                "moving_average_revenue_3": moving_average_points,
                "yearly_revenue": yearly_revenue,
                "revenue_cagr_percent": cagr_percent,
                "demand_by_branch": demand_by_branch,
                "employee_workload": employee_workload_rows,
                "employee_ratings": employee_ratings[:10],
                "employee_forecasts": employee_forecast_rows[:10],
                "highest_demand_employee": highest_demand_employee,
                "highest_rated_employee": highest_rated_employee,
                "employee_forecast_leader": employee_forecast_leader,
                "branch_demand_time_series": branch_demand_time_series,
                "branch_forecasts": branch_forecasts[:10],
                "highest_demand_branch": highest_demand_branch,
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


class StaffDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        staff = getattr(request.user, "staff_profile", None)
        if not staff or staff.role != "Staff":
            return Response({"detail": "Permission denied."}, status=403)

        full_name = f"{staff.first_name} {staff.last_name}".strip()
        today = timezone.localdate()

        booking_scope = Booking.objects.all().select_related("user", "branch", "queue_entry").filter(
            Q(queue_entry__assigned_employee_id=staff.id) | Q(staff=full_name)
        )
        if staff.branch_id:
            booking_scope = booking_scope.filter(branch_id=staff.branch_id)
        else:
            booking_scope = booking_scope.none()

        queue_scope = QueueEntry.objects.filter(assigned_employee_id=staff.id)
        if staff.branch_id:
            queue_scope = queue_scope.filter(branch_id=staff.branch_id)
        else:
            queue_scope = queue_scope.none()

        notifications_qs = Notification.objects.filter(user=request.user)

        stats = {
            "my_assigned_jobs": queue_scope.count(),
            "my_active_jobs": queue_scope.filter(status__in=["waiting", "in_service"]).count(),
            "my_completed_jobs": queue_scope.filter(status="done").count(),
            "my_paid_jobs": queue_scope.filter(payment_status="paid").count(),
            "my_upcoming_bookings": booking_scope.filter(
                date__gte=today,
                status__in=["pending", "confirmed", "rescheduled"],
            ).count(),
            "my_bookings_today": booking_scope.filter(date=today).count(),
            "my_unread_notifications": notifications_qs.filter(is_read=False).count(),
            "my_notifications_today": notifications_qs.filter(created_at__date=today).count(),
        }

        recent_jobs = []
        for booking in booking_scope.order_by("-date", "-time", "-created_at")[:8]:
            customer_name = "Customer"
            customer_profile = getattr(booking.user, "customer_profile", None)
            if customer_profile:
                customer_name = f"{customer_profile.first_name} {customer_profile.last_name}".strip()
            elif getattr(booking.user, "email", None):
                customer_name = booking.user.email

            recent_jobs.append(
                {
                    "id": booking.id,
                    "customer_name": customer_name,
                    "service": booking.service,
                    "date": booking.date.isoformat() if booking.date else None,
                    "time": booking.time,
                    "status": booking.status,
                    "branch_name": booking.branch.name if booking.branch else "",
                }
            )

        recent_notifications = list(
            notifications_qs.order_by("-created_at")
            .values("id", "title", "message", "notification_type", "created_at", "is_read")[:6]
        )

        return Response(
            {
                "staff": {
                    "id": staff.id,
                    "name": full_name,
                    "branch_name": staff.branch.name if staff.branch else staff.branch_name,
                },
                "stats": stats,
                "recent_jobs": recent_jobs,
                "recent_notifications": recent_notifications,
            }
        )


class ManagerScheduleConfigView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_staff_branch(self, request):
        staff = getattr(request.user, "staff_profile", None)
        if not staff:
            return None, None
        if staff.role not in ["Admin", "Branch Manager", "Staff", "Employee", "Inventory"]:
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
