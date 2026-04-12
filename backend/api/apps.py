from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        from .forecast_scheduler import start_forecast_scheduler

        start_forecast_scheduler()
