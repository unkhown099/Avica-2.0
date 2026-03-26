# api/serializers/mechanic_serializers.py
from rest_framework import serializers
from django.utils import timezone
from api.models import (
    Staff, QueueEntry, Booking, Branch, Service, 
    InventoryItem, Rating, Customer
)
from django.db.models import Avg, Count, Sum


class MechanicProfileSerializer(serializers.ModelSerializer):
    """Serializer for mechanic profile details"""
    full_name = serializers.SerializerMethodField()
    branch_details = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'last_name', 'full_name', 'phone', 
                  'role', 'status', 'branch', 'branch_details', 'user_email']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    
    def get_branch_details(self, obj):
        if obj.branch:
            return {
                'id': obj.branch.id,
                'name': obj.branch.name,
                'address': obj.branch.address,
                'slots': obj.branch.slots
            }
        return None


class MechanicJobSerializer(serializers.ModelSerializer):
    """Serializer for jobs assigned to mechanics"""
    customer_name = serializers.CharField(source='customer_name', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='service', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    source_display = serializers.CharField(source='get_source_display', read_only=True)
    booking_id = serializers.IntegerField(source='booking.id', read_only=True)
    assigned_at = serializers.DateTimeField(source='queued_at', read_only=True)
    estimated_duration = serializers.SerializerMethodField()
    
    class Meta:
        model = QueueEntry
        fields = ['id', 'booking_id', 'customer_name', 'vehicle_info', 'service_name',
                  'notes', 'status', 'status_display', 'source', 'source_display',
                  'position', 'assigned_at', 'service_started_at', 'completed_at',
                  'estimated_duration', 'price', 'payment_status']
    
    def get_vehicle_info(self, obj):
        return {
            'vehicle': obj.vehicle,
            'plate_number': obj.plate_number
        }
    
    def get_estimated_duration(self, obj):
        # You can add logic to get duration from service model
        return "1 hour"  # Placeholder


class MechanicJobActionSerializer(serializers.Serializer):
    """Serializer for mechanic actions on jobs"""
    action = serializers.ChoiceField(choices=['start', 'complete', 'pause', 'resume'])
    notes = serializers.CharField(required=False, allow_blank=True)
    
    def validate_action(self, value):
        valid_actions = ['start', 'complete', 'pause', 'resume']
        if value not in valid_actions:
            raise serializers.ValidationError(f"Action must be one of: {', '.join(valid_actions)}")
        return value


class MechanicJobDetailSerializer(MechanicJobSerializer):
    """Detailed serializer for a single job"""
    customer_phone = serializers.CharField(source='phone', read_only=True)
    branch_details = MechanicProfileSerializer(source='branch', read_only=True)
    customer_rating = serializers.SerializerMethodField()
    required_parts = serializers.SerializerMethodField()
    service_history = serializers.SerializerMethodField()
    
    class Meta(MechanicJobSerializer.Meta):
        fields = MechanicJobSerializer.Meta.fields + [
            'customer_phone', 'branch_details', 'customer_rating', 
            'required_parts', 'service_history'
        ]
    
    def get_customer_rating(self, obj):
        # Get previous ratings for this customer
        if obj.booking and obj.booking.user:
            customer = Customer.objects.filter(user=obj.booking.user).first()
            if customer:
                avg_rating = Rating.objects.filter(
                    customer=customer
                ).aggregate(Avg('score'))['score__avg']
                return round(avg_rating, 1) if avg_rating else None
        return None
    
    def get_required_parts(self, obj):
        # Get parts needed for this service type
        service = Service.objects.filter(name__icontains=obj.service).first()
        if service:
            # This would need a ServiceParts model, but for now return placeholder
            return []
        return []
    
    def get_service_history(self, obj):
        # Get previous services for this vehicle
        if obj.vehicle and obj.plate_number:
            previous_jobs = QueueEntry.objects.filter(
                vehicle=obj.vehicle,
                plate_number=obj.plate_number,
                status='done'
            ).exclude(id=obj.id)[:5]
            return MechanicJobSerializer(previous_jobs, many=True).data
        return []


class MechanicDashboardStatsSerializer(serializers.Serializer):
    """Serializer for mechanic dashboard statistics"""
    today_jobs = serializers.DictField()
    active_job = MechanicJobSerializer(allow_null=True)
    week_stats = serializers.DictField()
    performance_metrics = serializers.DictField()


class MechanicNotificationSerializer(serializers.Serializer):
    """Serializer for mechanic notifications"""
    title = serializers.CharField()
    message = serializers.CharField()
    type = serializers.ChoiceField(choices=['info', 'success', 'warning', 'error'])
    created_at = serializers.DateTimeField()
    read = serializers.BooleanField(default=False)
    action_url = serializers.CharField(required=False, allow_blank=True)


class PartRequestSerializer(serializers.Serializer):
    """Serializer for requesting parts"""
    inventory_item_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    notes = serializers.CharField(required=False, allow_blank=True)


class JobReportSerializer(serializers.Serializer):
    """Serializer for job completion report"""
    job_id = serializers.IntegerField()
    work_performed = serializers.CharField()
    parts_used = serializers.ListField(child=serializers.DictField())
    labor_hours = serializers.DecimalField(max_digits=5, decimal_places=2)
    additional_notes = serializers.CharField(required=False, allow_blank=True)
    before_photos = serializers.ListField(child=serializers.URLField(), required=False)
    after_photos = serializers.ListField(child=serializers.URLField(), required=False)