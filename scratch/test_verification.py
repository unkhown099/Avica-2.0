import sys
sys.stdout.reconfigure(encoding='utf-8')
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework_simplejwt.tokens import AccessToken
from api.models import Staff, Branch, Booking
from api.views.dashboard_views import AdminDashboardView
from api.views.bookings_views import StaffBookingListView
from api.views.auth_views import LoginView, _get_profile_data, _normalize_role

User = get_user_model()
factory = APIRequestFactory()

print("="*60)
print("TEST 1: BUSINESS OWNER DASHBOARD & SERVICES ANALYTICS")
print("="*60)
owner = User.objects.filter(staff_profile__role__iexact='Business Owner').first()
print("Owner account found:", owner.email if owner else None)

branches = list(Branch.objects.values('id', 'name'))
print(f"Available branches in DB: {len(branches)}")

view = AdminDashboardView.as_view()

# 1A. All Branches
req_all = factory.get('/dashboard/')
force_authenticate(req_all, user=owner)
res_all = view(req_all)
print("1A. All branches response status:", res_all.status_code)
top_services_all = res_all.data.get('analytics', {}).get('top_services', [])
service_dist_all = res_all.data.get('analytics', {}).get('service_distribution', [])
print(f"    All branches top_services ({len(top_services_all)}):", top_services_all)
print(f"    All branches service_distribution ({len(service_dist_all)}):", service_dist_all)
assert res_all.status_code == 200, "Dashboard endpoint should return 200"

# 1B. Filter by specific branch (Branch 1: Saranay Branch)
req_b1 = factory.get(f"/dashboard/?branch_id={branches[0]['id']}")
force_authenticate(req_b1, user=owner)
res_b1 = view(req_b1)
top_services_b1 = res_b1.data.get('analytics', {}).get('top_services', [])
print(f"1B. Branch 1 ({branches[0]['name']}) top_services ({len(top_services_b1)}):", top_services_b1)
assert res_b1.status_code == 200

# 1C. Filter by branch name
req_bname = factory.get(f"/dashboard/?branch={branches[0]['name']}")
force_authenticate(req_bname, user=owner)
res_bname = view(req_bname)
top_services_bname = res_bname.data.get('analytics', {}).get('top_services', [])
print(f"1C. Filter by branch name top_services ({len(top_services_bname)}):", top_services_bname)
assert res_bname.status_code == 200

# 1D. Empty branch (Branch 2: Tanza Cavite Branch)
if len(branches) > 1:
    req_b2 = factory.get(f"/dashboard/?branch_id={branches[1]['id']}")
    force_authenticate(req_b2, user=owner)
    res_b2 = view(req_b2)
    top_services_b2 = res_b2.data.get('analytics', {}).get('top_services', [])
    print(f"1D. Branch 2 ({branches[1]['name']}) empty state data ({len(top_services_b2)}):", top_services_b2)
    assert top_services_b2 == [], "Branch with no service sales should return empty list for frontend empty state"

print("\n" + "="*60)
print("TEST 2: EMPLOYEE AUTHENTICATION & LOGIN FLOW")
print("="*60)
emp_user = User.objects.filter(staff_profile__role__iexact='Employee').first()
print("Employee user found:", emp_user.email if emp_user else None)
assert emp_user is not None, "Employee user must exist"

# Profile data check
role, f_name, l_name, suffix, phone, pic = _get_profile_data(emp_user)
print("Role from _get_profile_data:", role)
assert role == "employee", f"Expected 'employee', got '{role}'"

# Test API token payload
token = AccessToken.for_user(emp_user)
token["role"] = role
print("JWT access token generated successfully, role in payload:", token.get("role"))

# Test StaffBookingListView access with Employee credentials
booking_view = StaffBookingListView.as_view()
req_bookings = factory.get('/api/staff/bookings/')
force_authenticate(req_bookings, user=emp_user)
res_bookings = booking_view(req_bookings)
print("StaffBookingListView access status for employee:", res_bookings.status_code)
assert res_bookings.status_code == 200, "Employee should have access to staff bookings endpoint"

print("\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!")

