import os, sys
sys.path.insert(0, 'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

u = User.objects.filter(email__icontains='admin').first()
if u:
    print(f"Admin user: email={u.email}, is_active={u.is_active}, password_hash={u.password}")
else:
    print("No admin user found! All users:")
    for x in User.objects.all():
        print(x.id, x.email, x.is_active)

