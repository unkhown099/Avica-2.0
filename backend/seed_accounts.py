import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User, Staff, Customer, Branch

branch = Branch.objects.first()
COMMON_PASSWORD = 'password123'

roles_info = [
    ('super_admin', 'Super Admin', 'superadmin@avica.com', True, True),
    ('Admin', 'Admin', 'admin@avica.com', True, True),
    ('Business Owner', 'Business Owner', 'owner@avica.com', False, False),
    ('Branch Manager', 'Branch Manager', 'manager@avica.com', False, False),
    ('Staff', 'Staff (Cashier)', 'staff@avica.com', False, False),
    ('Employee', 'Employee', 'employee@avica.com', False, False),
    ('Inventory', 'Inventory Staff', 'inventory@avica.com', False, False),
    ('Inventory Manager', 'Inventory Manager', 'inventorymanager@avica.com', False, False),
]

print("=== SETTING UP ROLE ACCOUNTS ===")
for code, disp, email, is_staff, is_superuser in roles_info:
    user, _ = User.objects.get_or_create(email=email)
    user.set_password(COMMON_PASSWORD)
    user.is_active = True
    user.email_verified = True
    user.is_staff = is_staff
    user.is_superuser = is_superuser
    user.save()

    staff, _ = Staff.objects.get_or_create(user=user)
    staff.first_name = disp
    staff.last_name = "Account"
    staff.phone = "09123456789"
    staff.role = code
    staff.status = "Active"
    staff.branch = branch
    if branch:
        staff.branch_name = branch.name
    staff.save()

# Customer Account
cust_user, _ = User.objects.get_or_create(email='customer@avica.com')
cust_user.set_password(COMMON_PASSWORD)
cust_user.is_active = True
cust_user.email_verified = True
cust_user.save()

cust, _ = Customer.objects.get_or_create(user=cust_user)
cust.first_name = 'Customer'
cust.last_name = 'Account'
cust.phone = '09987654321'
cust.save()

# Print summary
print("\n" + "="*70)
print(f"{'ROLE':<25} | {'EMAIL':<30} | {'PASSWORD':<15}")
print("="*70)
for code, disp, email, _, _ in roles_info:
    print(f"{disp:<25} | {email:<30} | {COMMON_PASSWORD:<15}")
print(f"{'Customer':<25} | {'customer@avica.com':<30} | {COMMON_PASSWORD:<15}")
print("="*70)
