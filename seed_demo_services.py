
import os
import sys
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
os.environ["DJANGO_SETTINGS_MODULE"] = "backend.settings"

django.setup()

from api.models import Branch, Service, ServiceCategory

branch = Branch.objects.get(name="Saranay Branch")

demo_services = [
    {
        "name": "DEMO - Basic Vehicle Inspection",
        "category": "Diagnostic",
        "description": "Demo service for checking basic vehicle condition and identifying potential issues.",
        "price": 500,
    },
    {
        "name": "DEMO - Engine Maintenance",
        "category": "Maintenance",
        "description": "Demo service for routine engine maintenance and inspection.",
        "price": 1200,
    },
    {
        "name": "DEMO - Exterior Repair",
        "category": "Repair",
        "description": "Demo service for minor exterior vehicle repairs.",
        "price": 1800,
    },
    {
        "name": "DEMO - Cosmetic Detailing",
        "category": "Cosmetic",
        "description": "Demo service for exterior cleaning and cosmetic detailing.",
        "price": 900,
    },
]

created_count = 0

for item in demo_services:
    category = ServiceCategory.objects.get(name=item["category"])
    service, created = Service.objects.get_or_create(
        name=item["name"],
        defaults={
            "category": category,
            "description": item["description"],
            "price": item["price"],
            "is_active": True,
        },
    )
    service.branches.add(branch)
    if created:
        created_count += 1

print(f"Demo services newly created: {created_count}")
print("\n=== DEMO SERVICES ===")

for service in Service.objects.prefetch_related("branches").filter(
    name__startswith="DEMO -"
):
    print(
        service.name,
        "| Category:", service.category,
        "| Price:", service.price,
        "| Active:", service.is_active,
        "| Branches:", list(service.branches.values_list("name", flat=True)),
    )
