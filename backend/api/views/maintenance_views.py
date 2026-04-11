from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from ..models import SystemSettings


# ── helpers ───────────────────────────────────────────────────────────────────

def _is_super_admin(user):
    """True if the authenticated user holds the super_admin role."""
    # Works for both Staff-profile users and Django superusers
    if getattr(user, "is_superuser", False):
        return True
    staff = getattr(user, "staff_profile", None)
    if staff and staff.role.lower() == "super_admin":
        return True
    return False


def _serialize(obj: SystemSettings) -> dict:
    """Return the full settings payload the frontend expects."""
    return {
        "general":  obj.general,
        "email":    obj.email,
        "security": obj.security,
    }


# ── GET + PATCH /super-admin/settings/ ───────────────────────────────────────

class SystemSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_super_admin(request.user):
            return Response(
                {"detail": "You do not have permission to view system settings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = SystemSettings.get_singleton()
        return Response(_serialize(obj))

    def patch(self, request):
        if not _is_super_admin(request.user):
            return Response(
                {"detail": "You do not have permission to update system settings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        obj = SystemSettings.get_singleton()
        data = request.data

        # Each section is optional — only update what was sent
        changed_fields = []

        if "general" in data and isinstance(data["general"], dict):
            # Merge instead of replace so unknown keys are preserved
            obj.general = {**obj.general, **data["general"]}
            changed_fields.append("general")

        if "email" in data and isinstance(data["email"], dict):
            obj.email = {**obj.email, **data["email"]}
            changed_fields.append("email")

        if "security" in data and isinstance(data["security"], dict):
            obj.security = {**obj.security, **data["security"]}
            changed_fields.append("security")

        if not changed_fields:
            return Response(
                {"detail": "No valid section (general / email / security) was provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        obj.updated_by = request.user
        changed_fields.append("updated_by")
        changed_fields.append("updated_at")

        obj.save(update_fields=changed_fields)

        return Response({
            "message": "Settings saved successfully.",
            "settings": _serialize(obj),
        })


# ── GET /system/maintenance-status/  (public — no auth required) ──────────────

class MaintenanceStatusView(APIView):
    """
    Consumed by the React MaintenanceGuard on every page load.
    Must remain AllowAny so that unauthenticated / guest users can be gated.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            obj = SystemSettings.get_singleton()
            is_maintenance = obj.is_maintenance  # property on the model
            
            # Get the maintenance message
            message = obj.general.get(
                "maintenanceMessage",
                "We're currently performing scheduled maintenance. We'll be back shortly!"
            )
            
            # Check if the user is allowed to bypass maintenance
            can_bypass = False
            user = request.user
            
            if user and user.is_authenticated:
                # Check for superuser
                if getattr(user, "is_superuser", False):
                    can_bypass = True
                # Check staff profile role
                elif hasattr(user, 'staff_profile'):
                    role = user.staff_profile.role.lower()
                    allowed_roles = ["super_admin", "admin", "business_owner"]
                    can_bypass = role in allowed_roles
            
            return Response({
                "is_maintenance_mode": is_maintenance,
                "maintenance_message": message,
                "can_bypass": can_bypass,  # Tell frontend if this user can bypass
                "is_authenticated": user.is_authenticated if user else False,
            })
            
        except Exception as e:
            # Never crash the frontend — default to live if DB is unreachable
            return Response({
                "is_maintenance_mode": False,
                "maintenance_message": "",
                "can_bypass": False,
                "is_authenticated": False,
            })