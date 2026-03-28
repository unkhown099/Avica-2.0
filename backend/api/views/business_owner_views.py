# api/views/business_owner_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Count, Q
from django.utils import timezone
from datetime import timedelta, date
from calendar import month_abbr

from ..models import Branch, Booking, QueueEntry, Service, InventoryItem, Staff, Rating
from ..serializers.business_owner_serializers import (
    BranchSummarySerializer,
    OwnerAppointmentSerializer,
    OwnerServiceSerializer,
    OwnerInventorySerializer,
    OwnerStaffSerializer,
)

OWNER_ROLES = ["Admin", "Business Owner", "business_owner", "owner"]


def _require_owner(request):
    try:
        if not hasattr(request.user, "staff_profile"):
            print(f"[_require_owner] user {request.user.email} has no staff_profile")
            return False, None
        role = str(request.user.staff_profile.role or "").strip()
        normalized = role.lower().replace(" ", "_")
        allowed = normalized in {"admin", "business_owner", "owner"}
        print(f"[_require_owner] checking role {role} ({normalized})")
        return allowed, role
    except Exception as e:
        print(f"[_require_owner] Exception: {e}")
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


# ── Dashboard Stats ───────────────────────────────────────────────────────────
class OwnerDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            ok, _ = _require_owner(request)
            if not ok:
                return Response({"detail": "Permission denied."}, status=403)

            this_month  = _month_start(0)
            last_month  = _month_start(1)

            # Revenue (align with admin: total paid revenue)
            rev_total = QueueEntry.objects.filter(
                payment_status="paid",
            ).aggregate(t=Sum("price"))["t"] or 0

            rev_this = QueueEntry.objects.filter(
                payment_status="paid",
                completed_at__date__gte=this_month,
            ).aggregate(t=Sum("price"))["t"] or 0

            rev_last = QueueEntry.objects.filter(
                payment_status="paid",
                completed_at__date__gte=last_month,
                completed_at__date__lt=this_month,
            ).aggregate(t=Sum("price"))["t"] or 0

            rev_change = (
                round(((float(rev_this) - float(rev_last)) / float(rev_last)) * 100, 1)
                if rev_last else 0
            )

            # Services completed (align with admin: total done queue entries)
            svc_total = QueueEntry.objects.filter(status="done").count()
            svc_this = QueueEntry.objects.filter(status="done", completed_at__date__gte=this_month).count()
            svc_last = QueueEntry.objects.filter(
                status="done", completed_at__date__gte=last_month, completed_at__date__lt=this_month
            ).count()
            svc_change = (
                round(((svc_this - svc_last) / svc_last) * 100, 1)
                if svc_last else 0
            )

            # Satisfaction (1-5 → %)
            sat_this_qs = Rating.objects.filter(created_at__date__gte=this_month)
            sat_last_qs = Rating.objects.filter(
                created_at__date__gte=last_month,
                created_at__date__lt=this_month,
            )
            sat_this = sat_this_qs.aggregate(a=Avg("score"))["a"]
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
                start = date(current_year, month, 1)
                if month == 12:
                    end = date(current_year + 1, 1, 1)
                else:
                    end = date(current_year, month + 1, 1)

                rev = QueueEntry.objects.filter(
                    payment_status="paid",
                    completed_at__date__gte=start,
                    completed_at__date__lt=end,
                ).aggregate(t=Sum("price"))["t"] or 0

                cnt = QueueEntry.objects.filter(
                    status="done",
                    completed_at__date__gte=start,
                    completed_at__date__lt=end,
                ).count()

                points.append({
                    "label":    f"{month_abbr[month]} {current_year}",
                    "revenue":  float(rev),
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
                rev = QueueEntry.objects.filter(
                    branch=b,
                    payment_status="paid",
                ).aggregate(t=Sum("price"))["t"] or 0
                data.append({"id": b.id, "name": b.name, "revenue": float(rev)})

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

            branch_id = request.query_params.get("branch")
            date      = request.query_params.get("date")
            status    = request.query_params.get("status")

            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            if date:
                qs = qs.filter(date=date)
            if status:
                qs = qs.filter(status=status)

            # Default: current month
            if not date:
                qs = qs.filter(date__gte=_month_start(0))

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

            performance_mode = str(request.query_params.get("performance", "")).lower() in {"1", "true", "yes"}
            if performance_mode:
                branch_id = request.query_params.get("branch")
                perf_qs = QueueEntry.objects.filter(status="done", payment_status="paid")
                if branch_id:
                    perf_qs = perf_qs.filter(branch_id=branch_id)

                top_services = (
                    perf_qs.values("service")
                    .annotate(count=Count("id"), revenue=Sum("price"))
                    .order_by("-revenue", "-count")
                )
                data = [
                    {
                        "service": row["service"] or "Other",
                        "count": int(row["count"] or 0),
                        "revenue": float(row["revenue"] or 0),
                        "avg_time": "—",
                    }
                    for row in top_services
                ]
                return Response(data)

            qs = Service.objects.prefetch_related("branches").filter(is_active=True)

            category  = request.query_params.get("category")
            branch_id = request.query_params.get("branch")
            search    = request.query_params.get("search")

            if category:
                qs = qs.filter(category=category)
            if branch_id:
                qs = qs.filter(branches__id=branch_id)
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

            branch_id = request.query_params.get("branch")
            category  = request.query_params.get("category")
            search    = request.query_params.get("search")
            status    = request.query_params.get("status")  # "low" | "out"

            if branch_id:
                qs = qs.filter(branch_id=branch_id)
            if category:
                qs = qs.filter(category=category)
            if search:
                qs = qs.filter(Q(name__icontains=search) | Q(sku__icontains=search))

            serializer = OwnerInventorySerializer(qs.order_by("branch__name", "name"), many=True)
            data = serializer.data

            # Filter by computed status after serialization
            if status == "low":
                data = [i for i in data if i["status"] == "Low Stock"]
            elif status == "out":
                data = [i for i in data if i["status"] == "Out of Stock"]
            elif status == "alert":
                data = [i for i in data if i["status"] in ("Low Stock", "Out of Stock")]

            return Response(data)

    # ── Staff Management ─────────────────────────────────────────────────────────────

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
