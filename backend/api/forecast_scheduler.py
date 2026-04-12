import logging
import os
import sys
import threading
import time
from datetime import timedelta

from django.db import close_old_connections, connection
from django.utils import timezone

from api.models import Branch, ForecastingRun
from api.services.forecasting_service import (
    run_all_forecasts_for_branch,
    run_all_system_forecasts,
)

logger = logging.getLogger(__name__)

_scheduler_started = False


def _env_flag(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return str(raw).strip().lower() in {"1", "true", "yes", "on"}


def _interval_minutes() -> int:
    raw = os.getenv("FORECAST_AUTOGEN_INTERVAL_MINUTES", "60")
    try:
        value = int(raw)
    except (TypeError, ValueError):
        value = 60
    return max(5, value)


def _acquire_lock() -> bool:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT GET_LOCK(%s, %s)", ["forecast_scheduler_hourly", 0])
            row = cursor.fetchone()
            return bool(row and row[0] == 1)
    except Exception:
        logger.exception("Forecast scheduler: failed acquiring DB lock.")
        return False


def _release_lock() -> None:
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT RELEASE_LOCK(%s)", ["forecast_scheduler_hourly"])
    except Exception:
        logger.exception("Forecast scheduler: failed releasing DB lock.")


def _run_forecasts_once() -> None:
    lock_acquired = False
    try:
        close_old_connections()
        interval_minutes = _interval_minutes()
        cooldown_cutoff = timezone.now() - timedelta(minutes=interval_minutes)
        recently_generated = ForecastingRun.objects.filter(
            forecast_type="service",
            scope_type="system",
            generated_at__gte=cooldown_cutoff,
        ).exists()
        if recently_generated:
            return

        lock_acquired = _acquire_lock()
        if not lock_acquired:
            return

        active_branches = Branch.objects.filter(is_active=True).order_by("id")
        for branch in active_branches:
            run_all_forecasts_for_branch(branch)
        run_all_system_forecasts()
        logger.info("Forecast scheduler: generated branch + system forecasts.")
    except Exception:
        logger.exception("Forecast scheduler: forecast generation failed.")
    finally:
        if lock_acquired:
            _release_lock()
        close_old_connections()


def _scheduler_loop() -> None:
    while True:
        _run_forecasts_once()
        interval_seconds = _interval_minutes() * 60
        time.sleep(interval_seconds)


def start_forecast_scheduler() -> None:
    global _scheduler_started
    if _scheduler_started:
        return

    if not _env_flag("FORECAST_AUTOGEN_ENABLED", True):
        return

    if "runserver" in sys.argv and os.getenv("RUN_MAIN") != "true":
        return

    blocked_commands = {"makemigrations", "migrate", "collectstatic", "shell", "test"}
    if any(cmd in sys.argv for cmd in blocked_commands):
        return

    thread = threading.Thread(
        target=_scheduler_loop,
        name="forecast-autogen-hourly",
        daemon=True,
    )
    thread.start()
    _scheduler_started = True
    logger.info("Forecast scheduler started (hourly).")
