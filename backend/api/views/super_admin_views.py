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
    Service, InventoryItem, Notification
)
from api.permissions import IsSuperAdmin

User = get_user_model()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. OVERVIEW DASHBOARD
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class SuperAdminDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        today = timezone.now().date()
        this_month_start = today.replace(day=1)

        # ── Basic counts ──────────────────────────────────────────────────────
        total_users     = User.objects.count()
        total_staff     = Staff.objects.count()
        total_customers = Customer.objects.count()
        total_branches  = Branch.objects.count()
        total_services  = Service.objects.count()

        # ── Bookings ──────────────────────────────────────────────────────────
        total_bookings      = Booking.objects.count()
        bookings_today      = Booking.objects.filter(date=today).count()
        bookings_this_month = Booking.objects.filter(date__gte=this_month_start).count()

        # ── Revenue ───────────────────────────────────────────────────────────
        revenue_total = Booking.objects.filter(
            status="done"
        ).aggregate(total=Sum("price"))["total"] or 0

        revenue_this_month = Booking.objects.filter(
            status="done", date__gte=this_month_start
        ).aggregate(total=Sum("price"))["total"] or 0

        # ── Staff by role ─────────────────────────────────────────────────────
        staff_by_role = list(
            Staff.objects.values("role").annotate(count=Count("id")).order_by("-count")
        )

        # ── Queue & inventory ─────────────────────────────────────────────────
        active_queue  = QueueEntry.objects.filter(status__in=["waiting", "in_service"]).count()
        low_inventory = InventoryItem.objects.filter(
            is_active=True, quantity__lte=F("minimum_qty")
        ).count()

        # ── Monthly revenue — last 7 months ───────────────────────────────────
        seven_months_ago = _months_ago(today, 6)

        monthly_revenue_qs = (
            Booking.objects
            .filter(status="done", date__gte=seven_months_ago)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Sum("price"))
            .order_by("month")
        )
        monthly_revenue_labels, monthly_revenue_data = _fill_months(
            monthly_revenue_qs, "total", today, 7
        )

        # ── Monthly bookings — last 7 months ──────────────────────────────────
        monthly_bookings_qs = (
            Booking.objects
            .filter(date__gte=seven_months_ago)
            .annotate(month=TruncMonth("date"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )
        monthly_bookings_labels, monthly_bookings_data = _fill_months(
            monthly_bookings_qs, "total", today, 7
        )

        # ── Monthly new customers — last 7 months ─────────────────────────────
        monthly_customers_qs = (
            User.objects
            .filter(
                customer_profile__isnull=False,
                created_at__date__gte=seven_months_ago
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )
        _, monthly_customers_data = _fill_months(monthly_customers_qs, "total", today, 7)

        # ── Monthly new staff — last 7 months ─────────────────────────────────
        monthly_staff_qs = (
            User.objects
            .filter(
                staff_profile__isnull=False,
                created_at__date__gte=seven_months_ago
            )
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )
        _, monthly_staff_data = _fill_months(monthly_staff_qs, "total", today, 7)

        # ── Revenue by branch ─────────────────────────────────────────────────
        branch_revenue_qs = (
            Booking.objects
            .filter(status="done")
            .values("branch__name")
            .annotate(total=Sum("price"))
            .order_by("branch__name")
        )
        branches_list       = [b["branch__name"] or "Unknown" for b in branch_revenue_qs]
        revenue_by_branch   = [float(b["total"] or 0)          for b in branch_revenue_qs]

        # ── Queue by branch ───────────────────────────────────────────────────
        queue_by_branch_qs = (
            QueueEntry.objects
            .filter(status__in=["waiting", "in_service"])
            .values("branch__name")
            .annotate(total=Count("id"))
            .order_by("branch__name")
        )
        queue_branches_list = [b["branch__name"] or "Unknown" for b in queue_by_branch_qs]
        queue_by_branch     = [b["total"]                      for b in queue_by_branch_qs]

        # ── Daily bookings — last 30 days ─────────────────────────────────────
        thirty_days_ago = today - timedelta(days=29)
        daily_bookings_qs = (
            Booking.objects
            .filter(date__gte=thirty_days_ago)
            .annotate(day=TruncDate("date"))
            .values("day")
            .annotate(total=Count("id"))
            .order_by("day")
        )
        daily_labels, daily_bookings_data = _fill_days(daily_bookings_qs, today)

        # ── Bookings by status ────────────────────────────────────────────────
        bookings_by_status_qs = (
            Booking.objects.values("status").annotate(count=Count("id"))
        )
        bookings_by_status = [b["count"] for b in bookings_by_status_qs]
        bookings_status_labels = [b["status"] for b in bookings_by_status_qs]

        # ── Services by name (top 5) ──────────────────────────────────────────
        # FIX: Query Booking model since Service doesn't have booking relationship
        services_qs = (
            Booking.objects
            .values("service")
            .annotate(total=Count("id"))
            .order_by("-total")[:5]
        )
        service_names = [s["service"] for s in services_qs]
        service_counts = [s["total"] for s in services_qs]

        return Response({
            # ── Core stats ────────────────────────────────────────────────────
            "users": {
                "total":     total_users,
                "staff":     total_staff,
                "customers": total_customers,
            },
            "branches":             total_branches,
            "services":             total_services,
            "bookings": {
                "total":      total_bookings,
                "today":      bookings_today,
                "this_month": bookings_this_month,
            },
            "revenue": {
                "total":      float(revenue_total),
                "this_month": float(revenue_this_month),
            },
            "staff_by_role":        staff_by_role,
            "active_queue_entries": active_queue,
            "low_stock_items":      low_inventory,

            # ── Chart data ────────────────────────────────────────────────────
            "chart_labels":          monthly_revenue_labels,   # shared x-axis labels
            "monthly_revenue":       monthly_revenue_data,
            "monthly_bookings":      monthly_bookings_data,
            "monthly_customers":     monthly_customers_data,
            "monthly_staff":         monthly_staff_data,
            "branches_list":         branches_list,
            "revenue_by_branch":     revenue_by_branch,
            "queue_branches_list":   queue_branches_list,
            "queue_by_branch":       queue_by_branch,
            "daily_labels":          daily_labels,
            "daily_bookings":        daily_bookings_data,
            "bookings_status_labels": bookings_status_labels,
            "bookings_by_status":    bookings_by_status,
            "service_names":         service_names,
            "service_counts":        service_counts,
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
            Notification(user=u, title=title, message=message, notification_type="broadcast")
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