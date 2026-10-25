import sys
sys.stdout.reconfigure(encoding='utf-8')
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from api.models import Staff
from api.views.auth_views import LoginView, _get_profile_data, _normalize_role

User = get_user_model()

print("Listing all users and checking their staff profiles:")
for u in User.objects.all():
    staff = getattr(u, 'staff_profile', None)
    role_db = staff.role if staff else None
    role_norm, f_name, l_name, suffix, phone, pic = _get_profile_data(u)
    print(f"ID={u.id} | Email={u.email} | is_staff={u.is_staff} | is_superuser={u.is_superuser} | Staff.role={role_db} | _get_profile_data role={role_norm}")

# Check password hashes or test common passwords
passwords_to_test = ["Password123!", "Admin123!", "Password123", "password", "12345678", "admin", "owner", "employee", "superadmin"]

for email in ["admin@avica.local", "owner@avica.local", "employee@avica.local"]:
    user = User.objects.filter(email=email).first()
    if user:
        matched = []
        for p in passwords_to_test:
            if user.check_password(p):
                matched.append(p)
        print(f"User {email} password matched: {matched}")

# Test LoginView for admin@avica.local and owner@avica.local
factory = APIRequestFactory()
login_view = LoginView.as_view()

for email in ["admin@avica.local", "owner@avica.local", "employee@avica.local"]:
    user = User.objects.filter(email=email).first()
    # find working password
    working_pwd = None
    for p in passwords_to_test:
        if user and user.check_password(p):
            working_pwd = p
            break
    if working_pwd:
        req = factory.post('/login/', {'email': email, 'password': working_pwd}, format='json')
        res = login_view(req)
        print(f"LoginView for {email} status={res.status_code}:")
        if res.status_code == 200:
            print(f"  user: {res.data.get('user')}")
            print(f"  token access length: {len(res.data.get('tokens', {}).get('access', ''))}")
        else:
            print(f"  data: {res.data}")

