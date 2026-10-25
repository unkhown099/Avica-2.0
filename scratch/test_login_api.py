import os, sys
sys.path.insert(0, 'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from rest_framework.test import APIRequestFactory
from api.views.auth_views import LoginView

factory = APIRequestFactory()
view = LoginView.as_view()

accounts = [
    ('admin@avica.local', 'Password123!'),
    ('manager@avica.local', 'Password123!'),
    ('owner@avica.local', 'Password123!'),
    ('employee@avica.local', 'Password123!'),
    ('superadmin@avica.local', 'Password123!'),
]

for email, password in accounts:
    req = factory.post('/login/', {'email': email, 'password': password}, format='json')
    res = view(req)
    print(f"=== {email} === HTTP {res.status_code}")
    if res.status_code == 200:
        u = res.data['user']
        print(f"  Role: {u.get('role')} | Name: {u.get('first_name')} {u.get('last_name')} | Branch ID: {u.get('branch_id')}")
    else:
        print(f"  Failed: {res.data}")

