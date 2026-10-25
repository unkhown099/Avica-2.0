import os
import sys
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(backend_dir))
load_dotenv(backend_dir / 'backend' / '.env')
load_dotenv(backend_dir / '.env')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from api.models import User, Branch, QueueEntry, PaymentTransaction, Staff
from api.views.dashboard_views import AdminDashboardView
from api.views.business_owner_views import OwnerBranchListView

factory = APIRequestFactory()

def verify_dashboard_services_analytics():
    print("\n--- VERIFYING SERVICES ANALYTICS API ---")
    owner_user = User.objects.filter(email__icontains="owner").first() or User.objects.first()
    view = AdminDashboardView.as_view()

    # 1. All Branches
    req1 = factory.get('/dashboard/')
    force_authenticate(req1, user=owner_user)
    res1 = view(req1)
    print(f"1. All Branches status: {res1.status_code}")
    if res1.status_code == 200:
        top_services = res1.data.get('analytics', {}).get('top_services', [])
        print(f"   Top services count: {len(top_services)}")
        print(f"   Revenue total: {res1.data.get('stats', {}).get('total_revenue')}")

    # 2. Individual Branch
    branch = Branch.objects.first()
    if branch:
        req2 = factory.get(f'/dashboard/?branch_id={branch.id}&branch={branch.name}')
        force_authenticate(req2, user=owner_user)
        res2 = view(req2)
        print(f"2. Individual Branch ({branch.name}) status: {res2.status_code}")
        if res2.status_code == 200:
            top_services_b = res2.data.get('analytics', {}).get('top_services', [])
            print(f"   Top services for branch count: {len(top_services_b)}")
            print(f"   Branch revenue: {res2.data.get('stats', {}).get('total_revenue')}")

    # 3. Empty / Non-existent branch
    req3 = factory.get('/dashboard/?branch=NonExistentBranch999')
    force_authenticate(req3, user=owner_user)
    res3 = view(req3)
    print(f"3. Non-existent branch status: {res3.status_code}")
    if res3.status_code == 200:
        print(f"   Clean empty state handled. Top services: {res3.data.get('analytics', {}).get('top_services', [])}")

    # 4. Owner Branch List
    owner_branch_view = OwnerBranchListView.as_view()
    req4 = factory.get('/owner/branches/')
    force_authenticate(req4, user=owner_user)
    res4 = owner_branch_view(req4)
    print(f"4. Owner Branch List status: {res4.status_code}, branch count: {len(res4.data) if isinstance(res4.data, list) else 0}")

if __name__ == '__main__':
    verify_dashboard_services_analytics()

