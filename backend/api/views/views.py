from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from api.models import (
    Branch,
    ForecastingRun,
    InventoryDemandForecast,
    ServiceDemandForecast,
    ServiceDurationPrediction,
)
from api.services.forecasting_service import run_all_forecasts_for_branch


def generate_all_forecasts(request, branch_id):
    branch = get_object_or_404(Branch, id=branch_id, is_active=True)

    runs = run_all_forecasts_for_branch(branch)

    return JsonResponse({
        "message": "All forecasts generated successfully",
        "branch": branch.name,
        "inventory_run": {
            "run_id": runs["inventory_run"].id,
            "status": runs["inventory_run"].status,
            "notes": runs["inventory_run"].notes,
        },
        "service_run": {
            "run_id": runs["service_run"].id,
            "status": runs["service_run"].status,
            "notes": runs["service_run"].notes,
        },
        "duration_run": {
            "run_id": runs["duration_run"].id,
            "status": runs["duration_run"].status,
            "notes": runs["duration_run"].notes,
        },
    })


def get_latest_all_forecasts(request, branch_id):
    branch = get_object_or_404(Branch, id=branch_id, is_active=True)

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
    duration_results = []

    if inventory_run:
        rows = InventoryDemandForecast.objects.filter(
            forecasting_run=inventory_run
        ).select_related("inventory_item", "branch")

        for row in rows:
            inventory_results.append({
                "inventory_item_id": row.inventory_item.id,
                "inventory_item_name": row.inventory_item.name,
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
            service_results.append({
                "service_id": row.service.id,
                "service_name": row.service.name,
                "forecast_period_label": row.forecast_period_label,
                "predicted_booking_count": row.predicted_booking_count,
                "historical_average_count": str(row.historical_average_count) if row.historical_average_count is not None else None,
                "predicted_queue_count": row.predicted_queue_count,
                "peak_load_flag": row.peak_load_flag,
                "staffing_suggestion": row.staffing_suggestion,
                "created_at": row.created_at.isoformat(),
            })

    if duration_run:
        rows = ServiceDurationPrediction.objects.filter(
            forecasting_run=duration_run
        ).select_related("service", "branch", "employee")

        for row in rows:
            duration_results.append({
                "service_id": row.service.id,
                "service_name": row.service.name,
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
        "branch": {
            "id": branch.id,
            "name": branch.name,
        },
        "inventory_forecast": {
            "run_id": inventory_run.id if inventory_run else None,
            "status": inventory_run.status if inventory_run else None,
            "notes": inventory_run.notes if inventory_run else "No inventory forecast found",
            "generated_at": inventory_run.generated_at.isoformat() if inventory_run else None,
            "results": inventory_results,
        },
        "service_forecast": {
            "run_id": service_run.id if service_run else None,
            "status": service_run.status if service_run else None,
            "notes": service_run.notes if service_run else "No service forecast found",
            "generated_at": service_run.generated_at.isoformat() if service_run else None,
            "results": service_results,
        },
        "duration_forecast": {
            "run_id": duration_run.id if duration_run else None,
            "status": duration_run.status if duration_run else None,
            "notes": duration_run.notes if duration_run else "No duration forecast found",
            "generated_at": duration_run.generated_at.isoformat() if duration_run else None,
            "results": duration_results,
        },
    })