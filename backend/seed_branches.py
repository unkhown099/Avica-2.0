import os
import sys
import django
from decimal import Decimal

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

try:
    from api.models import Branch, Staff, BranchScheduleConfig  # type: ignore
except ImportError:
    from backend.api.models import Branch, Staff, BranchScheduleConfig  # type: ignore

branches_data = [
    {
        "name": "Tanza Cavite",
        "address": "141 De Roman Subd. Daang Amaya 1 , Tanza, Philippines, 4108",
        "fb_url": "https://www.facebook.com/otokwikk.tanzacavite",
        "latitude": Decimal("14.395179200"),
        "longitude": Decimal("120.872726400"),
        "hours": "Mon-Sat 8:00 AM - 6:00 PM",
        "slots": 5,
        "is_active": True,
    },
    {
        "name": "Saranay North Caloocan",
        "address": "Malapitan rd Saranay, Caloocan, Philippines, 1400",
        "fb_url": "https://www.facebook.com/profile.php?id=100090897126761",
        "latitude": Decimal("14.751751000"),
        "longitude": Decimal("121.023191000"),
        "hours": "Mon-Sat 8:00 AM - 6:00 PM",
        "slots": 5,
        "is_active": True,
    },
    {
        "name": "South Caloocan",
        "address": "77 General Tinio Street, Barangay 132 Bagong Barrio West Metro Manila · Caloocan City",
        "fb_url": "https://www.facebook.com/profile.php?id=61572528405228",
        "latitude": Decimal("14.662410000"),
        "longitude": Decimal("120.990040000"),
        "hours": "Mon-Sat 8:00 AM - 6:00 PM",
        "slots": 5,
        "is_active": True,
    },
    {
        "name": "San Mateo Rizal",
        "address": "0186 B General Luna Street Guitnang Bayan 2 San Mateo Rizal",
        "fb_url": "https://www.facebook.com/profile.php?id=61556323569842",
        "latitude": Decimal("14.700973000"),
        "longitude": Decimal("121.126532000"),
        "hours": "Mon-Sat 8:00 AM - 6:00 PM",
        "slots": 5,
        "is_active": True,
    },
    {
        "name": "Camarin North Caloocan",
        "address": "B15 L5 Camarin Rd, Caloocan, Metro Manila",
        "fb_url": "https://www.facebook.com/profile.php?id=61586571534281",
        "latitude": Decimal("14.756690000"),
        "longitude": Decimal("121.048450000"),
        "hours": "Mon-Sat 8:00 AM - 6:00 PM",
        "slots": 5,
        "is_active": True,
    },
]

print("=== SETTING UP 5 OFFICIAL BRANCHES ===")

# If the old placeholder "Caloocan Branch" exists, rename it to "South Caloocan"
placeholder = Branch.objects.filter(name="Caloocan Branch").first()
if placeholder:
    placeholder.name = "South Caloocan"
    placeholder.save()
    print("Renamed placeholder 'Caloocan Branch' to 'South Caloocan'")

created_branches = []
for data in branches_data:
    branch, created = Branch.objects.update_or_create(
        name=data["name"],
        defaults=data
    )
    BranchScheduleConfig.objects.get_or_create(branch=branch)
    created_branches.append(branch)
    action = "Created" if created else "Updated"
    print(f"[{action}] ID {branch.id}: {branch.name} ({branch.address})")

# Re-link any staff to valid branches if branch is None
first_branch = Branch.objects.first()
if first_branch:
    Staff.objects.filter(branch__isnull=True).update(branch=first_branch, branch_name=first_branch.name)

print("\n=== CURRENT BRANCHES IN DATABASE ===")
for b in Branch.objects.all():
    print(f"ID {b.id}: {b.name} | Lat: {b.latitude} | Lng: {b.longitude} | FB: {b.fb_url}")
