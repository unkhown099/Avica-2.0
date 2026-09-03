import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Service, ServiceCategory

# Ensure Service Category exists
pms_category_name = "Preventive Maintenance (PMS)"
category_obj, created = ServiceCategory.objects.get_or_create(
    name=pms_category_name
)
print(f"Service Category: {pms_category_name} (Created: {created})")

PMS_SERVICES = [
    {
        "name": "5,000 KM Minor PMS Checkup",
        "category": pms_category_name,
        "description": "Engine Oil & Oil Filter Replacement, 25-Point Multi-point Safety Inspection, Tire Pressure & Tread Check, Battery Voltage & Terminal Cleaning.",
        "price": 1800.00,
        "duration": "1-1.5 hrs",
    },
    {
        "name": "10,000 KM Standard PMS Service",
        "category": pms_category_name,
        "description": "Full Synthetic Engine Oil & Filter Change, Engine Air Filter Cleaning, Front & Rear Brake Caliper Cleaning, Tire Rotation & Wheel Balancing, Underchassis Torque Check.",
        "price": 2800.00,
        "duration": "2 hrs",
    },
    {
        "name": "20,000 KM Intermediate PMS Service",
        "category": pms_category_name,
        "description": "Complete Synthetic Oil Service, AC Cabin Filter Replacement, Spark Plug Gap Check, Brake Cleaning & Moisture Test, Four-Wheel Alignment & Suspension Check.",
        "price": 4200.00,
        "duration": "2.5-3 hrs",
    },
    {
        "name": "40,000 KM Major PMS Overhaul",
        "category": pms_category_name,
        "description": "Full Fluid Flush (Brake Fluid & Radiator Coolant), Throttle Body Decarbonization, Drive Belts & Tensioner Check, Transmission Fluid Replacement, Brake Rotor Check, Engine Bay Detailing.",
        "price": 6500.00,
        "duration": "4-5 hrs",
    },
    {
        "name": "60,000 KM High-Mileage PMS Protection",
        "category": pms_category_name,
        "description": "Iridium Spark Plug Replacement, Fuel Filter / Pump Pressure Inspection, Shock Absorber & Suspension Bushing Testing, Full AC System Sanitization, Ceramic Boost.",
        "price": 8500.00,
        "duration": "5-6 hrs",
    },
    {
        "name": "80,000 KM Milestone PMS Service",
        "category": pms_category_name,
        "description": "Complete Engine, Transmission, Differential Fluid Flush, Timing Chain Inspection, Water Pump & Thermostat Check, Alternator & Starter Diagnostic, Complete Detailing.",
        "price": 11500.00,
        "duration": "6-8 hrs",
    },
    {
        "name": "Change Oil & Filter Package (Basic PMS)",
        "category": pms_category_name,
        "description": "Engine Oil Drain & Refill with Otokwikk Synthetic Oil, Spin-on Filter Replacement, 15-Point Multi-Point Visual Safety Inspection.",
        "price": 1450.00,
        "duration": "45 mins",
    },
    {
        "name": "Brake System PMS Service & Fluid Flush",
        "category": pms_category_name,
        "description": "4-Wheel Brake Caliper Disassembly & Cleaning, Pad Thickness Measurement, Rotor Disc Inspection, DOT 4 Moisture Test & Pressure Bleed.",
        "price": 1600.00,
        "duration": "1.5 hrs",
    },
]

print("\n=== SEEDING PMS SERVICES ===")
for s_data in PMS_SERVICES:
    service, s_created = Service.objects.update_or_create(
        name=s_data["name"],
        defaults={
            "category": s_data["category"],
            "description": s_data["description"],
            "price": s_data["price"],
            "duration": s_data["duration"],
        }
    )
    action = "Created" if s_created else "Updated"
    print(f"[{action}] {service.name} -> PHP {service.price:.2f} ({service.duration})")

print(f"\nTotal Services in Database: {Service.objects.count()}")
