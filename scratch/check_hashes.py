import os, sys
sys.path.insert(0, 'backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from api.models import User
emp = User.objects.get(email='employee@avica.local')
print("Employee password hash:", emp.password)

admin = User.objects.get(email='admin@avica.local')
print("Admin password hash:", admin.password)

owner = User.objects.get(email='owner@avica.local')
print("Owner password hash:", owner.password)

manager = User.objects.get(email='manager@avica.local')
print("Manager password hash:", manager.password)

