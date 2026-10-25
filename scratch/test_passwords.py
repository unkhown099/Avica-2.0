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

from django.contrib.auth import get_user_model, authenticate
from api.models import Staff
from api.views.auth_views import LoginView, _get_profile_data
from rest_framework.test import APIRequestFactory

User = get_user_model()

print("Listing all users:")
for u in User.objects.all():
    staff = Staff.objects.filter(user=u).first()
    print(f"ID={u.id} | Email={u.email} | is_active={u.is_active} | staff={staff.role if staff else None}")

# Check what passwords match
candidates = [
    "Password123!", "Admin123!", "admin123", "Admin@123", "Admin123",
    "password123", "password", "12345678", "admin", "owner", "manager",
    "employee", "superadmin", "Otokwikk123!", "Avica123!", "Avica2024!",
    "P@ssword123", "P@ssw0rd123!", "Welcome123!"
]

users_to_check = ["admin@avica.local", "manager@avica.local", "owner@avica.local", "employee@avica.local"]
for email in users_to_check:
    user = User.objects.filter(email=email).first()
    if user:
        found = []
        for p in candidates:
            if user.check_password(p):
                found.append(p)
        print(f"User {email} matches: {found} (password hash: {user.password[:20]}...)")

