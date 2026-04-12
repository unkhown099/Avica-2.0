import csv
from datetime import datetime, timedelta
from pathlib import Path

from django.conf import settings
from django.db.models import Count, Sum
from django.http import FileResponse, Http404
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Branch, PaymentTransaction, QueueEntry, ReportRun, Staff
from api.serializers.report_serializer import ReportGenerateRequestSerializer, ReportRunSerializer


ALLOWED_REPORT_ROLES = {"Admin", "Business Owner", "super_admin", "Super Admin", "Branch Manager"}


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


def _build_report_rows(payment_qs):
    total_revenue = float(payment_qs.aggregate(total=Sum("amount"))["total"] or 0)
    total_transactions = payment_qs.count()
    by_type = (
        payment_qs.values("transaction_type")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("-total")
    )
    by_branch = (
        payment_qs.values("branch__name")
        .annotate(total=Sum("amount"), count=Count("id"))
        .order_by("-total")
    )
    top_customers = (
        QueueEntry.objects.filter(payment_status="paid")
        .values("customer_name")
        .annotate(total=Sum("price"), visits=Count("id"))
        .order_by("-total")[:10]
    )

    summary = {
        "total_revenue": round(total_revenue, 2),
        "total_transactions": total_transactions,
        "total_customers": len([r for r in top_customers if r.get("customer_name")]),
        "generated_at": timezone.now().isoformat(),
    }

    sections = {
        "revenue_by_type": list(by_type),
        "revenue_by_branch": list(by_branch),
        "top_customers": list(top_customers),
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
        writer.writerow(["Total Revenue", summary["total_revenue"]])
        writer.writerow(["Total Transactions", summary["total_transactions"]])
        writer.writerow(["Key Customers", summary["total_customers"]])
        writer.writerow([])

        writer.writerow(["Revenue by Type"])
        writer.writerow(["Transaction Type", "Revenue", "Count"])
        for row in sections["revenue_by_type"]:
            writer.writerow([row.get("transaction_type"), float(row.get("total") or 0), int(row.get("count") or 0)])
        writer.writerow([])

        writer.writerow(["Revenue by Branch"])
        writer.writerow(["Branch", "Revenue", "Count"])
        for row in sections["revenue_by_branch"]:
            writer.writerow([row.get("branch__name") or "Unassigned", float(row.get("total") or 0), int(row.get("count") or 0)])
        writer.writerow([])

        writer.writerow(["Top Customers"])
        writer.writerow(["Customer", "Revenue", "Visits"])
        for row in sections["top_customers"]:
            writer.writerow([row.get("customer_name") or "Walk-in Customer", float(row.get("total") or 0), int(row.get("visits") or 0)])

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
        if data["scope_type"] == "branch":
            if branch:
                payment_qs = payment_qs.filter(branch_id=branch.id)
            elif requester_staff.branch_id:
                payment_qs = payment_qs.filter(branch_id=requester_staff.branch_id)

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
            summary, sections = _build_report_rows(payment_qs)
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
