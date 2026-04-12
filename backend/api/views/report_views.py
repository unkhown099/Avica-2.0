import csv
import logging
import re
from calendar import month_abbr
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.db.models import Count, Sum
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Branch, InventoryTransaction, PaymentTransaction, QueueEntry, ReportRun, Staff
from api.serializers.report_serializer import ReportGenerateRequestSerializer, ReportRunSerializer


ALLOWED_REPORT_ROLES = {"Admin", "Business Owner", "super_admin", "Super Admin", "Branch Manager"}
WEEKDAY_NAMES = {
    1: "Sunday",
    2: "Monday",
    3: "Tuesday",
    4: "Wednesday",
    5: "Thursday",
    6: "Friday",
    7: "Saturday",
}
logger = logging.getLogger(__name__)


def _get_requester_staff(user):
    try:
        return user.staff_profile
    except Staff.DoesNotExist:
        return None


def _resolve_period_range(period_type):
    now = timezone.now()
    today = now.date()
    if period_type == "weekly":
        return now - timedelta(days=7), now
    if period_type == "monthly":
        return datetime(today.year, today.month, 1, tzinfo=now.tzinfo), now
    if period_type == "quarterly":
        quarter_start_month = ((today.month - 1) // 3) * 3 + 1
        return datetime(today.year, quarter_start_month, 1, tzinfo=now.tzinfo), now
    if period_type == "yearly":
        return datetime(today.year, 1, 1, tzinfo=now.tzinfo), now
    return now - timedelta(days=30), now


def _resolve_previous_period(period_type, start_dt, end_dt):
    if period_type == "weekly":
        return start_dt - timedelta(days=7), start_dt
    if period_type == "monthly":
        month = start_dt.month - 1
        year = start_dt.year
        if month == 0:
            month = 12
            year -= 1
        prev_start = start_dt.replace(year=year, month=month, day=1)
        return prev_start, start_dt
    if period_type == "quarterly":
        month = start_dt.month - 3
        year = start_dt.year
        while month <= 0:
            month += 12
            year -= 1
        prev_start = start_dt.replace(year=year, month=month, day=1)
        return prev_start, start_dt
    if period_type == "yearly":
        prev_start = start_dt.replace(year=start_dt.year - 1, month=1, day=1)
        return prev_start, start_dt

    span = end_dt - start_dt
    return start_dt - span, start_dt


def _safe_pct_change(current, previous):
    current = float(current or 0)
    previous = float(previous or 0)
    if previous <= 0:
        return 0.0
    return round(((current - previous) / previous) * 100, 2)


def _extract_pos_product_sale_amount(notes):
    text = str(notes or "")
    marker = "[POS Product Sale]"
    if marker not in text:
        return 0.0
    tail = text.split(marker, 1)[1].strip()
    match = re.search(r"([0-9]+(?:\.[0-9]+)?)", tail)
    if not match:
        return 0.0
    try:
        return float(match.group(1))
    except (TypeError, ValueError):
        return 0.0


def _compute_dashboard_equivalent_total(queue_qs, start_dt, end_dt, branch=None):
    queue_total = float(
        queue_qs.filter(
            payment_status="paid",
            completed_at__gte=start_dt,
            completed_at__lte=end_dt,
        ).aggregate(total=Sum("price"))["total"]
        or 0
    )
    inventory_qs = InventoryTransaction.objects.filter(
        action_type="update",
        quantity_changed__lt=0,
        notes__icontains="[POS Product Sale]",
        created_at__gte=start_dt,
        created_at__lte=end_dt,
    )
    if branch:
        inventory_qs = inventory_qs.filter(branch_name=branch.name)
    inventory_total = sum(_extract_pos_product_sale_amount(tx.notes) for tx in inventory_qs.only("notes"))
    return round(queue_total + inventory_total, 2)


def _build_report_rows(payment_qs, queue_qs, period_type, start_dt, end_dt, branch, threshold):
    payment_qs = payment_qs.select_related("queue_entry", "branch")
    total_revenue = float(payment_qs.aggregate(total=Sum("amount"))["total"] or 0)
    total_transactions = payment_qs.count()

    revenue_split = {
        "appointment": float(payment_qs.filter(transaction_type="appointment").aggregate(total=Sum("amount"))["total"] or 0),
        "walk_in": float(payment_qs.filter(transaction_type="walk_in").aggregate(total=Sum("amount"))["total"] or 0),
        "service": float(payment_qs.filter(transaction_type="service").aggregate(total=Sum("amount"))["total"] or 0),
        "product": float(payment_qs.filter(transaction_type="product").aggregate(total=Sum("amount"))["total"] or 0),
    }

    by_type = (
        payment_qs.values("transaction_type", "description")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("-total")
    )
    top_services = [
        {
            "service": row["description"] or str(row["transaction_type"]).replace("_", " ").title(),
            "revenue": round(float(row["total"] or 0), 2),
            "count": int(row["count"] or 0),
        }
        for row in by_type[:10]
    ]

    customer_totals = {}
    for tx in payment_qs:
        customer_name = (
            tx.queue_entry.customer_name
            if tx.queue_entry and tx.queue_entry.customer_name
            else "Walk-in Customer"
        )
        if customer_name not in customer_totals:
            customer_totals[customer_name] = {"customer_name": customer_name, "revenue": 0.0, "transactions": 0}
        customer_totals[customer_name]["revenue"] += float(tx.amount or 0)
        customer_totals[customer_name]["transactions"] += 1
    top_customers = sorted(customer_totals.values(), key=lambda row: row["revenue"], reverse=True)[:10]

    total_queue = queue_qs.filter(queued_at__gte=start_dt, queued_at__lte=end_dt).count()
    done_queue = queue_qs.filter(status="done", completed_at__gte=start_dt, completed_at__lte=end_dt).count()
    paid_queue = queue_qs.filter(payment_status="paid", completed_at__gte=start_dt, completed_at__lte=end_dt).count()
    conversion_rate = round((done_queue / total_queue) * 100, 2) if total_queue else 0.0
    payment_rate = round((paid_queue / total_queue) * 100, 2) if total_queue else 0.0

    prev_start, prev_end = _resolve_previous_period(period_type, start_dt, end_dt)
    prev_payment_qs = PaymentTransaction.objects.filter(paid_at__gte=prev_start, paid_at__lte=prev_end)
    prev_queue_qs = queue_qs
    if branch:
        prev_payment_qs = prev_payment_qs.filter(branch=branch)

    prev_revenue = float(prev_payment_qs.aggregate(total=Sum("amount"))["total"] or 0)
    prev_total_queue = prev_queue_qs.filter(queued_at__gte=prev_start, queued_at__lte=prev_end).count()
    prev_done_queue = prev_queue_qs.filter(status="done", completed_at__gte=prev_start, completed_at__lte=prev_end).count()
    prev_paid_queue = prev_queue_qs.filter(payment_status="paid", completed_at__gte=prev_start, completed_at__lte=prev_end).count()
    prev_conversion_rate = round((prev_done_queue / prev_total_queue) * 100, 2) if prev_total_queue else 0.0
    prev_payment_rate = round((prev_paid_queue / prev_total_queue) * 100, 2) if prev_total_queue else 0.0

    hours = {}
    weekdays = {}
    months = {}
    for tx in payment_qs:
        if not tx.paid_at:
            continue
        ts = timezone.localtime(tx.paid_at)
        amount = float(tx.amount or 0)
        hours[ts.hour] = hours.get(ts.hour, 0.0) + amount
        weekday_key = ts.isoweekday() % 7 + 1
        weekdays[weekday_key] = weekdays.get(weekday_key, 0.0) + amount
        months[ts.month] = months.get(ts.month, 0.0) + amount

    peak_hour = max(hours.items(), key=lambda row: row[1]) if hours else (None, 0.0)
    peak_day = max(weekdays.items(), key=lambda row: row[1]) if weekdays else (None, 0.0)
    peak_month = max(months.items(), key=lambda row: row[1]) if months else (None, 0.0)

    dashboard_total = _compute_dashboard_equivalent_total(queue_qs, start_dt, end_dt, branch=branch)
    mismatch_amount = round(abs(total_revenue - dashboard_total), 2)
    mismatch_flag = mismatch_amount > float(threshold)
    if mismatch_flag:
        logger.warning(
            "Report reconciliation mismatch detected: payment_total=%s dashboard_total=%s mismatch=%s threshold=%s branch=%s period=%s",
            round(total_revenue, 2),
            dashboard_total,
            mismatch_amount,
            threshold,
            branch.id if branch else None,
            period_type,
        )

    summary = {
        "generated_at": timezone.now().isoformat(),
        "kpi": {
            "total_revenue": round(total_revenue, 2),
            "services_completed": done_queue,
            "customers_count": len(top_customers),
            "conversion_rate": conversion_rate,
            "payment_rate": payment_rate,
            "total_transactions": total_transactions,
        },
        "period_over_period": {
            "revenue_current": round(total_revenue, 2),
            "revenue_previous": round(prev_revenue, 2),
            "revenue_change_pct": _safe_pct_change(total_revenue, prev_revenue),
            "conversion_rate_current": conversion_rate,
            "conversion_rate_previous": prev_conversion_rate,
            "conversion_rate_change_pct": _safe_pct_change(conversion_rate, prev_conversion_rate),
            "payment_rate_current": payment_rate,
            "payment_rate_previous": prev_payment_rate,
            "payment_rate_change_pct": _safe_pct_change(payment_rate, prev_payment_rate),
        },
        "peak_periods": {
            "hour": {"label": f"{peak_hour[0]:02d}:00" if peak_hour[0] is not None else "N/A", "revenue": round(float(peak_hour[1] or 0), 2)},
            "day": {"label": WEEKDAY_NAMES.get(peak_day[0], "N/A"), "revenue": round(float(peak_day[1] or 0), 2)},
            "month": {"label": month_abbr[peak_month[0]] if peak_month[0] else "N/A", "revenue": round(float(peak_month[1] or 0), 2)},
        },
        "revenue_split": {
            "appointments": round(revenue_split["appointment"], 2),
            "walk_ins": round(revenue_split["walk_in"], 2),
            "services": round(revenue_split["service"], 2),
            "products": round(revenue_split["product"], 2),
        },
        "reconciliation": {
            "payment_total": round(total_revenue, 2),
            "dashboard_total": dashboard_total,
            "mismatch_amount": mismatch_amount,
            "mismatch_threshold": float(threshold),
            "data_mismatch": mismatch_flag,
        },
    }

    sections = {
        "top_services": top_services,
        "top_customers": top_customers,
        "revenue_by_type": top_services,
    }
    return summary, sections


def _write_csv_report(report, summary, sections):
    reports_dir = Path(settings.MEDIA_ROOT) / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    filename = f"report_{report.id}_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
    file_path = reports_dir / filename

    with file_path.open("w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["Business Intelligence Report"])
        writer.writerow(["Report Type", report.report_type])
        writer.writerow(["Period", report.period_type])
        writer.writerow(["Scope", report.scope_type])
        writer.writerow(["Generated At", summary["generated_at"]])
        writer.writerow([])
        writer.writerow(["KPI Summary"])
        writer.writerow(["Total Revenue", summary["kpi"]["total_revenue"]])
        writer.writerow(["Services Completed", summary["kpi"]["services_completed"]])
        writer.writerow(["Customers", summary["kpi"]["customers_count"]])
        writer.writerow(["Conversion Rate (%)", summary["kpi"]["conversion_rate"]])
        writer.writerow(["Payment Rate (%)", summary["kpi"]["payment_rate"]])
        writer.writerow(["Total Transactions", summary["kpi"]["total_transactions"]])
        writer.writerow([])
        writer.writerow(["Period-over-Period Comparison"])
        writer.writerow(["Revenue Current", summary["period_over_period"]["revenue_current"]])
        writer.writerow(["Revenue Previous", summary["period_over_period"]["revenue_previous"]])
        writer.writerow(["Revenue Change (%)", summary["period_over_period"]["revenue_change_pct"]])
        writer.writerow(["Conversion Rate Current (%)", summary["period_over_period"]["conversion_rate_current"]])
        writer.writerow(["Conversion Rate Previous (%)", summary["period_over_period"]["conversion_rate_previous"]])
        writer.writerow(["Payment Rate Current (%)", summary["period_over_period"]["payment_rate_current"]])
        writer.writerow(["Payment Rate Previous (%)", summary["period_over_period"]["payment_rate_previous"]])
        writer.writerow([])
        writer.writerow(["Peak Periods"])
        writer.writerow(["Peak Hour", summary["peak_periods"]["hour"]["label"], summary["peak_periods"]["hour"]["revenue"]])
        writer.writerow(["Peak Day", summary["peak_periods"]["day"]["label"], summary["peak_periods"]["day"]["revenue"]])
        writer.writerow(["Peak Month", summary["peak_periods"]["month"]["label"], summary["peak_periods"]["month"]["revenue"]])
        writer.writerow([])
        writer.writerow(["Revenue Split"])
        writer.writerow(["Appointments", summary["revenue_split"]["appointments"]])
        writer.writerow(["Walk-ins", summary["revenue_split"]["walk_ins"]])
        writer.writerow(["Services", summary["revenue_split"]["services"]])
        writer.writerow(["Products", summary["revenue_split"]["products"]])
        writer.writerow([])
        writer.writerow(["Reconciliation"])
        writer.writerow(["Payment Total", summary["reconciliation"]["payment_total"]])
        writer.writerow(["Dashboard Total", summary["reconciliation"]["dashboard_total"]])
        writer.writerow(["Mismatch Amount", summary["reconciliation"]["mismatch_amount"]])
        writer.writerow(["Mismatch Threshold", summary["reconciliation"]["mismatch_threshold"]])
        writer.writerow(["Data Mismatch", summary["reconciliation"]["data_mismatch"]])
        writer.writerow([])

        writer.writerow(["Top Services"])
        writer.writerow(["Service", "Revenue", "Count"])
        for row in sections["top_services"]:
            writer.writerow([row.get("service"), float(row.get("revenue") or 0), int(row.get("count") or 0)])
        writer.writerow([])

        writer.writerow(["Top Customers"])
        writer.writerow(["Customer", "Revenue", "Transactions"])
        for row in sections["top_customers"]:
            writer.writerow([
                row.get("customer_name") or "Walk-in Customer",
                float(row.get("revenue") or 0),
                int(row.get("transactions") or 0),
            ])

    report.file_path = str(file_path.relative_to(settings.MEDIA_ROOT)).replace("\\", "/")
    report.status = "completed"
    report.summary = summary
    report.save(update_fields=["file_path", "status", "summary"])
    return report


class ReportGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        requester_staff = _get_requester_staff(request.user)
        if not requester_staff or requester_staff.role not in ALLOWED_REPORT_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        serializer = ReportGenerateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        branch = None
        if data.get("branch_id"):
            try:
                branch = Branch.objects.get(pk=data["branch_id"])
            except Branch.DoesNotExist:
                return Response({"detail": "Branch not found."}, status=404)

        start_dt, end_dt = _resolve_period_range(data["period_type"])
        payment_qs = PaymentTransaction.objects.filter(paid_at__gte=start_dt, paid_at__lte=end_dt)
        queue_qs = QueueEntry.objects.all()
        if data["scope_type"] == "branch":
            if branch:
                payment_qs = payment_qs.filter(branch_id=branch.id)
                queue_qs = queue_qs.filter(branch_id=branch.id)
            elif requester_staff.branch_id:
                payment_qs = payment_qs.filter(branch_id=requester_staff.branch_id)
                queue_qs = queue_qs.filter(branch_id=requester_staff.branch_id)

        report = ReportRun.objects.create(
            report_type=data["report_type"],
            period_type=data["period_type"],
            scope_type=data["scope_type"],
            branch=branch if data["scope_type"] == "branch" else None,
            filters=data.get("filters") or {},
            generated_by=requester_staff,
            status="completed",
        )

        try:
            threshold = float((data.get("filters") or {}).get("reconciliation_threshold", 1.0))
            summary, sections = _build_report_rows(
                payment_qs=payment_qs,
                queue_qs=queue_qs,
                period_type=data["period_type"],
                start_dt=start_dt,
                end_dt=end_dt,
                branch=branch if data["scope_type"] == "branch" else None,
                threshold=threshold,
            )
            report = _write_csv_report(report, summary, sections)
        except Exception as exc:
            report.status = "failed"
            report.error_message = str(exc)
            report.save(update_fields=["status", "error_message"])
            return Response({"detail": "Failed to generate report.", "error": str(exc)}, status=500)

        return Response(ReportRunSerializer(report).data, status=201)


class ReportHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = _get_requester_staff(request.user)
        if not requester_staff or requester_staff.role not in ALLOWED_REPORT_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        qs = ReportRun.objects.select_related("branch", "generated_by").all()
        if requester_staff.role == "Branch Manager":
            if requester_staff.branch_id:
                qs = qs.filter(scope_type="branch").filter(branch_id=requester_staff.branch_id)
            else:
                qs = qs.none()

        return Response(ReportRunSerializer(qs.order_by("-generated_at")[:100], many=True).data)


class ReportDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, report_id):
        requester_staff = _get_requester_staff(request.user)
        if not requester_staff or requester_staff.role not in ALLOWED_REPORT_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        try:
            report = ReportRun.objects.get(pk=report_id)
        except ReportRun.DoesNotExist:
            return Response({"detail": "Report not found."}, status=404)

        if requester_staff.role == "Branch Manager":
            if not requester_staff.branch_id or report.branch_id != requester_staff.branch_id:
                return Response({"detail": "Permission denied."}, status=403)

        if not report.file_path:
            raise Http404("Report file not available.")

        abs_path = Path(settings.MEDIA_ROOT) / report.file_path
        if not abs_path.exists():
            raise Http404("Report file missing.")

        return FileResponse(abs_path.open("rb"), as_attachment=True, filename=abs_path.name)
