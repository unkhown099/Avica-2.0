from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db.models import Sum, Avg

from api.models import (
    Branch,
    Booking,
    ForecastingRun,
    InventoryDemandForecast,
    InventoryItem,
    QueueEntry,
    Service,
    ServiceDemandForecast,
    ServiceDurationPrediction,
    Staff,
)


def run_all_system_forecasts():
    now = timezone.now()

    inventory_run = ForecastingRun.objects.create(
        forecast_type="inventory",
        scope_type="system",
        branch=None,
        model_used="Aggregated Branch Forecast",
        period_type="monthly",
        status="success",
        notes="System inventory forecast generated from latest branch forecasts",
        generated_at=now,
    )

    service_run = ForecastingRun.objects.create(
        forecast_type="service",
        scope_type="system",
        branch=None,
        model_used="Aggregated Branch Forecast",
        period_type="monthly",
        status="success",
        notes="System service forecast generated from latest branch forecasts",
        generated_at=now,
    )

    duration_run = ForecastingRun.objects.create(
        forecast_type="duration",
        scope_type="system",
        branch=None,
        model_used="Aggregated Branch Forecast",
        period_type="monthly",
        status="success",
        notes="System duration forecast generated from latest branch forecasts",
        generated_at=now,
    )

    latest_branch_inventory = (
        InventoryDemandForecast.objects
        .filter(forecasting_run__scope_type="branch")
        .select_related("forecasting_run", "inventory_item", "branch")
        .order_by("inventory_item_id", "branch_id", "-forecasting_run__generated_at", "-created_at")
    )

    latest_branch_service = (
        ServiceDemandForecast.objects
        .filter(forecasting_run__scope_type="branch")
        .select_related("forecasting_run", "service", "branch")
        .order_by("service_id", "branch_id", "-forecasting_run__generated_at", "-created_at")
    )

    latest_branch_duration = (
        ServiceDurationPrediction.objects
        .filter(forecasting_run__scope_type="branch")
        .select_related("forecasting_run", "service", "branch", "employee")
        .order_by("service_id", "employee_id", "branch_id", "-forecasting_run__generated_at", "-created_at")
    )

    seen_inventory = set()
    inventory_grouped = {}

    for row in latest_branch_inventory:
        key = (row.inventory_item_id, row.branch_id)
        if key in seen_inventory:
            continue
        seen_inventory.add(key)

        agg_key = row.inventory_item_id
        if agg_key not in inventory_grouped:
            inventory_grouped[agg_key] = {
                "inventory_item": row.inventory_item,
                "forecast_period_label": row.forecast_period_label,
                "predicted_quantity": Decimal("0"),
                "historical_average_quantity": Decimal("0"),
                "current_quantity": Decimal("0"),
                "minimum_qty": Decimal("0"),
                "recommended_restock_qty": Decimal("0"),
                "count": 0,
            }

        g = inventory_grouped[agg_key]
        g["predicted_quantity"] += row.predicted_quantity or Decimal("0")
        g["historical_average_quantity"] += row.historical_average_quantity or Decimal("0")
        g["current_quantity"] += row.current_quantity or Decimal("0")
        g["minimum_qty"] += row.minimum_qty or Decimal("0")
        g["recommended_restock_qty"] += row.recommended_restock_qty or Decimal("0")
        g["count"] += 1

    for _, g in inventory_grouped.items():
        predicted = g["predicted_quantity"]
        current_qty = g["current_quantity"]
        minimum_qty = g["minimum_qty"]
        restock_qty = g["recommended_restock_qty"]

        if current_qty <= 0:
            stock_risk = "out_of_stock"
        elif current_qty <= minimum_qty:
            stock_risk = "critical"
        elif current_qty <= (minimum_qty * Decimal("1.5")):
            stock_risk = "low"
        else:
            stock_risk = "ok"

        InventoryDemandForecast.objects.create(
            forecasting_run=inventory_run,
            inventory_item=g["inventory_item"],
            branch=None,
            forecast_period_label=g["forecast_period_label"],
            predicted_quantity=predicted,
            historical_average_quantity=(
                g["historical_average_quantity"] / g["count"] if g["count"] else Decimal("0")
            ),
            current_quantity=current_qty,
            minimum_qty=minimum_qty,
            recommended_restock_qty=restock_qty,
            stock_risk_level=stock_risk,
        )

    seen_service = set()
    service_grouped = {}

    for row in latest_branch_service:
        key = (row.service_id, row.branch_id)
        if key in seen_service:
            continue
        seen_service.add(key)

        agg_key = row.service_id
        if agg_key not in service_grouped:
            service_grouped[agg_key] = {
                "service": row.service,
                "forecast_period_label": row.forecast_period_label,
                "predicted_booking_count": 0,
                "historical_average_count": Decimal("0"),
                "predicted_queue_count": 0,
                "peak_load_count": 0,
                "staffing_suggestions": [],
                "count": 0,
            }

        g = service_grouped[agg_key]
        g["predicted_booking_count"] += row.predicted_booking_count or 0
        g["historical_average_count"] += row.historical_average_count or Decimal("0")
        g["predicted_queue_count"] += row.predicted_queue_count or 0
        g["peak_load_count"] += 1 if row.peak_load_flag else 0
        if row.staffing_suggestion:
            g["staffing_suggestions"].append(row.staffing_suggestion)
        g["count"] += 1

    for _, g in service_grouped.items():
        ServiceDemandForecast.objects.create(
            forecasting_run=service_run,
            service=g["service"],
            branch=None,
            forecast_period_label=g["forecast_period_label"],
            predicted_booking_count=g["predicted_booking_count"],
            historical_average_count=(
                g["historical_average_count"] / g["count"] if g["count"] else Decimal("0")
            ),
            predicted_queue_count=g["predicted_queue_count"],
            peak_load_flag=g["peak_load_count"] > 0,
            staffing_suggestion=" | ".join(g["staffing_suggestions"][:3]) if g["staffing_suggestions"] else "Review staffing",
        )

    seen_duration = set()
    duration_grouped = {}

    for row in latest_branch_duration:
        key = (row.service_id, row.employee_id, row.branch_id)
        if key in seen_duration:
            continue
        seen_duration.add(key)

        agg_key = (row.service_id, row.employee_id)
        if agg_key not in duration_grouped:
            duration_grouped[agg_key] = {
                "service": row.service,
                "employee": row.employee,
                "based_on_queue_volume": 0,
                "based_on_booking_volume": 0,
                "based_on_avg_duration_minutes": Decimal("0"),
                "estimated_duration_minutes": Decimal("0"),
                "estimated_wait_minutes": Decimal("0"),
                "count": 0,
            }

        g = duration_grouped[agg_key]
        g["based_on_queue_volume"] += row.based_on_queue_volume or 0
        g["based_on_booking_volume"] += row.based_on_booking_volume or 0
        g["based_on_avg_duration_minutes"] += row.based_on_avg_duration_minutes or Decimal("0")
        g["estimated_duration_minutes"] += row.estimated_duration_minutes or Decimal("0")
        g["estimated_wait_minutes"] += row.estimated_wait_minutes or Decimal("0")
        g["count"] += 1

    for _, g in duration_grouped.items():
        ServiceDurationPrediction.objects.create(
            forecasting_run=duration_run,
            service=g["service"],
            branch=None,
            employee=g["employee"],
            based_on_queue_volume=g["based_on_queue_volume"],
            based_on_booking_volume=g["based_on_booking_volume"],
            based_on_avg_duration_minutes=(
                g["based_on_avg_duration_minutes"] / g["count"] if g["count"] else Decimal("0")
            ),
            estimated_duration_minutes=(
                g["estimated_duration_minutes"] / g["count"] if g["count"] else Decimal("0")
            ),
            estimated_wait_minutes=(
                g["estimated_wait_minutes"] / g["count"] if g["count"] else Decimal("0")
            ),
        )

    return {
        "inventory_run": inventory_run,
        "service_run": service_run,
        "duration_run": duration_run,
    }


def run_all_forecasts_for_branch(branch: Branch):
    now = timezone.now()
    period_label = now.strftime("%Y-%m")

    inventory_run = ForecastingRun.objects.create(
        forecast_type="inventory",
        scope_type="branch",
        branch=branch,
        model_used="Branch Inventory Heuristic",
        period_type="monthly",
        status="success",
        notes=f"Branch inventory forecast generated for {branch.name}",
        generated_at=now,
    )

    service_run = ForecastingRun.objects.create(
        forecast_type="service",
        scope_type="branch",
        branch=branch,
        model_used="Branch Service Heuristic",
        period_type="monthly",
        status="success",
        notes=f"Branch service forecast generated for {branch.name}",
        generated_at=now,
    )

    duration_run = ForecastingRun.objects.create(
        forecast_type="duration",
        scope_type="branch",
        branch=branch,
        model_used="Branch Duration Heuristic",
        period_type="monthly",
        status="success",
        notes=f"Branch duration forecast generated for {branch.name}",
        generated_at=now,
    )

    inventory_items = InventoryItem.objects.filter(branch=branch, is_active=True)
    for item in inventory_items:
        current_qty = Decimal(item.quantity or 0)
        minimum_qty = Decimal(item.minimum_qty or 0)
        predicted_qty = minimum_qty if minimum_qty > 0 else current_qty
        recommended_restock = max((minimum_qty * Decimal("2")) - current_qty, Decimal("0"))

        if current_qty <= 0:
            stock_risk = "out_of_stock"
        elif minimum_qty > 0 and current_qty <= minimum_qty:
            stock_risk = "critical"
        elif minimum_qty > 0 and current_qty <= (minimum_qty * Decimal("1.5")):
            stock_risk = "low"
        else:
            stock_risk = "ok"

        InventoryDemandForecast.objects.create(
            forecasting_run=inventory_run,
            branch=branch,
            inventory_item=item,
            forecast_period_label=period_label,
            predicted_quantity=predicted_qty,
            historical_average_quantity=current_qty,
            current_quantity=current_qty,
            minimum_qty=minimum_qty,
            recommended_restock_qty=recommended_restock,
            stock_risk_level=stock_risk,
        )

    services = Service.objects.filter(branches=branch, is_active=True).distinct()
    booking_window_start = (now - timedelta(days=90)).date()
    queue_window_start = now - timedelta(days=90)

    for svc in services:
        booking_count = (
            Booking.objects.filter(
                branch=branch,
                service=svc.name,
                date__gte=booking_window_start,
            )
            .exclude(status="cancelled")
            .count()
        )

        queue_count = QueueEntry.objects.filter(
            branch=branch,
            service=svc.name,
            queued_at__gte=queue_window_start,
        ).count()

        total_demand = booking_count + queue_count
        peak_load = total_demand >= 30
        staffing_suggestion = (
            "Add extra employee coverage during peak hours"
            if peak_load
            else "Current staffing is sufficient"
        )

        ServiceDemandForecast.objects.create(
            forecasting_run=service_run,
            branch=branch,
            service=svc,
            forecast_period_label=period_label,
            predicted_booking_count=total_demand,
            historical_average_count=Decimal(total_demand),
            predicted_queue_count=queue_count,
            peak_load_flag=peak_load,
            staffing_suggestion=staffing_suggestion,
        )

    employees = Staff.objects.filter(branch=branch, role="Employee")
    employee_ids = set(employees.values_list("id", flat=True))

    for svc in services:
        service_queue = QueueEntry.objects.filter(
            branch=branch,
            service=svc.name,
            queued_at__gte=queue_window_start,
        )

        based_on_queue_volume = service_queue.count()
        based_on_booking_volume = (
            Booking.objects.filter(
                branch=branch,
                service=svc.name,
                date__gte=booking_window_start,
            )
            .exclude(status="cancelled")
            .count()
        )

        completed_entries = service_queue.exclude(
            service_started_at__isnull=True,
            completed_at__isnull=True,
        )
        durations = []
        for row in completed_entries:
            if row.service_started_at and row.completed_at and row.completed_at >= row.service_started_at:
                durations.append(
                    Decimal((row.completed_at - row.service_started_at).total_seconds()) / Decimal("60")
                )

        avg_duration = (
            (sum(durations, Decimal("0")) / Decimal(len(durations)))
            if durations
            else Decimal("30")
        )
        estimated_wait = (
            (avg_duration * Decimal(max(based_on_queue_volume, 1))) / Decimal("2")
            if based_on_queue_volume
            else Decimal("0")
        )

        assigned_row = service_queue.filter(assigned_employee_id__in=employee_ids).first()

        ServiceDurationPrediction.objects.create(
            forecasting_run=duration_run,
            branch=branch,
            service=svc,
            employee=assigned_row.assigned_employee if assigned_row else None,
            based_on_queue_volume=based_on_queue_volume,
            based_on_booking_volume=based_on_booking_volume,
            based_on_avg_duration_minutes=avg_duration,
            estimated_duration_minutes=avg_duration,
            estimated_wait_minutes=estimated_wait,
        )

    return {
        "inventory_run": inventory_run,
        "service_run": service_run,
        "duration_run": duration_run,
    }
