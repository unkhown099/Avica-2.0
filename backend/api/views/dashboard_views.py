# api/views/dashboard_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import (
    Booking,
    Branch,
    BranchScheduleConfig,
    Customer,
    Notification,
    QueueEntry,
    Rating,
    Service,
    Staff,
    PaymentTransaction,
    InventoryTransaction,
)
from ..serializers.dashboard_serializer import DashboardStatsSerializer, RecentTransactionSerializer
from ..serializers.manager_schedule_serializer import ManagerScheduleConfigSerializer
from django.db.models import Avg, Count, Sum, Value, DecimalField
from django.utils import timezone
from django.db.models import Q
from django.db.models.functions import Coalesce
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
import re

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


def clean_price(value):
    """Normalize numeric/currency-ish values to float."""
    try:
        return float(str(value).replace("₱", "").replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


def extract_pos_product_sale_amount(notes):
    text = str(notes or "")
    marker = "[POS Product Sale]"
    if marker not in text:
        return 0.0
    tail = text.split(marker, 1)[1].strip()
    match = re.search(r"([0-9]+(?:\.[0-9]+)?)", tail)
    if not match:
        return 0.0
    return clean_price(match.group(1))


def sum_pos_product_sales(transactions):
    return sum(extract_pos_product_sale_amount(tx.notes) for tx in transactions)


def payment_scope_for_branch(selected_branch=None):
    scope = PaymentTransaction.objects.select_related("branch", "queue_entry")
    if selected_branch:
        scope = scope.filter(branch_id=selected_branch.id)
    return scope


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

def build_retention_analytics(queue_scope, customer_scope, now):
    paid_entries = (
        queue_scope.filter(payment_status="paid")
        .select_related("booking")
        .order_by("completed_at", "queued_at")
    )

    activity_by_user = {}
    paid_events_by_user = defaultdict(list)

    for entry in paid_entries:
        user_id = entry.customer_user_id
        if not user_id and getattr(entry, "booking", None):
            user_id = entry.booking.user_id
        if not user_id:
            continue

        event_dt = entry.completed_at or entry.queued_at
        if not event_dt:
            continue

        amount = clean_price(entry.price)
        if user_id not in activity_by_user:
            activity_by_user[user_id] = {
                "visits": 0,
                "revenue": 0.0,
                "last_seen": event_dt,
                "visit_dates": [],
            }

        row = activity_by_user[user_id]
        row["visits"] += 1
        row["revenue"] += amount
        row["visit_dates"].append(event_dt)
        if event_dt > row["last_seen"]:
            row["last_seen"] = event_dt

        paid_events_by_user[user_id].append((event_dt, amount))

    thresholds = {
        "healthy_days": 30,
        "watch_days": 45,
        "at_risk_days": 90,
        "reactivation_gap_days": 60,
    }

    churn_risk = {
        "healthy": 0,
        "watch": 0,
        "at_risk": 0,
        "churned": 0,
    }
    high_value_at_risk = []

    for user_id, row in activity_by_user.items():
        last_seen = row["last_seen"]
        days_since_last = max(0, (now.date() - last_seen.date()).days)
        if days_since_last <= thresholds["healthy_days"]:
            risk_level = "healthy"
        elif days_since_last <= thresholds["watch_days"]:
            risk_level = "watch"
        elif days_since_last <= thresholds["at_risk_days"]:
            risk_level = "at_risk"
        else:
            risk_level = "churned"

        churn_risk[risk_level] += 1

        is_high_value = row["revenue"] >= 50000 or row["visits"] >= 15
        if is_high_value and risk_level in {"at_risk", "churned"}:
            high_value_at_risk.append(
                {
                    "user_id": user_id,
                    "days_since_last_visit": days_since_last,
                    "visits": row["visits"],
                    "lifetime_revenue": round(row["revenue"], 2),
                    "risk_level": risk_level,
                }
            )

    reactivation_cutoff = now - timedelta(days=30)
    reactivation_buckets = {
        "60_89_days": 0,
        "90_179_days": 0,
        "180_plus_days": 0,
    }
    reactivated_customers_30d = 0

    for row in activity_by_user.values():
        dates = sorted(row["visit_dates"])
        if len(dates) < 2:
            continue
        latest = dates[-1]
        previous = dates[-2]
        if latest < reactivation_cutoff:
            continue
        gap_days = (latest.date() - previous.date()).days
        if gap_days < thresholds["reactivation_gap_days"]:
            continue

        reactivated_customers_30d += 1
        if gap_days >= 180:
            reactivation_buckets["180_plus_days"] += 1
        elif gap_days >= 90:
            reactivation_buckets["90_179_days"] += 1
        else:
            reactivation_buckets["60_89_days"] += 1

    recommended_actions = []
    if churn_risk["churned"] > 0:
        recommended_actions.append(
            {
                "priority": "high",
                "action": "Launch win-back campaign with limited-time offer",
                "target_segment": "churned",
                "target_customers": churn_risk["churned"],
            }
        )
    if churn_risk["at_risk"] > 0:
        recommended_actions.append(
            {
                "priority": "high",
                "action": "Send service reminder plus loyalty points booster",
                "target_segment": "at_risk",
                "target_customers": churn_risk["at_risk"],
            }
        )
    if high_value_at_risk:
        recommended_actions.append(
            {
                "priority": "critical",
                "action": "Assign concierge follow-up for high-value customers",
                "target_segment": "high_value_at_risk",
                "target_customers": len(high_value_at_risk),
            }
        )
    if churn_risk["watch"] > 0:
        recommended_actions.append(
            {
                "priority": "medium",
                "action": "Run preventive check-in message sequence",
                "target_segment": "watch",
                "target_customers": churn_risk["watch"],
            }
        )

    scope_user_ids = list(customer_scope.values_list("user_id", flat=True))
    campaign_types = {"promotion", "promo", "marketing", "retention"}
    ninety_days_ago = now - timedelta(days=90)

    campaign_notifications = Notification.objects.filter(created_at__gte=ninety_days_ago)
    if scope_user_ids:
        campaign_notifications = campaign_notifications.filter(user_id__in=scope_user_ids)

    campaign_tracker = {}
    for note in campaign_notifications.only("user_id", "notification_type", "created_at"):
        campaign_type = (note.notification_type or "promotion").strip().lower()
        if campaign_type not in campaign_types:
            continue

        bucket = campaign_tracker.setdefault(
            campaign_type,
            {
                "users_sent": set(),
                "first_notified_at": {},
            },
        )
        bucket["users_sent"].add(note.user_id)
        first_seen = bucket["first_notified_at"].get(note.user_id)
        if first_seen is None or note.created_at < first_seen:
            bucket["first_notified_at"][note.user_id] = note.created_at

    campaign_rows = []
    overall_sent_users = set()
    overall_converted_users = set()

    for campaign_type, tracker in sorted(campaign_tracker.items()):
        sent_users = tracker["users_sent"]
        first_notified_at = tracker["first_notified_at"]
        converted_users = set()
        conversion_revenue = 0.0

        for user_id in sent_users:
            notify_at = first_notified_at.get(user_id)
            paid_events = paid_events_by_user.get(user_id, [])
            post_events = [(event_dt, amount) for event_dt, amount in paid_events if notify_at and event_dt > notify_at]
            if post_events:
                converted_users.add(user_id)
                conversion_revenue += sum(amount for _, amount in post_events)

        overall_sent_users.update(sent_users)
        overall_converted_users.update(converted_users)

        sent_count = len(sent_users)
        converted_count = len(converted_users)
        conversion_rate = round((converted_count / sent_count) * 100, 1) if sent_count else 0.0

        campaign_rows.append(
            {
                "campaign_type": campaign_type,
                "sent_users": sent_count,
                "converted_users": converted_count,
                "conversion_rate": conversion_rate,
                "revenue_after_campaign": round(conversion_revenue, 2),
            }
        )

    overall_sent_count = len(overall_sent_users)
    overall_converted_count = len(overall_converted_users)
    overall_conversion_rate = (
        round((overall_converted_count / overall_sent_count) * 100, 1)
        if overall_sent_count
        else 0.0
    )

    return {
        "churn_risk": {
            "healthy": churn_risk["healthy"],
            "watch": churn_risk["watch"],
            "at_risk": churn_risk["at_risk"],
            "churned": churn_risk["churned"],
            "threshold_days": thresholds,
        },
        "reactivation_cohorts": {
            "reactivated_customers_30d": reactivated_customers_30d,
            "by_gap": reactivation_buckets,
        },
        "high_value_at_risk": sorted(
            high_value_at_risk,
            key=lambda row: (row["lifetime_revenue"], row["days_since_last_visit"]),
            reverse=True,
        )[:10],
        "recommended_actions": recommended_actions,
        "campaign_outcomes": {
            "window_days": 90,
            "sent_users": overall_sent_count,
            "converted_users": overall_converted_count,
            "overall_conversion_rate": overall_conversion_rate,
            "campaigns": campaign_rows,
        },
    }


class AdminDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = getattr(request.user, "staff_profile", None)
        is_superuser = getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False)
        staff_role = requester_staff.role if requester_staff else ""
        normalized_role = staff_role.lower().replace(" ", "_")

        allowed_roles = {"admin", "business_owner", "super_admin", "branch_manager"}
        if not is_superuser and normalized_role not in allowed_roles:
            return Response({"detail": "Permission denied."}, status=403)

        now = timezone.now()
        current_year = now.year
        branch_id_raw = request.query_params.get("branch_id")
        selected_branch = None
        branch_scope = "all"

        if normalized_role == "branch_manager":
            if not requester_staff or not requester_staff.branch_id:
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
        payment_scope = payment_scope_for_branch(selected_branch)
        total_revenue = float(
            payment_scope.aggregate(
                t=Coalesce(
                    Sum("amount"),
                    Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
                )
            )["t"]
            or 0
        )
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
        monthly_revenue = defaultdict(float)
        for tx in payment_scope:
            if not tx.paid_at or tx.paid_at.year != current_year:
                continue
            month = tx.paid_at.month
            monthly_revenue[month] += float(tx.amount or 0)

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
        service_category_map = {
            (name or "").strip().lower(): (category or "Other")
            for name, category in Service.objects.values_list("name", "category")
        }
        category_totals = defaultdict(int)
        for item in service_counts:
            service_name = (item.get("service") or "").strip().lower()
            category = service_category_map.get(service_name, "Other")
            category_totals[category] += int(item.get("count") or 0)

        category_distribution = sorted(
            category_totals.items(),
            key=lambda pair: pair[1],
            reverse=True,
        )
        total_service_count = sum(count for _, count in category_distribution)
        service_distribution = [
            {
                "label": category or "Other",
                "count": count,
                "pct": round((count / total_service_count) * 100, 1) if total_service_count else 0.0,
            }
            for category, count in category_distribution[:6]
        ]

        top_services_qs = (
            payment_scope.values("transaction_type", "description")
            .annotate(
                count=Count("id"),
                revenue=Coalesce(
                    Sum("amount"),
                    Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
                ),
            )
            .order_by("-revenue", "-count")
        )
        top_services = [
            {
                "service": row["description"] or str(row["transaction_type"]).replace("_", " ").title(),
                "count": row["count"],
                "revenue": round(float(row["revenue"] or 0), 2),
            }
            for row in top_services_qs[:6]
        ]

        revenue_by_branch_map = defaultdict(float)

        paid_branch_revenue = (
            payment_scope.values("branch__name")
            .annotate(
                revenue=Coalesce(
                    Sum("amount"),
                    Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
                )
            )
        )
        for row in paid_branch_revenue:
            branch_name = row["branch__name"] or "Unassigned"
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
            payment_scope.filter(paid_at__isnull=False)
            .values("paid_at__year")
            .annotate(
                revenue=Coalesce(
                    Sum("amount"),
                    Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
                )
            )
            .order_by("paid_at__year")
        )
        yearly_revenue = [
            {"year": row["paid_at__year"], "revenue": float(row["revenue"] or 0)}
            for row in yearly_rows
            if row["paid_at__year"] is not None
        ]

        cagr_percent = 0.0
        if len(yearly_revenue) >= 2:
            first = yearly_revenue[0]
            last = yearly_revenue[-1]
            year_span = int(last["year"]) - int(first["year"])
            if first["revenue"] > 0 and year_span > 0:
                cagr_percent = round((((last["revenue"] / first["revenue"]) ** (1 / year_span)) - 1) * 100, 2)

        retention_analytics = build_retention_analytics(
            queue_scope=queue_scope,
            customer_scope=customer_scope,
            now=now,
        )

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
        recent_paid_entries = payment_scope.order_by("-paid_at", "-created_at")[:5]
        for q in recent_paid_entries:
            recent_transactions.append(
                {
                    "customer_name": (
                        q.queue_entry.customer_name
                        if getattr(q, "queue_entry", None) and q.queue_entry.customer_name
                        else "Walk-in Customer"
                    ),
                    "service": q.description or str(q.transaction_type).replace("_", " ").title(),
                    "amount": float(q.amount or 0),
                    "status": "paid",
                    "_ts": q.paid_at or q.created_at,
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
                "product_only_revenue": round(
                    float(
                        payment_scope.filter(transaction_type="product").aggregate(
                            t=Coalesce(
                                Sum("amount"),
                                Value(0, output_field=DecimalField(max_digits=12, decimal_places=2)),
                            )
                        )["t"]
                        or 0
                    ),
                    2,
                ),
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
                "retention": retention_analytics,
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
            payment_scope = PaymentTransaction.objects.filter(branch=branch)
            
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
            ).count()
            rev_this = payment_scope.filter(
                paid_at__month=this_month,
                paid_at__year=this_year,
            ).aggregate(t=Sum("amount"))["t"] or 0
            rev_last = payment_scope.filter(
                paid_at__month=last_month,
                paid_at__year=last_month_year,
            ).aggregate(t=Sum("amount"))["t"] or 0
            rev_change = round(((float(rev_this) - float(rev_last)) / float(rev_last)) * 100, 1) if rev_last else 0
            rev_this = float(rev_this or 0)
            rev_last = float(rev_last or 0)
            rev_change = round(((rev_this - rev_last) / rev_last) * 100, 1) if rev_last else 0

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
                    branch=branch, status="done", completed_at__month=m, completed_at__year=y
                )
                paid_qs = payment_scope.filter(
                    paid_at__month=m,
                    paid_at__year=y,
                )
                trend.append({
                    "label": MONTH_LABELS[m-1],
                    "revenue": float(paid_qs.aggregate(t=Sum("amount"))["t"] or 0),
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

    @staticmethod
    def _format_queue_datetime(entry):
        if not entry:
            return None, None
        if getattr(entry, "booking", None):
            b = entry.booking
            booking_time = str(getattr(b, "time", "") or "").strip()
            return (
                b.date.isoformat() if getattr(b, "date", None) else None,
                booking_time or None,
            )

        queued_at = getattr(entry, "queued_at", None)
        if not queued_at:
            return None, None

        queued_local = timezone.localtime(queued_at)
        return queued_local.date().isoformat(), queued_local.strftime("%I:%M %p").lstrip("0")

    def get(self, request):
        staff = getattr(request.user, "staff_profile", None)
        allowed_roles = {"Staff", "Employee"}
        if not staff or staff.role not in allowed_roles:
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

        queue_scope = queue_scope.select_related("booking", "booking__user", "booking__user__customer_profile", "branch")

        notifications_qs = Notification.objects.filter(user=request.user)

        appointment_jobs_count = queue_scope.filter(source="booking").count()
        walkin_jobs_count = queue_scope.filter(source="walk_in").count()

        # Staff revenue analytics (single source of truth: payment_transactions)
        payment_scope = PaymentTransaction.objects.filter(staff_id=staff.id)
        if staff.branch_id:
            payment_scope = payment_scope.filter(branch_id=staff.branch_id)
        else:
            payment_scope = payment_scope.none()
        if not payment_scope.exists():
            fallback_notes_sales = InventoryTransaction.objects.filter(
                action_type="update",
                quantity_changed__lt=0,
                notes__icontains="[POS Product Sale]",
                created_at__date=today,
            )
            if staff.branch_id:
                fallback_notes_sales = fallback_notes_sales.filter(branch_name=staff.branch.name if staff.branch else staff.branch_name)
            fallback_amount = sum_pos_product_sales(fallback_notes_sales)
            if fallback_amount > 0:
                product_sales_today = fallback_amount
                service_sales_today = 0.0
                sales_today = product_sales_today
                paid_today_count = fallback_notes_sales.count()
                stats = {
                    "my_assigned_jobs": queue_scope.count(),
                    "my_active_jobs": queue_scope.filter(status__in=["waiting", "in_service"]).count(),
                    "my_completed_jobs": queue_scope.filter(status="done").count(),
                    "my_paid_jobs": paid_today_count,
                    "my_paid_jobs_today": paid_today_count,
                    "my_sales_today": round(sales_today, 2),
                    "my_service_sales_today": round(service_sales_today, 2),
                    "my_product_sales_today": round(product_sales_today, 2),
                    "my_appointment_jobs": appointment_jobs_count,
                    "my_walkin_jobs": walkin_jobs_count,
                    "my_upcoming_bookings": booking_scope.filter(
                        date__gte=today,
                        status__in=["pending", "confirmed", "rescheduled"],
                    ).count(),
                    "my_bookings_today": booking_scope.filter(date=today).count(),
                    "my_unread_notifications": notifications_qs.filter(is_read=False).count(),
                    "my_notifications_today": notifications_qs.filter(created_at__date=today).count(),
                }
                return Response(
                    {
                        "staff": {
                            "id": staff.id,
                            "name": full_name,
                            "branch_name": staff.branch.name if staff.branch else staff.branch_name,
                        },
                        "stats": stats,
                        "analytics": {
                            "earnings_per_hour": [
                                {"hour": f"{h:02d}:00", "value": 0.0} for h in range(24)
                            ],
                            "daily_revenue_trend": [
                                {
                                    "date": day.isoformat(),
                                    "label": day.strftime("%b %d"),
                                    "value": round(product_sales_today if day == today else 0.0, 2),
                                }
                                for day in [today - timedelta(days=offset) for offset in range(6, -1, -1)]
                            ],
                        },
                        "recent_jobs": [],
                        "recent_notifications": list(
                            notifications_qs.order_by("-created_at")
                            .values("id", "title", "message", "notification_type", "created_at", "is_read")[:6]
                        ),
                    }
                )

        paid_today_scope = payment_scope.filter(paid_at__date=today)
        paid_scope = payment_scope

        service_sales_today = float(
            paid_today_scope.filter(transaction_type__in=["appointment", "walk_in", "service"]).aggregate(
                total=Coalesce(
                    Sum("amount", output_field=DecimalField(max_digits=12, decimal_places=2)),
                    Value(Decimal("0.00"), output_field=DecimalField(max_digits=12, decimal_places=2)),
                )
            )["total"]
            or 0
        )
        product_sales_today = float(
            paid_today_scope.filter(transaction_type="product").aggregate(
                total=Coalesce(
                    Sum("amount", output_field=DecimalField(max_digits=12, decimal_places=2)),
                    Value(Decimal("0.00"), output_field=DecimalField(max_digits=12, decimal_places=2)),
                )
            )["total"]
            or 0
        )
        sales_today = service_sales_today + product_sales_today
        earnings_by_hour = {hour: 0.0 for hour in range(24)}
        daily_dates = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
        revenue_by_day = {day.isoformat(): 0.0 for day in daily_dates}

        for entry in paid_scope:
            amount = float(entry.amount or 0)
            if amount <= 0:
                continue
            event_dt = entry.paid_at or entry.created_at
            if not event_dt:
                continue

            event_local = timezone.localtime(event_dt)
            hour_key = event_local.hour
            day_key = event_local.date().isoformat()

            earnings_by_hour[hour_key] += amount
            if day_key in revenue_by_day:
                revenue_by_day[day_key] += amount

        earnings_per_hour = [
            {
                "hour": f"{hour:02d}:00",
                "value": round(value, 2),
            }
            for hour, value in earnings_by_hour.items()
        ]

        daily_revenue_trend = [
            {
                "date": day.isoformat(),
                "label": day.strftime("%b %d"),
                "value": round(revenue_by_day[day.isoformat()], 2),
            }
            for day in daily_dates
        ]

        stats = {
            "my_assigned_jobs": queue_scope.count(),
            "my_active_jobs": queue_scope.filter(status__in=["waiting", "in_service"]).count(),
            "my_completed_jobs": queue_scope.filter(status="done").count(),
            "my_paid_jobs": paid_scope.count(),
            "my_paid_jobs_today": paid_today_scope.count(),
            "my_sales_today": round(sales_today, 2),
            "my_service_sales_today": round(service_sales_today, 2),
            "my_product_sales_today": round(product_sales_today, 2),
            "my_appointment_jobs": appointment_jobs_count,
            "my_walkin_jobs": walkin_jobs_count,
            "my_upcoming_bookings": booking_scope.filter(
                date__gte=today,
                status__in=["pending", "confirmed", "rescheduled"],
            ).count(),
            "my_bookings_today": booking_scope.filter(date=today).count(),
            "my_unread_notifications": notifications_qs.filter(is_read=False).count(),
            "my_notifications_today": notifications_qs.filter(created_at__date=today).count(),
        }

        recent_jobs = []
        for entry in queue_scope.order_by("-queued_at")[:8]:
            booking = getattr(entry, "booking", None)
            customer_name = (entry.customer_name or "").strip() or "Customer"
            if booking and getattr(booking, "user", None):
                customer_profile = getattr(booking.user, "customer_profile", None)
                if customer_profile:
                    customer_name = f"{customer_profile.first_name} {customer_profile.last_name}".strip()
                elif getattr(booking.user, "email", None):
                    customer_name = booking.user.email

            date_value, time_value = self._format_queue_datetime(entry)

            recent_jobs.append(
                {
                    "id": entry.id,
                    "booking_id": booking.id if booking else None,
                    "customer_name": customer_name,
                    "service": entry.service,
                    "date": date_value,
                    "time": time_value,
                    "status": entry.status,
                    "source": entry.source,
                    "branch_name": entry.branch.name if entry.branch else entry.branch_name,
                    "queue_id": entry.id,
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
                "analytics": {
                    "earnings_per_hour": earnings_per_hour,
                    "daily_revenue_trend": daily_revenue_trend,
                },
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
