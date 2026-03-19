from rest_framework import serializers
from ..models import Booking, Customer, Rating

class DashboardStatsSerializer(serializers.Serializer):
    total_revenue = serializers.FloatField()
    total_customers = serializers.IntegerField()
    services_completed = serializers.IntegerField()
    avg_satisfaction = serializers.FloatField()

class RecentTransactionSerializer(serializers.Serializer):
    customer_name = serializers.CharField()
    service = serializers.CharField()
    amount = serializers.FloatField()
    status = serializers.CharField()