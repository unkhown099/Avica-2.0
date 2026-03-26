# api/permissions.py
from rest_framework.permissions import BasePermission
from api.models import Staff


class IsMechanicPermission(BasePermission):
    """
    Allows access only to users with mechanic role.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            staff = Staff.objects.get(user=request.user)
            return staff.role == 'Employee'
        except Staff.DoesNotExist:
            return False


class IsManagerPermission(BasePermission):
    """
    Allows access only to users with manager or admin roles.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            staff = Staff.objects.get(user=request.user)
            return staff.role in ['Admin', 'Business Owner', 'Branch Manager']
        except Staff.DoesNotExist:
            return False