from rest_framework.permissions import BasePermission

class IsSuperAdmin(BasePermission):
    """Only users with role == 'super_admin' or is_superuser can pass."""
    message = "Access restricted to Super Admins only."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, "is_superuser", False):
            return True
        try:
            return request.user.staff_profile.role in {"super_admin", "Super Admin"}
        except AttributeError:
            return False


class IsAdminOrBusinessOwner(BasePermission):
    """
    Allows access to Super Admin, Admin, and Business Owner roles.
    Checks staff_profile.role and user.is_superuser.
    Does NOT grant access simply because is_staff=True.
    """
    message = "Access restricted to Administrators and Business Owners."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, "is_superuser", False):
            return True
        try:
            role = getattr(request.user.staff_profile, "role", "")
            return role in {"Admin", "Business Owner", "super_admin", "Super Admin"}
        except AttributeError:
            return False