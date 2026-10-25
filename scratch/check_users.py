import sys
sys.stdout.reconfigure(encoding='utf-8')
from django.contrib.auth import get_user_model
from api.models import Staff

User = get_user_model()
users = User.objects.all().select_related('staff_profile')
print(f"Total users: {users.count()}")
for u in users:
    staff = getattr(u, 'staff_profile', None)
    role = staff.role if staff else 'No Staff Profile'
    branch = staff.branch.name if staff and staff.branch else (staff.branch_name if staff else 'N/A')
    print(f"User: {u.id} | email: {u.email} | staff role: {role} | branch: {branch} | is_staff: {u.is_staff} | is_superuser: {u.is_superuser}")

