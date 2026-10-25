import sys
sys.stdout.reconfigure(encoding='utf-8')
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import Staff, Branch
from api.views.dashboard_views import AdminDashboardView

User = get_user_model()
owner = User.objects.filter(staff_profile__role__iexact='Business Owner').first()
print('Owner user:', owner)

branches = list(Branch.objects.values('id', 'name'))
print('Branches:', branches)

factory = APIRequestFactory()

# Test 1: All branches
req1 = factory.get('/dashboard/')
if owner:
    force_authenticate(req1, user=owner)
view = AdminDashboardView.as_view()
res1 = view(req1)
print('All branches status:', res1.status_code)
print('All branches analytics keys:', list(res1.data.get('analytics', {}).keys()))
print('All branches top_services:', res1.data.get('analytics', {}).get('top_services'))
print('All branches service_distribution:', res1.data.get('analytics', {}).get('service_distribution'))

# Test 2: Specific branch (first branch)
if branches:
    b = branches[0]
    req2 = factory.get(f"/dashboard/?branch_id={b['id']}")
    if owner:
        force_authenticate(req2, user=owner)
    res2 = view(req2)
    print(f"Branch {b['id']} ({b['name']}) top_services:", res2.data.get('analytics', {}).get('top_services'))
    print(f"Branch {b['id']} ({b['name']}) service_distribution:", res2.data.get('analytics', {}).get('service_distribution'))

