# api/views/superadmin_logs.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count, Case, When, Value, CharField
from django.contrib.auth import get_user_model
from ..models import (
    Staff, Booking, QueueEntry, PaymentTransaction, 
    InventoryTransaction, RestockRequest, Rating, Customer,
    User
)

User = get_user_model()


class IsSuperAdmin(BasePermission):
    """Custom permission to only allow super admins."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Check if user has staff profile with super_admin role
        try:
            staff = request.user.staff_profile
            return staff.role == 'super_admin' or request.user.is_superuser
        except Staff.DoesNotExist:
            return request.user.is_superuser


# Serializer for unified log entries - make all fields optional
class UnifiedLogSerializer(serializers.Serializer):
    id = serializers.CharField(allow_null=True, required=False)
    user_id = serializers.IntegerField(allow_null=True, required=False)
    user = serializers.CharField(allow_null=True, required=False)
    username = serializers.CharField(allow_null=True, required=False, default="")
    title = serializers.CharField(allow_null=True, required=False)
    type = serializers.CharField(allow_null=True, required=False)
    status = serializers.CharField(allow_null=True, required=False)
    message = serializers.CharField(allow_null=True, required=False)
    created_at = serializers.DateTimeField(allow_null=True, required=False)
    ip_address = serializers.CharField(allow_null=True, required=False, default="")
    
    def to_representation(self, instance):
        """Handle missing fields gracefully"""
        # If instance is a dictionary
        if isinstance(instance, dict):
            return {
                'id': instance.get('id', ''),
                'user_id': instance.get('user_id'),
                'user': instance.get('user', ''),
                'username': instance.get('username', instance.get('user', '')),
                'title': instance.get('title', ''),
                'type': instance.get('type', ''),
                'status': instance.get('status', 'info'),
                'message': instance.get('message', ''),
                'created_at': instance.get('created_at'),
                'ip_address': instance.get('ip_address', ''),
            }
        # If instance is a model instance
        return super().to_representation(instance)


class SuperAdminAuditLogsView(APIView):
    """
    API endpoint for super admin to view audit-style logs from existing models.
    Combines data from multiple models to create a unified audit trail.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        # Get filters
        user_id = request.query_params.get('user_id')
        action_type = request.query_params.get('type')
        days = int(request.query_params.get('days', 7))
        
        since_date = timezone.now() - timedelta(days=days)
        
        audit_entries = []
        
        # 1. Booking logs
        bookings = Booking.objects.filter(created_at__gte=since_date).select_related('user', 'branch')
        if user_id and user_id not in [None, 'null', '']:
            bookings = bookings.filter(user_id=user_id)
        
        for booking in bookings:
            audit_entries.append({
                'id': f'booking_{booking.id}',
                'user_id': booking.user.id,
                'user': booking.user.email,
                'username': booking.user.email,
                'title': f'Booking - {booking.service}',
                'type': 'booking',
                'status': booking.status,
                'message': f'{booking.service} at {booking.branch.name if booking.branch else "Unknown"} on {booking.date} at {booking.time}',
                'created_at': booking.created_at,
                'ip_address': None,
            })
        
        # 2. Queue entry logs
        queue_entries = QueueEntry.objects.filter(queued_at__gte=since_date).select_related('customer_user', 'assigned_employee')
        if user_id and user_id not in [None, 'null', '']:
            queue_entries = queue_entries.filter(customer_user_id=user_id)
        
        for qe in queue_entries:
            user_email = qe.customer_user.email if qe.customer_user else qe.customer_name
            user_id_val = qe.customer_user.id if qe.customer_user else None
            
            audit_entries.append({
                'id': f'queue_{qe.id}',
                'user_id': user_id_val,
                'user': user_email,
                'username': user_email,
                'title': f'Queue Entry - {qe.service}',
                'type': 'queue',
                'status': qe.status,
                'message': f'Status: {qe.status} | Assigned to: {qe.assigned_employee.first_name if qe.assigned_employee else "Unassigned"}',
                'created_at': qe.queued_at,
                'ip_address': None,
            })
        
        # 3. Payment transaction logs
        payments = PaymentTransaction.objects.filter(paid_at__gte=since_date).select_related('staff', 'staff__user', 'branch')
        if user_id and user_id not in [None, 'null', '']:
            payments = payments.filter(staff__user_id=user_id)
        
        for payment in payments:
            staff_name = payment.staff.user.email if payment.staff else 'System'
            staff_id = payment.staff.user.id if payment.staff else None
            
            audit_entries.append({
                'id': f'payment_{payment.id}',
                'user_id': staff_id,
                'user': staff_name,
                'username': staff_name,
                'title': f'Payment - {payment.transaction_type}',
                'type': 'payment',
                'status': 'success',
                'message': f'Amount: ₱{payment.amount} | Method: {payment.payment_method}',
                'created_at': payment.paid_at,
                'ip_address': None,
            })
        
        # 4. Inventory transaction logs
        inventory_trans = InventoryTransaction.objects.filter(created_at__gte=since_date).select_related('performed_by', 'performed_by__user', 'inventory_item')
        if user_id and user_id not in [None, 'null', '']:
            inventory_trans = inventory_trans.filter(performed_by__user_id=user_id)
        
        for trans in inventory_trans:
            staff_name = trans.performed_by.user.email if trans.performed_by else 'System'
            staff_id = trans.performed_by.user.id if trans.performed_by else None
            
            audit_entries.append({
                'id': f'inventory_{trans.id}',
                'user_id': staff_id,
                'user': staff_name,
                'username': staff_name,
                'title': f'Inventory - {trans.get_action_type_display()}',
                'type': 'inventory',
                'status': 'info',
                'message': trans.notes or f'Item: {trans.inventory_item.name if trans.inventory_item else "Unknown"}',
                'created_at': trans.created_at,
                'ip_address': None,
            })
        
        # 5. Restock request logs
        restock_requests = RestockRequest.objects.filter(created_at__gte=since_date).select_related('requested_by', 'requested_by__user', 'inventory_item', 'branch')
        if user_id and user_id not in [None, 'null', '']:
            restock_requests = restock_requests.filter(requested_by__user_id=user_id)
        
        for req in restock_requests:
            requester_name = req.requested_by.user.email if req.requested_by else 'System'
            requester_id = req.requested_by.user.id if req.requested_by else None
            
            audit_entries.append({
                'id': f'restock_{req.id}',
                'user_id': requester_id,
                'user': requester_name,
                'username': requester_name,
                'title': f'Restock Request - {req.get_status_display()}',
                'type': 'inventory',
                'status': req.status,
                'message': f'Item: {req.inventory_item.name} | Quantity: {req.quantity_requested}',
                'created_at': req.created_at,
                'ip_address': None,
            })
        
        # 6. Rating logs
        ratings = Rating.objects.filter(created_at__gte=since_date).select_related('customer', 'customer__user', 'branch')
        if user_id and user_id not in [None, 'null', '']:
            ratings = ratings.filter(customer__user_id=user_id)
        
        for rating in ratings:
            audit_entries.append({
                'id': f'rating_{rating.id}',
                'user_id': rating.customer.user.id,
                'user': rating.customer.user.email,
                'username': rating.customer.user.email,
                'title': 'Rating Submitted',
                'type': 'feedback',
                'status': 'success',
                'message': f'Score: {rating.score}/5 | Branch: {rating.branch.name}',
                'created_at': rating.created_at,
                'ip_address': None,
            })
        
        # Sort by created_at descending
        audit_entries.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Apply type filter if specified
        if action_type and action_type not in [None, 'null', '']:
            audit_entries = [e for e in audit_entries if e['type'] == action_type]
        
        # Limit to last 500 records for performance
        audit_entries = audit_entries[:500]
        
        serializer = UnifiedLogSerializer(audit_entries, many=True)
        return Response(serializer.data)


class SuperAdminUserActionsView(APIView):
    """
    API endpoint for super admin to view user actions from all models.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        user_id = request.query_params.get('user_id')
        days = int(request.query_params.get('days', 7))
        
        since_date = timezone.now() - timedelta(days=days)
        
        actions = []
        
        # 1. User bookings
        bookings = Booking.objects.filter(created_at__gte=since_date).select_related('user', 'branch')
        if user_id and user_id not in [None, 'null', '']:
            bookings = bookings.filter(user_id=user_id)
        
        for booking in bookings:
            actions.append({
                'id': f'booking_{booking.id}',
                'user_id': booking.user.id,
                'user': booking.user.email,
                'username': booking.user.email,
                'title': f'Created Booking - {booking.service}',
                'type': 'booking',
                'status': booking.status,
                'message': f'Booked {booking.service} on {booking.date} at {booking.time}',
                'created_at': booking.created_at,
                'ip_address': None,
            })
        
        # 2. Staff actions from inventory
        staff_actions = InventoryTransaction.objects.filter(
            created_at__gte=since_date,
            performed_by__isnull=False
        ).select_related('performed_by', 'performed_by__user', 'inventory_item')
        
        if user_id and user_id not in [None, 'null', '']:
            staff_actions = staff_actions.filter(performed_by__user_id=user_id)
        
        for action in staff_actions:
            actions.append({
                'id': f'staff_action_{action.id}',
                'user_id': action.performed_by.user.id,
                'user': action.performed_by.user.email,
                'username': action.performed_by.user.email,
                'title': f'Inventory {action.get_action_type_display()}',
                'type': 'staff',
                'status': 'completed',
                'message': f'Item: {action.inventory_item.name if action.inventory_item else "Unknown"}',
                'created_at': action.created_at,
                'ip_address': None,
            })
        
        # 3. Payment actions
        payments = PaymentTransaction.objects.filter(paid_at__gte=since_date).select_related('staff', 'staff__user')
        if user_id and user_id not in [None, 'null', '']:
            payments = payments.filter(staff__user_id=user_id)
        
        for payment in payments:
            staff_name = payment.staff.user.email if payment.staff else 'System'
            staff_id = payment.staff.user.id if payment.staff else None
            
            actions.append({
                'id': f'payment_{payment.id}',
                'user_id': staff_id,
                'user': staff_name,
                'username': staff_name,
                'title': 'Processed Payment',
                'type': 'payment',
                'status': 'completed',
                'message': f'Amount: ₱{payment.amount} | Type: {payment.transaction_type}',
                'created_at': payment.paid_at,
                'ip_address': None,
            })
        
        # 4. Queue assignments
        queue_assignments = QueueEntry.objects.filter(
            service_started_at__gte=since_date,
            assigned_employee__isnull=False
        ).select_related('assigned_employee', 'assigned_employee__user', 'customer_user')
        
        if user_id and user_id not in [None, 'null', '']:
            queue_assignments = queue_assignments.filter(assigned_employee__user_id=user_id)
        
        for qa in queue_assignments:
            employee_name = qa.assigned_employee.user.email if qa.assigned_employee else 'Unknown'
            customer_name = qa.customer_user.email if qa.customer_user else qa.customer_name
            
            actions.append({
                'id': f'queue_assign_{qa.id}',
                'user_id': qa.assigned_employee.user.id if qa.assigned_employee else None,
                'user': employee_name,
                'username': employee_name,
                'title': 'Queue Assignment',
                'type': 'queue',
                'status': 'completed',
                'message': f'Assigned to serve {customer_name} for {qa.service}',
                'created_at': qa.service_started_at,
                'ip_address': None,
            })
        
        # Sort by created_at descending
        actions.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Limit results
        actions = actions[:500]
        
        serializer = UnifiedLogSerializer(actions, many=True)
        return Response(serializer.data)


class SuperAdminReportStatsView(APIView):
    """
    Get aggregated statistics for the reports dashboard.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since_date = timezone.now() - timedelta(days=days)
        
        # Booking stats
        bookings = Booking.objects.filter(created_at__gte=since_date)
        
        # Queue stats
        queue_entries = QueueEntry.objects.filter(queued_at__gte=since_date)
        
        # Payment stats
        payments = PaymentTransaction.objects.filter(paid_at__gte=since_date)
        
        # Inventory stats
        inventory_trans = InventoryTransaction.objects.filter(created_at__gte=since_date)
        
        # Restock stats
        restock_requests = RestockRequest.objects.filter(created_at__gte=since_date)
        
        stats = {
            'total_events': bookings.count() + queue_entries.count() + payments.count() + inventory_trans.count(),
            'bookings': {
                'total': bookings.count(),
                'confirmed': bookings.filter(status='confirmed').count(),
                'pending': bookings.filter(status='pending').count(),
                'cancelled': bookings.filter(status='cancelled').count(),
                'completed': bookings.filter(status='done').count(),
            },
            'queue': {
                'total': queue_entries.count(),
                'waiting': queue_entries.filter(status='waiting').count(),
                'in_service': queue_entries.filter(status='in_service').count(),
                'completed': queue_entries.filter(status='done').count(),
            },
            'payments': {
                'total': payments.count(),
                'total_amount': sum(float(p.amount) for p in payments),
                'by_method': self._group_by_method(payments),
            },
            'inventory': {
                'transactions': inventory_trans.count(),
                'restock_requests': restock_requests.count(),
                'pending_restocks': restock_requests.filter(status='pending').count(),
            },
        }
        
        return Response(stats)
    
    def _group_by_method(self, payments):
        """Group payments by method"""
        methods = {}
        for payment in payments:
            method = payment.payment_method or 'unknown'
            methods[method] = methods.get(method, 0) + 1
        return methods


class SuperAdminUserListView(APIView):
    """
    Get list of all users for filtering in reports.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    
    def get(self, request):
        users_data = []
        
        # Get all staff users
        staff_users = Staff.objects.select_related('user').filter(user__is_active=True)
        for staff in staff_users:
            users_data.append({
                'id': staff.user.id,
                'email': staff.user.email,
                'role': staff.role,
                'label': f"{staff.user.email} ({staff.role})"
            })
        
        # Get customers (excluding those who are already staff)
        staff_user_ids = [s.user.id for s in staff_users]
        customers = Customer.objects.select_related('user').filter(
            user__is_active=True
        ).exclude(user_id__in=staff_user_ids)
        
        for customer in customers:
            users_data.append({
                'id': customer.user.id,
                'email': customer.user.email,
                'role': 'customer',
                'label': f"{customer.user.email} (Customer)"
            })
        
        # Get regular users (no staff or customer profile)
        all_user_ids = [s.user.id for s in staff_users] + [c.user.id for c in customers]
        regular_users = User.objects.filter(
            is_active=True,
            is_superuser=False
        ).exclude(id__in=all_user_ids)
        
        for user in regular_users:
            users_data.append({
                'id': user.id,
                'email': user.email,
                'role': 'user',
                'label': user.email
            })
        
        return Response(users_data)