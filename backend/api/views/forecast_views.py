from decimal import Decimal
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from api.models import (
    Branch,
    ForecastingRun,
    InventoryDemandForecast,
    ServiceDemandForecast,
    ServiceDurationPrediction,
)
from api.services.forecasting_service import (
    run_all_forecasts_for_branch,
    run_all_system_forecasts,
)


def _trend_from_demand(predicted_count, historical_avg):
    base = float(historical_avg or 0)
    predicted = float(predicted_count or 0)
    if base <= 0:
        return "increasing" if predicted > 0 else "stable"

    ratio = (predicted - base) / base
    if ratio >= 0.1:
        return "increasing"
    if ratio <= -0.1:
        return "decreasing"
    return "stable"


def _build_category_forecast_rows(service_results):
    by_category = {}

    for row in service_results:
        category = (row.get("service_category") or "Uncategorized").strip() or "Uncategorized"
        bucket = by_category.setdefault(
            category,
            {
                "category": category,
                "predicted_demand": 0,
                "predicted_revenue": 0.0,
                "historical_average_count_total": 0.0,
                "_service_count": 0,
            },
        )
        bucket["predicted_demand"] += int(row.get("predicted_booking_count") or 0)
        bucket["predicted_revenue"] += float(row.get("predicted_revenue") or 0.0)
        bucket["historical_average_count_total"] += float(row.get("historical_average_count") or 0.0)
        bucket["_service_count"] += 1

    rows = []
    for category, bucket in by_category.items():
        historical_avg = bucket["historical_average_count_total"]
        predicted = bucket["predicted_demand"]
        rows.append(
            {
                "category": category,
                "predicted_demand": predicted,
                "predicted_revenue": round(bucket["predicted_revenue"], 2),
                "historical_average_count": round(historical_avg, 2),
                "trend": _trend_from_demand(predicted, historical_avg),
            }
        )

    rows.sort(key=lambda item: (item["predicted_revenue"], item["predicted_demand"]), reverse=True)
    return rows


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_latest_system_forecasts(request):
    requester_staff = getattr(request.user, "staff_profile", None)
    requester_role = getattr(requester_staff, "role", None)
    manager_branch = getattr(requester_staff, "branch", None) if requester_role == "Branch Manager" else None

    inventory_run = (
        ForecastingRun.objects.filter(
            forecast_type="inventory",
            scope_type="system",
        )
        .order_by("-generated_at")
        .first()
    )

    service_run = (
        ForecastingRun.objects.filter(
            forecast_type="service",
            scope_type="system",
        )
        .order_by("-generated_at")
        .first()
    )

    duration_run = (
        ForecastingRun.objects.filter(
            forecast_type="duration",
            scope_type="system",
        )
        .order_by("-generated_at")
        .first()
    )

    inventory_results = []
    service_results = []
    category_results = []
    duration_results = []

    if inventory_run:
        rows = InventoryDemandForecast.objects.filter(
            forecasting_run=inventory_run
        ).select_related("inventory_item", "branch")
        if manager_branch:
            rows = rows.filter(branch_id=manager_branch.id)

        for row in rows:
            inventory_results.append({
                "inventory_item_id": row.inventory_item.id if row.inventory_item else None,
                "inventory_item_name": row.inventory_item.name if row.inventory_item else None,
                "branch_id": row.branch.id if row.branch else None,
                "branch_name": row.branch.name if row.branch else "System",
                "forecast_period_label": row.forecast_period_label,
                "predicted_quantity": str(row.predicted_quantity),
                "historical_average_quantity": str(row.historical_average_quantity) if row.historical_average_quantity is not None else None,
                "current_quantity": str(row.current_quantity) if row.current_quantity is not None else None,
                "minimum_qty": str(row.minimum_qty) if row.minimum_qty is not None else None,
                "recommended_restock_qty": str(row.recommended_restock_qty) if row.recommended_restock_qty is not None else None,
                "stock_risk_level": row.stock_risk_level,
                "created_at": row.created_at.isoformat(),
            })

    if service_run:
        rows = ServiceDemandForecast.objects.filter(
            forecasting_run=service_run
        ).select_related("service", "branch")
        if manager_branch:
            rows = rows.filter(branch_id=manager_branch.id)

        for row in rows:
            service_price = (
                row.service.price
                if row.service and getattr(row.service, "price", None) is not None
                else Decimal("0")
            )
            predicted_revenue = Decimal(row.predicted_booking_count or 0) * service_price
            service_results.append({
                "service_id": row.service.id if row.service else None,
                "service_name": row.service.name if row.service else None,
                "service_category": row.service.category if row.service and getattr(row.service, "category", None) else "Uncategorized",
                "branch_id": row.branch.id if row.branch else None,
                "branch_name": row.branch.name if row.branch else "System",
                "forecast_period_label": row.forecast_period_label,
                "predicted_booking_count": row.predicted_booking_count,
                "predicted_revenue": float(predicted_revenue),
                "historical_average_count": str(row.historical_average_count) if row.historical_average_count is not None else None,
                "predicted_queue_count": row.predicted_queue_count,
                "peak_load_flag": row.peak_load_flag,
                "staffing_suggestion": row.staffing_suggestion,
                "created_at": row.created_at.isoformat(),
            })

            category_results = _build_category_forecast_rows(service_results)

    if duration_run:
        rows = ServiceDurationPrediction.objects.filter(
            forecasting_run=duration_run
        ).select_related("service", "branch", "employee")
        if manager_branch:
            rows = rows.filter(branch_id=manager_branch.id)

        for row in rows:
            duration_results.append({
                "service_id": row.service.id if row.service else None,
                "service_name": row.service.name if row.service else None,
                "branch_id": row.branch.id if row.branch else None,
                "branch_name": row.branch.name if row.branch else "System",
                "employee_id": row.employee.id if row.employee else None,
                "employee_name": f"{row.employee.first_name} {row.employee.last_name}" if row.employee else None,
                "based_on_queue_volume": row.based_on_queue_volume,
                "based_on_booking_volume": row.based_on_booking_volume,
                "based_on_avg_duration_minutes": str(row.based_on_avg_duration_minutes) if row.based_on_avg_duration_minutes is not None else None,
                "estimated_duration_minutes": str(row.estimated_duration_minutes),
                "estimated_wait_minutes": str(row.estimated_wait_minutes) if row.estimated_wait_minutes is not None else None,
                "created_at": row.created_at.isoformat(),
            })

    return JsonResponse({
        "scope": "branch" if manager_branch else "system",
        "branch_id": manager_branch.id if manager_branch else None,
        "branch_name": manager_branch.name if manager_branch else None,
        "inventory_forecast": {
            "run_id": inventory_run.id if inventory_run else None,
            "status": inventory_run.status if inventory_run else None,
            "notes": inventory_run.notes if inventory_run else "No system inventory forecast found",
            "generated_at": inventory_run.generated_at.isoformat() if inventory_run else None,
            "results": inventory_results,
        },
        "service_forecast": {
            "run_id": service_run.id if service_run else None,
            "status": service_run.status if service_run else None,
            "notes": service_run.notes if service_run else "No system service forecast found",
            "generated_at": service_run.generated_at.isoformat() if service_run else None,
            "results": service_results,
        },
        "category_forecast": {
            "run_id": service_run.id if service_run else None,
            "status": service_run.status if service_run else None,
            "generated_at": service_run.generated_at.isoformat() if service_run else None,
            "results": category_results,
        },
        "duration_forecast": {
            "run_id": duration_run.id if duration_run else None,
            "status": duration_run.status if duration_run else None,
            "notes": duration_run.notes if duration_run else "No system duration forecast found",
            "generated_at": duration_run.generated_at.isoformat() if duration_run else None,
            "results": duration_results,
        },
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_all_forecasts(request, branch_id):
    branch = Branch.objects.filter(pk=branch_id).first()
    if not branch:
        return JsonResponse({"detail": "Branch not found."}, status=404)

    runs = run_all_forecasts_for_branch(branch)
    inventory_run = runs["inventory_run"]
    service_run = runs["service_run"]
    duration_run = runs["duration_run"]

    return JsonResponse({
        "scope": "branch",
        "branch_id": branch.id,
        "branch_name": branch.name,
        "inventory_forecast": {
            "run_id": inventory_run.id,
            "status": inventory_run.status,
            "notes": inventory_run.notes,
            "generated_at": inventory_run.generated_at.isoformat(),
        },
        "service_forecast": {
            "run_id": service_run.id,
            "status": service_run.status,
            "notes": service_run.notes,
            "generated_at": service_run.generated_at.isoformat(),
        },
        "duration_forecast": {
            "run_id": duration_run.id,
            "status": duration_run.status,
            "notes": duration_run.notes,
            "generated_at": duration_run.generated_at.isoformat(),
        },
    })


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_latest_all_forecasts(request, branch_id):
    branch = Branch.objects.filter(pk=branch_id).first()
    if not branch:
        return JsonResponse({"detail": "Branch not found."}, status=404)

    inventory_run = (
        ForecastingRun.objects.filter(
            forecast_type="inventory",
            scope_type="branch",
            branch=branch,
        )
        .order_by("-generated_at")
        .first()
    )

    service_run = (
        ForecastingRun.objects.filter(
            forecast_type="service",
            scope_type="branch",
            branch=branch,
        )
        .order_by("-generated_at")
        .first()
    )

    duration_run = (
        ForecastingRun.objects.filter(
            forecast_type="duration",
            scope_type="branch",
            branch=branch,
        )
        .order_by("-generated_at")
        .first()
    )

    inventory_results = []
    service_results = []
    category_results = []
    duration_results = []

    if inventory_run:
        rows = InventoryDemandForecast.objects.filter(
            forecasting_run=inventory_run
        ).select_related("inventory_item", "branch")

        for row in rows:
            inventory_results.append({
                "inventory_item_id": row.inventory_item.id if row.inventory_item else None,
                "inventory_item_name": row.inventory_item.name if row.inventory_item else None,
                "branch_id": row.branch.id if row.branch else branch.id,
                "branch_name": row.branch.name if row.branch else branch.name,
                "forecast_period_label": row.forecast_period_label,
                "predicted_quantity": str(row.predicted_quantity),
                "historical_average_quantity": str(row.historical_average_quantity) if row.historical_average_quantity is not None else None,
                "current_quantity": str(row.current_quantity) if row.current_quantity is not None else None,
                "minimum_qty": str(row.minimum_qty) if row.minimum_qty is not None else None,
                "recommended_restock_qty": str(row.recommended_restock_qty) if row.recommended_restock_qty is not None else None,
                "stock_risk_level": row.stock_risk_level,
                "created_at": row.created_at.isoformat(),
            })

    if service_run:
        rows = ServiceDemandForecast.objects.filter(
            forecasting_run=service_run
        ).select_related("service", "branch")

        for row in rows:
            service_price = (
                row.service.price
                if row.service and getattr(row.service, "price", None) is not None
                else Decimal("0")
            )
            predicted_revenue = Decimal(row.predicted_booking_count or 0) * service_price
            service_results.append({
                "service_id": row.service.id if row.service else None,
                "service_name": row.service.name if row.service else None,
                "service_category": row.service.category if row.service and getattr(row.service, "category", None) else "Uncategorized",
                "branch_id": row.branch.id if row.branch else branch.id,
                "branch_name": row.branch.name if row.branch else branch.name,
                "forecast_period_label": row.forecast_period_label,
                "predicted_booking_count": row.predicted_booking_count,
                "predicted_revenue": float(predicted_revenue),
                "historical_average_count": str(row.historical_average_count) if row.historical_average_count is not None else None,
                "predicted_queue_count": row.predicted_queue_count,
                "peak_load_flag": row.peak_load_flag,
                "staffing_suggestion": row.staffing_suggestion,
                "created_at": row.created_at.isoformat(),
            })

            category_results = _build_category_forecast_rows(service_results)

    if duration_run:
        rows = ServiceDurationPrediction.objects.filter(
            forecasting_run=duration_run
        ).select_related("service", "branch", "employee")

        for row in rows:
            duration_results.append({
                "service_id": row.service.id if row.service else None,
                "service_name": row.service.name if row.service else None,
                "branch_id": row.branch.id if row.branch else branch.id,
                "branch_name": row.branch.name if row.branch else branch.name,
                "employee_id": row.employee.id if row.employee else None,
                "employee_name": f"{row.employee.first_name} {row.employee.last_name}" if row.employee else None,
                "based_on_queue_volume": row.based_on_queue_volume,
                "based_on_booking_volume": row.based_on_booking_volume,
                "based_on_avg_duration_minutes": str(row.based_on_avg_duration_minutes) if row.based_on_avg_duration_minutes is not None else None,
                "estimated_duration_minutes": str(row.estimated_duration_minutes),
                "estimated_wait_minutes": str(row.estimated_wait_minutes) if row.estimated_wait_minutes is not None else None,
                "created_at": row.created_at.isoformat(),
            })

    return JsonResponse({
        "scope": "branch",
        "branch_id": branch.id,
        "branch_name": branch.name,
        "inventory_forecast": {
            "run_id": inventory_run.id if inventory_run else None,
            "status": inventory_run.status if inventory_run else None,
            "notes": inventory_run.notes if inventory_run else f"No inventory forecast found for {branch.name}",
            "generated_at": inventory_run.generated_at.isoformat() if inventory_run else None,
            "results": inventory_results,
        },
        "service_forecast": {
            "run_id": service_run.id if service_run else None,
            "status": service_run.status if service_run else None,
            "notes": service_run.notes if service_run else f"No service forecast found for {branch.name}",
            "generated_at": service_run.generated_at.isoformat() if service_run else None,
            "results": service_results,
        },
        "category_forecast": {
            "run_id": service_run.id if service_run else None,
            "status": service_run.status if service_run else None,
            "generated_at": service_run.generated_at.isoformat() if service_run else None,
            "results": category_results,
        },
        "duration_forecast": {
            "run_id": duration_run.id if duration_run else None,
            "status": duration_run.status if duration_run else None,
            "notes": duration_run.notes if duration_run else f"No duration forecast found for {branch.name}",
            "generated_at": duration_run.generated_at.isoformat() if duration_run else None,
            "results": duration_results,
        },
    })


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_system_forecasts(request):
    runs = run_all_system_forecasts()
    inventory_run = runs["inventory_run"]
    service_run = runs["service_run"]
    duration_run = runs["duration_run"]

    return JsonResponse({
        "scope": "system",
        "inventory_forecast": {
            "run_id": inventory_run.id,
            "status": inventory_run.status,
            "notes": inventory_run.notes,
            "generated_at": inventory_run.generated_at.isoformat(),
        },
        "service_forecast": {
            "run_id": service_run.id,
            "status": service_run.status,
            "notes": service_run.notes,
            "generated_at": service_run.generated_at.isoformat(),
        },
        "duration_forecast": {
            "run_id": duration_run.id,
            "status": duration_run.status,
            "notes": duration_run.notes,
            "generated_at": duration_run.generated_at.isoformat(),
        },
    })
