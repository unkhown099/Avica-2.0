import json
import re
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Q
from django.db.models.functions import TruncMonth, TruncDate
from django.utils import timezone
from datetime import timedelta
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F

from api.models import (
    Staff, Branch, Customer, Booking, QueueEntry,
    Service, InventoryItem, Notification, Plugin,
    PluginLog
)
from api.permissions import IsSuperAdmin

User = get_user_model()
NAME_PATTERN = re.compile(r"^[A-Za-z]+(?: [A-Za-z]+)*$")
PHONE_PATTERN = re.compile(r"^\+63\d+$")

def _notification_dashboard_path_for_user(user):
    try:
        if user.customer_profile:
            return "/dashboard"
    except Exception:
        pass

    role = None
    try:
        role = user.staff_profile.role
    except Exception:
        role = None

    role_routes = {
        "super_admin": "/super-admin/dashboard",
        "Admin": "/admin/dashboard",
        "Business Owner": "/branch-owner/dashboard",
        "Branch Manager": "/manager/dashboard",
        "Inventory Manager": "/inventory-manager/dashboard",
        "Inventory": "/inventory/dashboard",
        "Staff": "/staff/dashboard",
        "Employee": "/employee/dashboard",
    }
    return role_routes.get(role, "/")


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. OVERVIEW DASHBOARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        import random
        try:
            import psutil
        except ImportError:
            psutil = None
        from datetime import timedelta

        today = timezone.now().date()
        now = timezone.now()
        this_month_start = today.replace(day=1)
        seven_months_ago = _months_ago(today, 6)
        thirty_days_ago = today - timedelta(days=29)
        seven_days_ago = today - timedelta(days=6)

        # ── Basic counts ──────────────────────────────────────────────────────
        total_users     = User.objects.count()
        total_staff     = Staff.objects.count()
        total_customers = Customer.objects.count()

        # ── Staff by role ─────────────────────────────────────────────────────
        staff_by_role = list(
            Staff.objects.values("role").annotate(count=Count("id")).order_by("-count")
        )

        # ── Active sessions (approximation: users logged in within last hour) ─
        one_hour_ago = now - timedelta(hours=1)
        active_sessions = User.objects.filter(last_login__gte=one_hour_ago).count()

        # ── New users (last 30 days) ──────────────────────────────────────────
        new_users_last_30d = User.objects.filter(
            created_at__date__gte=thirty_days_ago
        ).count()

        # ── New users previous 30 days (for growth rate) ──────────────────────
        prev_30_start = thirty_days_ago - timedelta(days=30)
        prev_users = User.objects.filter(
            created_at__date__gte=prev_30_start,
            created_at__date__lt=thirty_days_ago,
        ).count()
        if prev_users > 0:
            growth_rate_pct = round((new_users_last_30d - prev_users) / prev_users * 100, 1)
        else:
            growth_rate_pct = 0.0

        # ── Active users last 7 days ──────────────────────────────────────────
        active_users_last_7d = User.objects.filter(
            last_login__date__gte=seven_days_ago
        ).count()

        # ── Monthly users (total cumulative snapshot per month) ───────────────
        monthly_users_qs = (
            User.objects
            .filter(created_at__date__gte=seven_months_ago)
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )
        chart_labels, monthly_users = _fill_months(monthly_users_qs, "total", today, 7)

        # ── API response times — last 7 days (from PluginLog or synthetic) ───
        # Use real query timing if available, otherwise derive from recent data
        response_labels = []
        api_response_times = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            response_labels.append(day.strftime("%a"))
            # Use PluginLog counts as a proxy, or fall back to a stable synthetic value
            count = PluginLog.objects.filter(created_at__date=day).count()
            # Map to a plausible ms range (50–300ms); if no logs, use 80ms baseline
            api_response_times.append(round(80 + (count * 3.5), 1) if count else 80)

        avg_response_time = (
            round(sum(api_response_times) / len(api_response_times), 1)
            if api_response_times else 80
        )
        response_status = (
            "Normal" if avg_response_time < 200
            else "Slow" if avg_response_time < 500
            else "Critical"
        )

        # ── Error rate (bookings with cancelled/failed vs total last 24h) ─────
        last_24h = now - timedelta(hours=24)
        recent_bookings = Booking.objects.filter(created_at__gte=last_24h)
        total_recent = recent_bookings.count()
        error_bookings = recent_bookings.filter(status__in=["cancelled", "no_show"]).count()
        error_rate = round(error_bookings / total_recent, 4) if total_recent > 0 else 0.0

        # ── System metrics via psutil ─────────────────────────────────────────
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            mem = psutil.virtual_memory()
            memory_percent = mem.percent
            total_memory_gb = round(mem.total / (1024 ** 3), 1)
            memory_used_gb = round(mem.used / (1024 ** 3), 1)
            disk = psutil.disk_usage("/")
            storage_used_gb = round(disk.used / (1024 ** 3), 1)
            storage_total_gb = round(disk.total / (1024 ** 3), 1)
        except Exception:
            cpu_percent = 0.0
            memory_percent = 0.0
            total_memory_gb = 8
            memory_used_gb = 0.0
            storage_used_gb = 0.0
            storage_total_gb = 50

        cpu_status = (
            "Critical" if cpu_percent > 90
            else "Warning" if cpu_percent > 70
            else "Normal"
        )

        # ── CPU / memory history — last 24 hours (hourly PluginLog counts) ───
        cpu_usage = []
        memory_usage = []
        requests_per_minute_list = []
        system_load_history = []
        system_load_labels = []
        request_labels = []

        for i in range(23, -1, -1):
            hour_start = now - timedelta(hours=i + 1)
            hour_end   = now - timedelta(hours=i)
            label = hour_start.strftime("%H:%M")
            system_load_labels.append(label)
            request_labels.append(label)

            logs_in_hour = PluginLog.objects.filter(
                created_at__gte=hour_start, created_at__lt=hour_end
            ).count()

            # Derive synthetic but deterministic metrics from real log activity
            base_cpu = min(95, cpu_percent + (logs_in_hour * 0.5))
            cpu_usage.append(round(base_cpu, 1))
            memory_usage.append(round(min(95, memory_percent + (logs_in_hour * 0.2)), 1))
            requests_per_minute_list.append(logs_in_hour)
            system_load_history.append(round(base_cpu, 1))

        requests_per_second = round(
            sum(requests_per_minute_list) / max(len(requests_per_minute_list), 1) / 60, 2
        )
        peak_rps = max(requests_per_minute_list, default=0)

        # ── Uptime ────────────────────────────────────────────────────────────
        try:
            boot_time = psutil.boot_time()
            uptime_seconds = (now.timestamp() - boot_time)
            uptime_days = int(uptime_seconds // 86400)
        except Exception:
            uptime_days = 0
        uptime_percentage = 99.9  # Static SLA value; replace with real monitoring data

        # ── Database / cache / gateway health (lightweight probes) ───────────
        import time
        db_start = time.monotonic()
        try:
            User.objects.exists()
            database_response_ms = round((time.monotonic() - db_start) * 1000, 1)
            database_status = "healthy" if database_response_ms < 100 else "warning"
        except Exception:
            database_response_ms = 0
            database_status = "error"

        cache_start = time.monotonic()
        try:
            cache.set("_health_check", 1, timeout=5)
            cache.get("_health_check")
            gateway_response_ms = round((time.monotonic() - cache_start) * 1000, 1)
            cache_status = "healthy"
            cache_hit_rate = 85  # placeholder — replace with real cache stats if available
        except Exception:
            gateway_response_ms = 0
            cache_status = "error"
            cache_hit_rate = 0

        active_workers = 4  # Replace with Celery inspect if used
        pending_jobs   = 0  # Replace with real queue length

        return Response({
            # ── User stats ────────────────────────────────────────────────────
            "users": {
                "total":     total_users,
                "staff":     total_staff,
                "customers": total_customers,
            },
            "active_sessions":        active_sessions,
            "new_users_last_30d":     new_users_last_30d,
            "growth_rate_percentage": growth_rate_pct,
            "active_users_last_7d":   active_users_last_7d,
            "staff_by_role":          staff_by_role,

            # ── API / error metrics ───────────────────────────────────────────
            "avg_response_time":  avg_response_time,
            "response_status":    response_status,
            "error_rate":         error_rate,

            # ── Chart data ────────────────────────────────────────────────────
            "chart_labels":          chart_labels,
            "monthly_users":         monthly_users,
            "response_labels":       response_labels,
            "api_response_times":    api_response_times,

            # ── Performance panel ─────────────────────────────────────────────
            "current_cpu":              cpu_percent,
            "cpu_status":               cpu_status,
            "cpu_usage":                cpu_usage,
            "current_memory":           memory_percent,
            "current_memory_used_gb":   memory_used_gb,
            "total_memory_gb":          total_memory_gb,
            "memory_usage":             memory_usage,
            "requests_per_second":      requests_per_second,
            "peak_requests_per_second": peak_rps,
            "requests_per_minute":      requests_per_minute_list,
            "request_labels":           request_labels,
            "uptime_days":              uptime_days,
            "uptime_percentage":        uptime_percentage,

            # ── System health panel ───────────────────────────────────────────
            "database_status":     database_status,
            "database_response_ms": database_response_ms,
            "cache_status":        cache_status,
            "cache_hit_rate":      cache_hit_rate,
            "gateway_status":      "healthy",
            "gateway_response_ms": gateway_response_ms,
            "storage_status":      "healthy",
            "storage_used_gb":     storage_used_gb,
            "storage_total_gb":    storage_total_gb,
            "queue_status":        "healthy",
            "active_workers":      active_workers,
            "jobs_status":         "healthy",
            "pending_jobs":        pending_jobs,
            "system_load_labels":  system_load_labels,
            "system_load_history": system_load_history,
        })
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Helpers
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def _months_ago(today, n):
    """Return the first day of the month N months before today's month."""
    month = today.month - n
    year  = today.year + month // 12
    month = month % 12 or 12
    return today.replace(year=year, month=month, day=1)


def _fill_months(queryset, value_key, today, count):
    """
    Build two parallel lists (labels, values) for the last `count` months,
    filling 0 for months with no data.
    """
    from calendar import month_abbr

    # Build lookup: "YYYY-MM" → value
    lookup = {}
    for row in queryset:
        key = row["month"].strftime("%Y-%m")
        lookup[key] = float(row[value_key] or 0)

    labels = []
    values = []
    for i in range(count - 1, -1, -1):
        # Walk backwards from this month
        month = today.month - i
        year  = today.year + (month - 1) // 12 if month <= 0 else today.year
        month = month % 12 or 12
        key   = f"{year}-{month:02d}"
        labels.append(month_abbr[month])
        values.append(lookup.get(key, 0))

    return labels, values


def _fill_days(queryset, today):
    """
    Build two parallel lists (labels, values) for the last 30 days,
    filling 0 for days with no data.
    """
    lookup = {row["day"]: row["total"] for row in queryset}
    labels = []
    values = []
    for i in range(29, -1, -1):
        day = today - timedelta(days=i)
        labels.append(str(day.day))
        values.append(lookup.get(day, 0))
    return labels, values


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. USER MANAGEMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminUserListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        users = User.objects.select_related(
            "staff_profile", "customer_profile"
        ).order_by("-created_at")

        role   = request.query_params.get("role")
        search = request.query_params.get("search")

        if search:
            users = users.filter(
                Q(email__icontains=search) |
                Q(staff_profile__first_name__icontains=search) |
                Q(staff_profile__last_name__icontains=search) |
                Q(customer_profile__first_name__icontains=search) |
                Q(customer_profile__last_name__icontains=search)
            )
        if role == "staff":
            users = users.filter(staff_profile__isnull=False)
        elif role == "customer":
            users = users.filter(customer_profile__isnull=False)

        data = []
        for u in users:
            entry = {
                "id":             u.id,
                "email":          u.email,
                "is_active":      u.is_active,
                "is_archived":    getattr(u, "is_archived", False),
                "is_staff":       u.is_staff,
                "email_verified": u.email_verified,
                "created_at":     u.created_at,
                "last_login":     u.last_login,
                "account_type":   None,
                "profile":        {},
            }
            if hasattr(u, "staff_profile"):
                s = u.staff_profile
                entry["account_type"] = "staff"
                entry["profile"] = {
                    "name":   f"{s.first_name} {s.last_name}",
                    "role":   s.role,
                    "branch": s.branch.name if s.branch else s.branch_name,
                    "status": s.status,
                    "phone":  s.phone,
                }
            elif hasattr(u, "customer_profile"):
                c = u.customer_profile
                entry["account_type"] = "customer"
                entry["profile"] = {
                    "name":           f"{c.first_name} {c.last_name}",
                    "phone":          c.phone,
                    "loyalty_points": c.loyalty_points,
                }
            data.append(entry)

        return Response(data)


class SuperAdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_object(self, pk):
        try:
            return User.objects.select_related(
                "staff_profile", "customer_profile"
            ).get(pk=pk)
        except User.DoesNotExist:
            return None

    def get(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found."}, status=404)

        data = {
            "id":             user.id,
            "email":          user.email,
            "is_active":      user.is_active,
            "is_archived":    getattr(user, "is_archived", False),
            "is_staff":       user.is_staff,
            "is_superuser":   user.is_superuser,
            "email_verified": user.email_verified,
            "created_at":     user.created_at,
            "last_login":     user.last_login,
        }
        if hasattr(user, "staff_profile"):
            s = user.staff_profile
            data["staff"] = {
                "id":     s.id,
                "name":   f"{s.first_name} {s.last_name}",
                "role":   s.role,
                "branch": s.branch.name if s.branch else s.branch_name,
                "status": s.status,
                "phone":  s.phone,
            }
        if hasattr(user, "customer_profile"):
            c = user.customer_profile
            data["customer"] = {
                "name":           f"{c.first_name} {c.last_name}",
                "phone":          c.phone,
                "loyalty_points": c.loyalty_points,
            }
        return Response(data)

    def patch(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found."}, status=404)

        if user == request.user and request.data.get("is_active") is False:
            return Response(
                {"error": "You cannot deactivate your own account."}, status=400
            )

        changed = []

        if "is_active" in request.data:
            user.is_active = bool(request.data["is_active"])
            changed.append("is_active")

        user.save()

        if hasattr(user, "staff_profile"):
            s = user.staff_profile
            first_name = request.data.get("first_name")
            last_name = request.data.get("last_name")
            phone = request.data.get("phone")

            if first_name is not None:
                first_name = str(first_name).strip()
                if not NAME_PATTERN.fullmatch(first_name):
                    return Response({"error": "First name can only contain letters and spaces."}, status=400)
                s.first_name = first_name
                changed.append("first_name")

            if last_name is not None:
                last_name = str(last_name).strip()
                if not NAME_PATTERN.fullmatch(last_name):
                    return Response({"error": "Last name can only contain letters and spaces."}, status=400)
                s.last_name = last_name
                changed.append("last_name")

            if phone is not None:
                phone = str(phone).strip()
                if len(phone) > 12:
                    return Response({"error": "Phone number must not exceed 12 characters."}, status=400)
                if phone and not PHONE_PATTERN.fullmatch(phone):
                    return Response({"error": "Phone number must start with +63 and contain digits only."}, status=400)
                s.phone = phone
                changed.append("phone")

            if "staff_role" in request.data:
                s.role = request.data["staff_role"]
                changed.append("role")
            if "staff_status" in request.data:
                s.status = request.data["staff_status"]
                changed.append("status")
            if "staff_branch" in request.data:
                try:
                    s.branch = Branch.objects.get(pk=request.data["staff_branch"])
                    changed.append("branch")
                except Branch.DoesNotExist:
                    return Response({"error": "Branch not found."}, status=404)
            s.save()

        return Response({"message": f"User updated. Changed: {', '.join(changed)}"})

    def delete(self, request, pk):
        user = self.get_object(pk)
        if not user:
            return Response({"error": "User not found."}, status=404)
        if user == request.user:
            return Response({"error": "You cannot delete your own account."}, status=400)
        user.delete()
        return Response({"message": "User permanently deleted."}, status=204)


class SuperAdminUserArchiveView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.select_related("staff_profile").get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        if user == request.user:
            return Response({"error": "You cannot archive your own account."}, status=400)

        user.is_archived = True
        user.is_active = False
        user.save()

        if hasattr(user, "staff_profile"):
            user.staff_profile.status = "Archived"
            user.staff_profile.save()

        return Response({"message": f"User {user.email} has been archived."})


class SuperAdminUserRestoreView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.select_related("staff_profile").get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        user.is_archived = False
        user.is_active = True
        user.save()

        if hasattr(user, "staff_profile"):
            user.staff_profile.status = "Active"
            user.staff_profile.save()

        return Response({"message": f"User {user.email} has been restored."})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. ROLE MANAGEMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminRoleListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        roles = [r[0] for r in Staff.ROLE_CHOICES]
        breakdown = {r: Staff.objects.filter(role=r).count() for r in roles}
        return Response({"roles": roles, "breakdown": breakdown})


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. SYSTEM REPORTS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminReportsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        report_type = request.query_params.get("type", "overview")
        today = timezone.now().date()

        if report_type == "revenue":
            return self._revenue_report(request)
        elif report_type == "bookings":
            return self._bookings_report(request)
        elif report_type == "staff":
            return self._staff_report()
        elif report_type == "inventory":
            return self._inventory_report()
        else:
            return self._overview_report(today)

    def _overview_report(self, today):
        last_30 = today - timedelta(days=30)
        return Response({
            "period": "last_30_days",
            "new_users":      User.objects.filter(created_at__date__gte=last_30).count(),
            "new_bookings":   Booking.objects.filter(created_at__date__gte=last_30).count(),
            "revenue":        float(
                Booking.objects.filter(
                    status="done", date__gte=last_30
                ).aggregate(t=Sum("price"))["t"] or 0
            ),
            "completed_jobs": QueueEntry.objects.filter(
                status="done", completed_at__date__gte=last_30
            ).count(),
        })

    def _revenue_report(self, request):
        days  = int(request.query_params.get("days", 30))
        since = timezone.now().date() - timedelta(days=days)

        by_branch = list(
            Booking.objects.filter(status="done", date__gte=since)
            .values("branch__name")
            .annotate(revenue=Sum("price"), bookings=Count("id"))
            .order_by("-revenue")
        )
        total = sum(b["revenue"] or 0 for b in by_branch)
        return Response({
            "period_days":   days,
            "total_revenue": float(total),
            "by_branch": [
                {**b, "revenue": float(b["revenue"] or 0)}
                for b in by_branch
            ],
        })

    def _bookings_report(self, request):
        days  = int(request.query_params.get("days", 30))
        since = timezone.now().date() - timedelta(days=days)

        by_status = list(
            Booking.objects.filter(date__gte=since)
            .values("status")
            .annotate(count=Count("id"))
        )
        by_service = list(
            Booking.objects.filter(date__gte=since)
            .values("service")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )
        return Response({
            "period_days":   days,
            "by_status":     by_status,
            "top_services":  by_service,
        })

    def _staff_report(self):
        data = []
        for s in Staff.objects.select_related("branch").all():
            bookings_handled = Booking.objects.filter(branch=s.branch, status="done").count()
            data.append({
                "id":                 s.id,
                "name":               f"{s.first_name} {s.last_name}",
                "role":               s.role,
                "branch":             s.branch.name if s.branch else s.branch_name,
                "status":             s.status,
                "bookings_in_branch": bookings_handled,
            })
        return Response(data)

    def _inventory_report(self):
        items       = InventoryItem.objects.select_related("branch").filter(is_active=True)
        out_of_stock = items.filter(quantity=0)
        low_stock    = items.filter(quantity__gt=0, quantity__lte=F("minimum_qty"))
        return Response({
            "total_items":      items.count(),
            "out_of_stock":     out_of_stock.count(),
            "low_stock":        low_stock.count(),
            "out_of_stock_list": list(
                out_of_stock.values("id", "name", "branch__name", "quantity", "minimum_qty")
            ),
            "low_stock_list":   list(
                low_stock.values("id", "name", "branch__name", "quantity", "minimum_qty")
            ),
        })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. ACTIVITY LOG
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminActivityLogView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        logs = Notification.objects.select_related("user").order_by("-created_at")

        user_id = request.query_params.get("user_id")
        ntype   = request.query_params.get("type")
        days    = request.query_params.get("days")

        if user_id:
            logs = logs.filter(user_id=user_id)
        if ntype:
            logs = logs.filter(notification_type=ntype)
        if days:
            since = timezone.now() - timedelta(days=int(days))
            logs  = logs.filter(created_at__gte=since)

        logs = logs[:200]
        data = [
            {
                "id":         n.id,
                "user":       n.user.email,
                "title":      n.title,
                "message":    n.message,
                "type":       n.notification_type,
                "is_read":    n.is_read,
                "created_at": n.created_at,
            }
            for n in logs
        ]
        return Response(data)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. BRANCH OVERVIEW
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminBranchOverviewView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        branches = Branch.objects.annotate(
            staff_count=Count("staff_members", distinct=True),
            booking_count=Count("bookings", distinct=True),
            queue_count=Count("queue_entries", distinct=True),
        )
        data = []
        for b in branches:
            revenue = Booking.objects.filter(
                branch=b, status="done"
            ).aggregate(t=Sum("price"))["t"] or 0
            data.append({
                "id":            b.id,
                "name":          b.name,
                "address":       b.address,
                "hours":         b.hours,
                "slots":         b.slots,
                "is_active":     b.is_active,
                "staff_count":   b.staff_count,
                "booking_count": b.booking_count,
                "queue_count":   b.queue_count,
                "total_revenue": float(revenue),
            })
        return Response(data)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. BROADCAST NOTIFICATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminBroadcastView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        title   = request.data.get("title", "").strip()
        message = request.data.get("message", "").strip()
        target  = request.data.get("target", "all")

        if not title or not message:
            return Response({"error": "title and message are required."}, status=400)

        users = User.objects.filter(is_active=True)

        if target == "staff":
            users = users.filter(staff_profile__isnull=False)
        elif target == "customers":
            users = users.filter(customer_profile__isnull=False)
        elif target == "branch":
            branch_id = request.data.get("branch_id")
            if not branch_id:
                return Response({"error": "branch_id is required for branch target."}, status=400)
            users = users.filter(staff_profile__branch_id=branch_id)

        notifications = [
            Notification(
                user=u,
                title=title,
                message=message,
                notification_type="broadcast",
                target_path=_notification_dashboard_path_for_user(u),
            )
            for u in users
        ]
        Notification.objects.bulk_create(notifications)

        return Response({
            "message": f"Broadcast sent to {len(notifications)} user(s).",
            "target":  target,
        })


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. CREATE SUPER ADMIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminCreateView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def post(self, request):
        email      = request.data.get("email", "").strip().lower()
        password   = request.data.get("password", "")
        first_name = request.data.get("first_name", "").strip()
        last_name  = request.data.get("last_name",  "").strip()
        phone      = request.data.get("phone", "").strip()

        if not all([email, password, first_name, last_name]):
            return Response(
                {"error": "email, password, first_name, last_name are required."},
                status=400,
            )

        if not NAME_PATTERN.fullmatch(first_name):
            return Response({"error": "First name can only contain letters and spaces."}, status=400)
        if not NAME_PATTERN.fullmatch(last_name):
            return Response({"error": "Last name can only contain letters and spaces."}, status=400)
        if len(phone) > 12:
            return Response({"error": "Phone number must not exceed 12 characters."}, status=400)
        if phone and not PHONE_PATTERN.fullmatch(phone):
            return Response({"error": "Phone number must start with +63 and contain digits only."}, status=400)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already in use."}, status=400)

        user = User.objects.create_user(
            email=email,
            password=password,
            is_staff=True,
            is_superuser=True,
            email_verified=True,
        )
        Staff.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role="super_admin",
            status="Active",
        )

        return Response(
            {"message": f"Super Admin '{email}' created successfully."},
            status=201,
        )

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 9. SYSTEM SETTINGS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 
SETTINGS_CACHE_KEY = "super_admin_system_settings"
 
SETTINGS_DEFAULTS = {
    "general": {
        "siteName": "Otokwikk",
        "siteTagline": "Your automotive companion",
        "siteMode": "live",
        "maintenanceMessage": "",
        "defaultLanguage": "en",
        "defaultTimezone": "Asia/Manila",
        "supportUrl": "https://support.otokwikk.com",
    },
    "email": {
        "mailHost": "",
        "mailPort": 587,
        "mailFrom": "",
        "supportEmail": "",
        "emailVerificationRequired": True,
        "welcomeEmailEnabled": True,
    },
    "security": {
        "requireStrongPasswords": True,
        "sessionTimeoutMinutes": 60,
        "allowTwoFactor": True,
        "maxLoginAttempts": 5,
        "lockoutDurationMinutes": 15,
        "allowGoogleOAuth": True,
        "allowFacebookOAuth": False,
    },
}
 
# ── Allowed keys per section (whitelist to prevent arbitrary key injection) ──
ALLOWED_KEYS = {
    "general": set(SETTINGS_DEFAULTS["general"].keys()),
    "email":   set(SETTINGS_DEFAULTS["email"].keys()),
    "security": set(SETTINGS_DEFAULTS["security"].keys()),
}
 
 
def _load_settings():
    """
    Load settings from cache (fast path) or fall back to DB / defaults.
    Uses Django's cache framework — works with any configured cache backend
    (memcached, Redis, local-memory, etc.).
    """
    cached = cache.get(SETTINGS_CACHE_KEY)
    if cached:
        return cached
 
    # Try to load from DB if you have a SystemSetting model.
    # For now we fall back to defaults and persist in cache only.
    # Replace this block with DB reads once you create the model.
    settings_data = _deep_copy_defaults()
    cache.set(SETTINGS_CACHE_KEY, settings_data, timeout=None)  # no expiry
    return settings_data
 
 
def _save_settings(data):
    cache.set(SETTINGS_CACHE_KEY, data, timeout=None)
    # TODO: persist to DB once SystemSetting model is available
 
 
def _deep_copy_defaults():
    import copy
    return copy.deepcopy(SETTINGS_DEFAULTS)
 
 
class SuperAdminSystemSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
 
    def get(self, request):
        """Return all current settings."""
        return Response(_load_settings())
 
    def patch(self, request):
        """
        Partial-update one or more sections.
 
        Expected body (send only the section(s) you want to update):
        {
            "general": { "siteName": "New Name", ... },
            "email":   { "mailPort": 465, ... },
            "security": { "maxLoginAttempts": 3, ... }
        }
        """
        data = _load_settings()
        errors = {}
 
        for section in ("general", "email", "security"):
            incoming = request.data.get(section)
            if not incoming:
                continue
            if not isinstance(incoming, dict):
                errors[section] = "Must be an object."
                continue
 
            # Only update whitelisted keys
            for key, value in incoming.items():
                if key in ALLOWED_KEYS[section]:
                    data[section][key] = value
                # Silently ignore unknown keys
 
        if errors:
            return Response({"errors": errors}, status=400)
 
        _save_settings(data)
        return Response({"message": "Settings saved successfully.", "settings": data})
    
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 10. PLUGIN MANAGEMENT
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class SuperAdminPluginView(APIView):
    """Manage plugins - list, install, update, uninstall"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        """List all plugins with their status and settings"""
        plugins = Plugin.objects.all()
        
        # Get counts by status
        status_counts = {
            "active": plugins.filter(status="active").count(),
            "inactive": plugins.filter(status="inactive").count(),
            "needs_update": plugins.filter(status="needs_update").count(),
            "error": plugins.filter(status="error").count(),
        }
        
        data = {
            "plugins": [
                {
                    "id": p.id,
                    "name": p.name,
                    "slug": p.slug,
                    "description": p.description,
                    "version": p.version,
                    "author": p.author,
                    "website": p.website,
                    "category": p.category,
                    "status": p.status,
                    "is_active": p.is_active,
                    "is_system": p.is_system,
                    "settings": p.settings,
                    "dependencies": p.dependencies,
                    "conflicts": p.conflicts,
                    "installed_at": p.installed_at,
                    "updated_at": p.updated_at,
                    "accessible_by_roles": p.accessible_by_roles,
                }
                for p in plugins
            ],
            "status_counts": status_counts,
            "categories": dict(Plugin.PLUGIN_CATEGORIES),
        }
        return Response(data)
    
    def post(self, request):
        """Install a new plugin"""
        name = request.data.get("name")
        slug = request.data.get("slug")
        description = request.data.get("description", "")
        version = request.data.get("version", "1.0.0")
        author = request.data.get("author", "")
        website = request.data.get("website", "")
        category = request.data.get("category", "other")
        
        if not name or not slug:
            return Response({"error": "name and slug are required"}, status=400)
        
        if Plugin.objects.filter(slug=slug).exists():
            return Response({"error": f"Plugin with slug '{slug}' already exists"}, status=400)
        
        # Get current staff user
        staff = Staff.objects.get(user=request.user)
        
        plugin = Plugin.objects.create(
            name=name,
            slug=slug,
            description=description,
            version=version,
            author=author,
            website=website,
            category=category,
            status="installed",
            installed_by=staff,
        )
        
        # Log the installation
        PluginLog.objects.create(
            plugin=plugin,
            action="install",
            message=f"Plugin {name} v{version} installed",
            performed_by=staff,
        )
        
        return Response({
            "message": f"Plugin '{name}' installed successfully",
            "plugin": {
                "id": plugin.id,
                "name": plugin.name,
                "slug": plugin.slug,
                "status": plugin.status,
            }
        }, status=201)


class SuperAdminPluginDetailView(APIView):
    """Manage a specific plugin - activate, deactivate, update, uninstall, configure"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get_plugin(self, pk):
        try:
            return Plugin.objects.get(pk=pk)
        except Plugin.DoesNotExist:
            return None
    
    def get(self, request, pk):
        """Get detailed info for a specific plugin"""
        plugin = self.get_plugin(pk)
        if not plugin:
            return Response({"error": "Plugin not found"}, status=404)
        
        # Get plugin logs
        logs = plugin.logs.all()[:50]
        
        return Response({
            "id": plugin.id,
            "name": plugin.name,
            "slug": plugin.slug,
            "description": plugin.description,
            "version": plugin.version,
            "author": plugin.author,
            "website": plugin.website,
            "category": plugin.category,
            "status": plugin.status,
            "is_active": plugin.is_active,
            "is_system": plugin.is_system,
            "settings": plugin.settings,
            "dependencies": plugin.dependencies,
            "conflicts": plugin.conflicts,
            "installed_at": plugin.installed_at,
            "updated_at": plugin.updated_at,
            "accessible_by_roles": plugin.accessible_by_roles,
            "logs": [
                {
                    "action": log.action,
                    "message": log.message,
                    "performed_by": str(log.performed_by) if log.performed_by else "System",
                    "created_at": log.created_at,
                }
                for log in logs
            ],
        })
    
    def patch(self, request, pk):
        """Update plugin status (activate/deactivate) or settings"""
        plugin = self.get_plugin(pk)
        if not plugin:
            return Response({"error": "Plugin not found"}, status=404)
        
        staff = Staff.objects.get(user=request.user)
        action_taken = None
        message = ""
        
        # Handle activation/deactivation
        if "action" in request.data:
            action = request.data["action"]
            
            try:
                if action == "activate":
                    plugin.activate()
                    action_taken = "activate"
                    message = f"Plugin '{plugin.name}' activated"
                elif action == "deactivate":
                    plugin.deactivate()
                    action_taken = "deactivate"
                    message = f"Plugin '{plugin.name}' deactivated"
                else:
                    return Response({"error": f"Invalid action: {action}"}, status=400)
            except ValueError as e:
                return Response({"error": str(e)}, status=400)
        
        # Handle settings update
        if "settings" in request.data:
            plugin.update_settings(request.data["settings"])
            action_taken = "config_change"
            message = f"Plugin '{plugin.name}' settings updated"
        
        # Handle version update
        if "version" in request.data:
            old_version = plugin.version
            plugin.version = request.data["version"]
            plugin.save()
            action_taken = "update"
            message = f"Plugin '{plugin.name}' updated from v{old_version} to v{plugin.version}"
        
        if action_taken:
            PluginLog.objects.create(
                plugin=plugin,
                action=action_taken,
                message=message,
                performed_by=staff,
                metadata=request.data,
            )
        
        return Response({
            "message": message or "Plugin updated",
            "plugin": {
                "id": plugin.id,
                "name": plugin.name,
                "status": plugin.status,
                "is_active": plugin.is_active,
                "settings": plugin.settings,
                "version": plugin.version,
            }
        })
    
    def delete(self, request, pk):
        """Uninstall a plugin"""
        plugin = self.get_plugin(pk)
        if not plugin:
            return Response({"error": "Plugin not found"}, status=404)
        
        if plugin.is_system:
            return Response({"error": "System plugins cannot be uninstalled"}, status=400)
        
        staff = Staff.objects.get(user=request.user)
        plugin_name = plugin.name
        
        # Log before deletion
        PluginLog.objects.create(
            plugin=plugin,
            action="uninstall",
            message=f"Plugin '{plugin_name}' uninstalled",
            performed_by=staff,
        )
        
        plugin.delete()
        
        return Response({"message": f"Plugin '{plugin_name}' uninstalled successfully"}, status=204)
    
class SuperAdminAuditLogsView(APIView):
    """Get system audit logs"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        from api.models import Notification
        from django.utils import timezone
        from datetime import timedelta
        
        logs = Notification.objects.filter(
            notification_type__in=['system', 'security', 'admin']
        ).select_related('user').order_by('-created_at')
        
        user_id = request.query_params.get('user_id')
        log_type = request.query_params.get('type')
        days = request.query_params.get('days')
        
        if user_id:
            logs = logs.filter(user_id=user_id)
        if log_type:
            logs = logs.filter(notification_type=log_type)
        if days:
            since = timezone.now() - timedelta(days=int(days))
            logs = logs.filter(created_at__gte=since)
        
        logs = logs[:500]
        
        data = [{
            'id': log.id,
            'title': log.title,
            'user': log.user.email if log.user else 'System',
            'type': log.notification_type,
            'status': 'success' if 'success' in log.title.lower() or 'completed' in log.title.lower() else 'info',
            'created_at': log.created_at,
            'message': log.message,
            'ip_address': getattr(log, 'ip_address', 'N/A')
        } for log in logs]
        
        return Response(data)


class SuperAdminUserActionsView(APIView):
    """Get user action logs"""
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        from api.models import Notification
        from django.utils import timezone
        from datetime import timedelta
        
        actions = Notification.objects.filter(
            notification_type__in=['user_action', 'profile', 'authentication']
        ).select_related('user').order_by('-created_at')
        
        user_id = request.query_params.get('user_id')
        days = request.query_params.get('days')
        
        if user_id:
            actions = actions.filter(user_id=user_id)
        if days:
            since = timezone.now() - timedelta(days=int(days))
            actions = actions.filter(created_at__gte=since)
        
        actions = actions[:500]
        
        data = [{
            'id': action.id,
            'title': action.title,
            'user': action.user.email if action.user else 'Unknown',
            'type': action.notification_type,
            'status': 'success' if 'success' in action.title.lower() or 'completed' in action.title.lower() else 'info',
            'created_at': action.created_at,
            'message': action.message,
            'ip_address': getattr(action, 'ip_address', 'N/A')
        } for action in actions]
        
        return Response(data)
