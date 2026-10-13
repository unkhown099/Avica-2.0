# api/views/business_owner_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import timedelta, date, datetime
from calendar import month_abbr

from ..models import Branch, Booking, QueueEntry, Service, InventoryItem, Staff, Rating, PaymentTransaction
from ..serializers.business_owner_serializers import (
    BranchSummarySerializer,
    OwnerAppointmentSerializer,
    OwnerServiceSerializer,
    OwnerInventorySerializer,
    OwnerStaffSerializer,
)

OWNER_ROLES = ["Admin", "Business Owner", "business_owner", "owner", "super_admin"]


def _require_owner(request):
    """
    Validates that the authenticated user is an authorized owner or administrator:
    Allowed: 'Admin', 'Business Owner', 'super_admin' (or user.is_superuser).
    Denied (403): Branch Manager, Staff (Cashier), Employee, Inventory, Customer.
    """
    if not request.user or not request.user.is_authenticated:
        return False, None
    if getattr(request.user, "is_superuser", False):
        return True, "superuser"
    try:
        if not hasattr(request.user, "staff_profile"):
            return False, None
        role = str(request.user.staff_profile.role or "").strip()
        normalized = role.lower().replace(" ", "_")
        allowed = normalized in {"admin", "business_owner", "owner", "super_admin"}
        return allowed, role
    except Exception:
        return False, None


def _month_start(offset=0):
    """Return the first day of the current month, or `offset` months ago."""
    today = timezone.now().date()
    month = today.month - offset
    year  = today.year
    while month <= 0:
        month += 12
        year  -= 1
    return today.replace(year=year, month=month, day=1)


def _month_start_dt(offset=0):
    """Return the start of month as a timezone-aware datetime."""
    d = _month_start(offset)
    return timezone.make_aware(datetime(d.year, d.month, d.day, 0, 0, 0))


# ── Dashboard Stats ───────────────────────────────────────────────────────────
class OwnerDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            this_month_dt = _month_start_dt(0)
            last_month_dt = _month_start_dt(1)
            this_month_date = this_month_dt.date()
            last_month_date = last_month_dt.date()

            payment_scope = PaymentTransaction.objects.all()
            rev_total = payment_scope.aggregate(t=Sum("amount"))["t"] or 0
            if not rev_total:
                rev_total = QueueEntry.objects.filter(payment_status="paid").aggregate(t=Sum("price"))["t"] or 0

            rev_this = payment_scope.filter(
                paid_at__gte=this_month_dt,
            ).aggregate(t=Sum("amount"))["t"] or 0
            if not rev_this:
                rev_this = QueueEntry.objects.filter(
                    payment_status="paid",
                    completed_at__gte=this_month_dt,
                ).aggregate(t=Sum("price"))["t"] or 0

            rev_last = payment_scope.filter(
                paid_at__gte=last_month_dt,
                paid_at__lt=this_month_dt,
            ).aggregate(t=Sum("amount"))["t"] or 0
            if not rev_last:
                rev_last = QueueEntry.objects.filter(
                    payment_status="paid",
                    completed_at__gte=last_month_dt,
                    completed_at__lt=this_month_dt,
                ).aggregate(t=Sum("price"))["t"] or 0

            rev_change = (
                round(((float(rev_this) - float(rev_last)) / float(rev_last)) * 100, 1)
                if rev_last else 0
            )

            # Services completed (align with done queue entries + done bookings without double-counting)
            svc_total = QueueEntry.objects.filter(status="done").count()
            svc_total += Booking.objects.filter(status="done").exclude(queue_entry__status="done").count()

            svc_this = QueueEntry.objects.filter(status="done", completed_at__gte=this_month_dt).count()
            svc_this += Booking.objects.filter(status="done", date__gte=this_month_date).exclude(
                queue_entry__status="done",
                queue_entry__completed_at__gte=this_month_dt,
            ).count()

            svc_last = QueueEntry.objects.filter(
                status="done", completed_at__gte=last_month_dt, completed_at__lt=this_month_dt
            ).count()
            svc_last += Booking.objects.filter(status="done", date__gte=last_month_date, date__lt=this_month_date).exclude(
                queue_entry__status="done",
                queue_entry__completed_at__gte=last_month_dt,
                queue_entry__completed_at__lt=this_month_dt,
            ).count()

            svc_change = (
                round(((svc_this - svc_last) / svc_last) * 100, 1)
                if svc_last else 0
            )

            # Satisfaction (1-5 → %)
            sat_this_qs = Rating.objects.filter(created_at__gte=this_month_dt)
            sat_last_qs = Rating.objects.filter(
                created_at__gte=last_month_dt,
                created_at__lt=this_month_dt,
            )
            sat_this = sat_this_qs.aggregate(a=Avg("score"))["a"]
            if sat_this is None:
                sat_this = Rating.objects.all().aggregate(a=Avg("score"))["a"]
            sat_last = sat_last_qs.aggregate(a=Avg("score"))["a"]

            sat_pct  = float(round((float(sat_this) / 5) * 100, 1)) if sat_this else None
            sat_prev = float(round((float(sat_last) / 5) * 100, 1)) if sat_last else None
            sat_change = (
                float(round(sat_pct - sat_prev, 1))
                if sat_pct is not None and sat_prev is not None
                else None
            )

            return Response({
                "total_revenue":          float(rev_total),
                "revenue_change_pct":     rev_change,
                "total_customers":        Booking.objects.filter(user_id__isnull=False).values("user_id").distinct().count(),
                "total_branches":         Branch.objects.filter(is_active=True).count(),
                "services_completed":     svc_total,
                "services_change_pct":    svc_change,
                "avg_satisfaction":       sat_pct,
                "satisfaction_change_pct": sat_change,
            })


    # ── Revenue Trend (last 6 months) ─────────────────────────────────────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerRevenueTrendView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            now = timezone.now()
            current_year = now.year
            current_month = now.month
            points = []
            for month in range(1, current_month + 1):
                start_dt = timezone.make_aware(datetime(current_year, month, 1, 0, 0, 0))
                if month == 12:
                    end_dt = timezone.make_aware(datetime(current_year + 1, 1, 1, 0, 0, 0))
                else:
                    end_dt = timezone.make_aware(datetime(current_year, month + 1, 1, 0, 0, 0))

                rev = PaymentTransaction.objects.filter(
                    paid_at__gte=start_dt,
                    paid_at__lt=end_dt,
                ).aggregate(t=Sum("amount"))["t"]
                if rev is None or rev == 0:
                    rev = QueueEntry.objects.filter(
                        payment_status="paid",
                        completed_at__gte=start_dt,
                        completed_at__lt=end_dt,
                    ).aggregate(t=Sum("price"))["t"] or 0

                cnt = QueueEntry.objects.filter(
                    status="done",
                    completed_at__gte=start_dt,
                    completed_at__lt=end_dt,
                ).count()
                cnt += Booking.objects.filter(
                    status="done",
                    date__gte=start_dt.date(),
                    date__lt=end_dt.date(),
                ).exclude(
                    queue_entry__status="done",
                    queue_entry__completed_at__gte=start_dt,
                    queue_entry__completed_at__lt=end_dt,
                ).count()

                points.append({
                    "label":    f"{month_abbr[month]} {current_year}",
                    "revenue":  float(rev or 0),
                    "services": cnt,
                })

            return Response(points)


    # ── Branch Revenue Distribution ───────────────────────────────────────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerBranchRevenueView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            branches = Branch.objects.filter(is_active=True)
            data = []
            for b in branches:
                rev = PaymentTransaction.objects.filter(
                    branch=b,
                ).aggregate(t=Sum("amount"))["t"]
                if rev is None or rev == 0:
                    rev = QueueEntry.objects.filter(
                        branch=b,
                        payment_status="paid",
                    ).aggregate(t=Sum("price"))["t"] or 0
                data.append({"id": b.id, "name": b.name, "revenue": float(rev or 0)})

            return Response(data)


    # ── Branches List ─────────────────────────────────────────────────────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerBranchListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            branches = Branch.objects.filter(is_active=True).prefetch_related(
                "staff_members", "bookings", "ratings"
            )
            serializer = BranchSummarySerializer(branches, many=True)
            return Response(serializer.data)


    # ── Appointments ──────────────────────────────────────────────────────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerAppointmentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            qs = Booking.objects.select_related("branch", "user__customer_profile").all()

            branch_id     = request.query_params.get("branch")
            schedule_view = request.query_params.get("schedule_view")
            start_date    = request.query_params.get("start_date")
            end_date      = request.query_params.get("end_date")
            date          = request.query_params.get("date")
            year          = request.query_params.get("year")
            status        = request.query_params.get("status")
            service       = request.query_params.get("service")
            search        = (request.query_params.get("search") or "").strip()

            if branch_id and branch_id != "all":
                if str(branch_id).isdigit():
                    qs = qs.filter(branch_id=int(branch_id))
                else:
                    qs = qs.filter(branch__name__iexact=str(branch_id))

            today = timezone.localtime().date()

            if schedule_view in ["two_weeks", "previous_two_weeks"]:
                two_weeks_ago = today - timedelta(days=14)
                qs = qs.filter(date__gte=two_weeks_ago, date__lte=today)
            elif schedule_view in ["year", "current_year"]:
                target_year = int(year) if (year and str(year).isdigit()) else today.year
                qs = qs.filter(date__year=target_year)
            elif start_date and end_date:
                try:
                    sd = datetime.strptime(start_date, "%Y-%m-%d").date()
                    ed = datetime.strptime(end_date, "%Y-%m-%d").date()
                    qs = qs.filter(date__gte=sd, date__lte=ed)
                except ValueError:
                    pass
            elif date:
                qs = qs.filter(date=date)
            elif not search:
                # Default: current month if neither date, schedule_view nor search specified
                qs = qs.filter(date__gte=_month_start(0))

            if status and status != "all":
                qs = qs.filter(status=status)
            if service and service != "all":
                qs = qs.filter(service__icontains=service)
            if search:
                qs = qs.filter(
                    Q(user__customer_profile__first_name__icontains=search)
                    | Q(user__customer_profile__last_name__icontains=search)
                    | Q(user__email__icontains=search)
                    | Q(plate_number__icontains=search)
                    | Q(vehicle__icontains=search)
                    | Q(service__icontains=search)
                )

            serializer = OwnerAppointmentSerializer(qs.order_by("date", "time"), many=True)
            return Response(serializer.data)


    # ── Appointment monthly summary (counts per day for calendar dots) ─────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerAppointmentCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            branch_id = request.query_params.get("branch")
            month_str = request.query_params.get("month")  # YYYY-MM

            try:
                if month_str:
                    year, month = map(int, month_str.split("-"))
                else:
                    today = timezone.now().date()
                    year, month = today.year, today.month
            except Exception:
                return Response({"detail": "Invalid month format. Use YYYY-MM."}, status=400)

            qs = Booking.objects.filter(date__year=year, date__month=month)
            if branch_id:
                qs = qs.filter(branch_id=branch_id)

            # Group by day + status
            from django.db.models.functions import ExtractDay
            rows = (
                qs.annotate(day=ExtractDay("date"))
                  .values("day", "status")
                  .annotate(count=Count("id"))
            )

            # Build dict: {day: [status, ...]}
            calendar: dict = {}
            for row in rows:
                d = row["day"]
                if d not in calendar:
                    calendar[d] = []
                calendar[d].extend([row["status"]] * row["count"])

            return Response(calendar)


    # ── Services ──────────────────────────────────────────────────────────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerServiceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            branch_param = request.query_params.get("branch")
            validated_branch_id = None

            if branch_param and branch_param.strip() not in {"", "All Branches", "all"}:
                try:
                    validated_branch_id = int(branch_param.strip())
                    if validated_branch_id <= 0:
                        return Response(
                            {"detail": "Branch ID must be a positive integer."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    if not Branch.objects.filter(id=validated_branch_id).exists():
                        return Response(
                            {"detail": f"Branch with id {validated_branch_id} does not exist."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                except (ValueError, TypeError):
                    return Response(
                        {"detail": f"Invalid branch ID '{branch_param}'. Expected a numeric ID."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

            performance_mode = str(request.query_params.get("performance", "")).lower() in {"1", "true", "yes"}
            if performance_mode:
                perf_qs = PaymentTransaction.objects.all()
                if validated_branch_id is not None:
                    perf_qs = perf_qs.filter(branch_id=validated_branch_id)

                top_services = (
                    perf_qs.values("transaction_type", "description")
                    .annotate(count=Count("id"), revenue=Sum("amount"))
                    .order_by("-revenue", "-count")
                )
                data = [
                    {
                        "service": row["description"] or str(row["transaction_type"]).replace("_", " ").title(),
                        "count": int(row["count"] or 0),
                        "revenue": float(row["revenue"] or 0),
                        "avg_time": "—",
                    }
                    for row in top_services
                ]
                return Response(data)

            qs = Service.objects.prefetch_related("branches").filter(is_active=True)

            category = request.query_params.get("category")
            search   = request.query_params.get("search")

            if category and category.strip() not in {"", "All Categories", "all"}:
                qs = qs.filter(category=category.strip())
            if validated_branch_id is not None:
                qs = qs.filter(branches__id=validated_branch_id)
            if search:
                qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))

            serializer = OwnerServiceSerializer(qs.distinct(), many=True)
            return Response(serializer.data)


    # ── Inventory ─────────────────────────────────────────────────────────────────

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
class OwnerInventoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            qs = InventoryItem.objects.select_related("branch").filter(is_active=True)

            branch_id    = request.query_params.get("branch")
            category     = request.query_params.get("category")
            search       = request.query_params.get("search")
            status_param = request.query_params.get("status")  # "low" | "out"

            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            if category:
                qs = qs.filter(category=category)
            if search:
                qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))

            serializer = OwnerInventorySerializer(qs.order_by("branch__name", "name"), many=True)
            data = list(serializer.data)

            # Filter by computed status after serialization
            if status_param == "low":
                data = [i for i in data if i["status"] == "Low Stock"]
            elif status_param == "out":
                data = [i for i in data if i["status"] == "Out of Stock"]
            elif status_param == "alert":
                data = [i for i in data if i["status"] in ("Low Stock", "Out of Stock")]

            return Response(data)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)


class OwnerStaffListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            qs = Staff.objects.select_related("branch", "user").all()

            # Apply filters
            search = request.query_params.get("search")
            role = request.query_params.get("role")
            branch_id = request.query_params.get("branch")
            status = request.query_params.get("status")

            if search:
                qs = qs.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(user__email__icontains=search)
                )
            if role and role != "All Roles":
                qs = qs.filter(role=role)
            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            if status:
                # Filter by the status field (Active/Inactive)
                qs = qs.filter(status=status)

            serializer = OwnerStaffSerializer(qs, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)

class OwnerStaffDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            staff = Staff.objects.select_related("user").get(pk=pk)
            
            new_status = request.data.get("status")
            if new_status in ["Active", "Inactive"]:
                staff.status = new_status
                staff.user.is_active = (new_status == "Active")
                staff.user.save()
                staff.save()
            
            serializer = OwnerStaffSerializer(staff)
            return Response(serializer.data)
        except Staff.DoesNotExist:
            return Response({"detail": "Staff not found."}, status=404)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"detail": f"Server Error: {str(e)}"}, status=500)
