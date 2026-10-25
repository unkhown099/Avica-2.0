import os

def patch_business_owner():
    path = os.path.join('backend', 'api', 'views', 'business_owner_views.py')
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read().replace('\r\n', '\n')
    
    old = """def _require_owner(request):
    \"\"\"
    Validates that the authenticated user is an authorized owner or administrator:
    Allowed: 'Admin', 'Business Owner', 'super_admin' (or user.is_superuser).
    Denied (403): Branch Manager, Staff (Cashier), Employee, Inventory, Customer.
    \"\"\"
    if not request.user or not request.user.is_authenticated:
        return False, None
    if getattr(request.user, "is_superuser", False):
        return True, "superuser"
    try:
        if not hasattr(request.user, "staff_profile"):
            return False, None
        role = str(request.user.staff_profile.role or "").strip()
        normalized = role.lower().replace(" ", "_")
        allowed = normalized in {"admin", "business_owner", "owner", "super_admin"}
        return allowed, role
    except Exception:
        return False, None"""

    new = """def _require_owner(request):
    \"\"\"
    Validates that the authenticated user is an authorized owner or administrator:
    Allowed: 'Admin', 'Business Owner', 'super_admin' (or user.is_superuser).
    Denied (403): Branch Manager, Staff (Cashier), Employee, Inventory, Customer.
    \"\"\"
    if not request.user or not request.user.is_authenticated:
        return False, None
    if getattr(request.user, "is_superuser", False) or getattr(request.user, "is_staff", False):
        return True, "superuser"
    try:
        staff = getattr(request.user, "staff_profile", None)
        if not staff:
            staff = Staff.objects.filter(user=request.user).first()
        if not staff:
            return False, None
        role = str(staff.role or "").strip()
        normalized = role.lower().replace(" ", "_")
        allowed = normalized in {"admin", "business_owner", "owner", "super_admin"}
        return allowed, role
    except Exception:
        return False, None"""

    if old in c:
        c = c.replace(old, new)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(c)
        print("Updated _require_owner in business_owner_views.py")
    else:
        print("Target not found in business_owner_views.py")

def patch_auth_views():
    path = os.path.join('backend', 'api', 'views', 'auth_views.py')
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read().replace('\r\n', '\n')

    old = """    # Check staff first
    try:
        staff = Staff.objects.get(user=user)"""
    new = """    # Check staff first
    try:
        staff = getattr(user, "staff_profile", None) or Staff.objects.filter(user=user).first()
        if not staff:
            raise Staff.DoesNotExist"""

    if old in c:
        c = c.replace(old, new)
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(c)
        print("Updated Staff lookup in auth_views.py")
    else:
        print("Target not found in auth_views.py")

if __name__ == '__main__':
    patch_business_owner()
    patch_auth_views()

