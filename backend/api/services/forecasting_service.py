from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from django.db.models import Avg, Count, F, ExpressionWrapper, DurationField

from api.models import (
    ForecastingRun,
    InventoryDemandForecast,
    ServiceDemandForecast,
    ServiceDurationPrediction,
    InventoryItem,
    InventoryTransaction,
    Booking,
    QueueEntry,
    Service,
)


def _to_decimal(value, default="0.00"):
    try:
        return Decimal(str(value))
    except Exception:
        return Decimal(default)


def _safe_quantize(value):
    return _to_decimal(value).quantize(Decimal("0.01"))


def _get_stock_risk_level(current_quantity, minimum_qty, predicted_quantity):
    if current_quantity <= 0:
        return "out_of_stock"
    if current_quantity <= minimum_qty:
        return "critical"
    if current_quantity < predicted_quantity:
        return "warning"
    return "normal"


def _get_staffing_suggestion(predicted_booking_count):
    if predicted_booking_count >= 20:
        return "Add more staff for expected high demand"
    if predicted_booking_count >= 10:
        return "Normal staffing with slight preparation"
    return "Current staffing is likely enough"


def _calculate_simple_inventory_forecast(item):
    current_quantity = _to_decimal(item.quantity)
    minimum_qty = _to_decimal(item.minimum_qty)

    recent_transactions = InventoryTransaction.objects.filter(
        inventory_item=item
    ).order_by("-created_at")[:10]

    usage_values = []

    for tx in recent_transactions:
        qty_changed = _to_decimal(tx.quantity_changed)

        if tx.action_type in ["transfer_out", "restock_request"]:
            if qty_changed > 0:
                usage_values.append(qty_changed)

        elif tx.action_type == "update":
            before = tx.quantity_before
            after = tx.quantity_after
            if before is not None and after is not None and before > after:
                usage_values.append(Decimal(str(before - after)))

    if usage_values:
        historical_average = sum(usage_values) / Decimal(len(usage_values))
        predicted_quantity = historical_average
    else:
        historical_average = Decimal("0.00")
        predicted_quantity = Decimal("0.00")

    recommended_restock_qty = predicted_quantity - current_quantity
    if recommended_restock_qty < 0:
        recommended_restock_qty = Decimal("0.00")

    stock_risk_level = _get_stock_risk_level(
        current_quantity=current_quantity,
        minimum_qty=minimum_qty,
        predicted_quantity=predicted_quantity,
    )

    return {
        "predicted_quantity": _safe_quantize(predicted_quantity),
        "historical_average_quantity": _safe_quantize(historical_average),
        "current_quantity": _safe_quantize(current_quantity),
        "minimum_qty": _safe_quantize(minimum_qty),
        "recommended_restock_qty": _safe_quantize(recommended_restock_qty),
        "stock_risk_level": stock_risk_level,
    }


def _calculate_service_demand_forecasts(branch, run):
    services = Service.objects.filter(is_active=True, branches=branch).distinct()
    created_count = 0

    for service in services:
        booking_qs = Booking.objects.filter(
            branch=branch,
            service=service.name,
        )

        queue_qs = QueueEntry.objects.filter(
            branch=branch,
            service=service.name,
        )

        booking_count = booking_qs.count()
        queue_count = queue_qs.count()

        predicted_booking_count = booking_count
        predicted_queue_count = queue_count

        historical_average_count = Decimal(str(booking_count)) if booking_count else Decimal("0.00")
        peak_load_flag = predicted_booking_count >= 10
        staffing_suggestion = _get_staffing_suggestion(predicted_booking_count)

        ServiceDemandForecast.objects.create(
            forecasting_run=run,
            branch=branch,
            service=service,
            forecast_period_label="Next Period",
            predicted_booking_count=predicted_booking_count,
            historical_average_count=_safe_quantize(historical_average_count),
            predicted_queue_count=predicted_queue_count,
            peak_load_flag=peak_load_flag,
            staffing_suggestion=staffing_suggestion,
        )
        created_count += 1

    return created_count


def _calculate_service_duration_predictions(branch, run):
    services = Service.objects.filter(is_active=True, branches=branch).distinct()
    created_count = 0

    for service in services:
        completed_entries = QueueEntry.objects.filter(
            branch=branch,
            service=service.name,
            status="done",
            service_started_at__isnull=False,
            completed_at__isnull=False,
        ).annotate(
            duration=ExpressionWrapper(
                F("completed_at") - F("service_started_at"),
                output_field=DurationField(),
            )
        )

        based_on_queue_volume = QueueEntry.objects.filter(
            branch=branch,
            service=service.name,
        ).count()

        based_on_booking_volume = Booking.objects.filter(
            branch=branch,
            service=service.name,
        ).count()

        avg_duration = completed_entries.aggregate(avg_duration=Avg("duration"))["avg_duration"]

        if avg_duration:
            avg_minutes = Decimal(str(avg_duration.total_seconds() / 60))
        else:
            avg_minutes = Decimal("0.00")

        estimated_duration_minutes = avg_minutes
        estimated_wait_minutes = _safe_quantize(
            (Decimal(str(based_on_queue_volume)) * avg_minutes / Decimal("2"))
            if avg_minutes > 0 else Decimal("0.00")
        )

        ServiceDurationPrediction.objects.create(
            forecasting_run=run,
            branch=branch,
            service=service,
            employee=None,
            based_on_queue_volume=based_on_queue_volume,
            based_on_booking_volume=based_on_booking_volume,
            based_on_avg_duration_minutes=_safe_quantize(avg_minutes),
            estimated_duration_minutes=_safe_quantize(estimated_duration_minutes),
            estimated_wait_minutes=_safe_quantize(estimated_wait_minutes),
        )
        created_count += 1

    return created_count


@transaction.atomic
def run_all_forecasts_for_branch(branch):
    today = timezone.now().date()

    inventory_run = ForecastingRun.objects.create(
        forecast_type="inventory",
        scope_type="branch",
        branch=branch,
        model_used="Simple Average",
        period_type="weekly",
        prediction_start_date=today,
        status="success",
        notes=f"Inventory forecast generated for {branch.name}",
    )

    inventory_items = InventoryItem.objects.filter(branch=branch, is_active=True).order_by("name")
    inventory_created = 0

    for item in inventory_items:
        forecast_data = _calculate_simple_inventory_forecast(item)

        InventoryDemandForecast.objects.create(
            forecasting_run=inventory_run,
            branch=branch,
            inventory_item=item,
            forecast_period_label="Next Period",
            predicted_quantity=forecast_data["predicted_quantity"],
            historical_average_quantity=forecast_data["historical_average_quantity"],
            current_quantity=forecast_data["current_quantity"],
            minimum_qty=forecast_data["minimum_qty"],
            recommended_restock_qty=forecast_data["recommended_restock_qty"],
            stock_risk_level=forecast_data["stock_risk_level"],
        )
        inventory_created += 1

    if inventory_created == 0:
        inventory_run.status = "insufficient_data"
        inventory_run.notes = f"No active inventory items found for {branch.name}"
        inventory_run.save(update_fields=["status", "notes"])
    else:
        inventory_run.notes = f"Generated {inventory_created} inventory forecast row(s) for {branch.name}"
        inventory_run.save(update_fields=["notes"])

    service_run = ForecastingRun.objects.create(
        forecast_type="service",
        scope_type="branch",
        branch=branch,
        model_used="Count Based Estimate",
        period_type="weekly",
        prediction_start_date=today,
        status="success",
        notes=f"Service demand forecast generated for {branch.name}",
    )

    service_created = _calculate_service_demand_forecasts(branch, service_run)
    if service_created == 0:
        service_run.status = "insufficient_data"
        service_run.notes = f"No active services found for {branch.name}"
        service_run.save(update_fields=["status", "notes"])
    else:
        service_run.notes = f"Generated {service_created} service demand forecast row(s) for {branch.name}"
        service_run.save(update_fields=["notes"])

    duration_run = ForecastingRun.objects.create(
        forecast_type="duration",
        scope_type="branch",
        branch=branch,
        model_used="Average Duration Estimate",
        period_type="weekly",
        prediction_start_date=today,
        status="success",
        notes=f"Service duration prediction generated for {branch.name}",
    )

    duration_created = _calculate_service_duration_predictions(branch, duration_run)
    if duration_created == 0:
        duration_run.status = "insufficient_data"
        duration_run.notes = f"No completed queue history found for {branch.name}"
        duration_run.save(update_fields=["status", "notes"])
    else:
        duration_run.notes = f"Generated {duration_created} service duration prediction row(s) for {branch.name}"
        duration_run.save(update_fields=["notes"])

    return {
        "inventory_run": inventory_run,
        "service_run": service_run,
        "duration_run": duration_run,
    }