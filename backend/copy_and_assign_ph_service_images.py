import os
import shutil
import glob
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.conf import settings
from api.models import Service

MEDIA_SERVICE_DIR = os.path.join(settings.MEDIA_ROOT, "service_images")
os.makedirs(MEDIA_SERVICE_DIR, exist_ok=True)

ARTIFACT_DIR = r"C:\Users\admin\.gemini\antigravity-ide\brain\24d0b184-2b78-478b-b770-b91018af7fd1"

# Find latest generated files by prefix
def find_latest_image(prefix):
    matches = glob.glob(os.path.join(ARTIFACT_DIR, f"{prefix}*.jpg"))
    if not matches:
        return None
    matches.sort(key=os.path.getmtime, reverse=True)
    return matches[0]

MAPPING = {
    "Premium Carwash": ("ph_carwash_vios", "ph_carwash_vios.jpg"),
    "Engine Steamed Wash": ("ph_engine_wash", "ph_engine_wash.jpg"),
    "Under Wash": ("ph_under_wash", "ph_under_wash.jpg"),
    "Premium Hand Wax": ("ph_hand_wax", "ph_hand_wax.jpg"),
    "Buffing": ("ph_buffing_polishing", "ph_buffing_polishing.jpg"),
    "Headlight Restoration": ("ph_headlight_resto", "ph_headlight_resto.jpg"),
    "Interior Detailing": ("ph_interior_detailing", "ph_interior_detailing.jpg"),
    "Exterior Detailing": ("ph_buffing_polishing", "ph_exterior_detailing.jpg"),
    "Acid Rain Removal (Glass)": ("ph_acid_rain_glass", "ph_acid_rain_glass.jpg"),
    "All Shine": ("ph_hand_wax", "ph_all_shine.jpg"),
    "Ceramic Coating": ("ph_ceramic_coating", "ph_ceramic_coating.jpg"),
    # PMS Services
    "5,000 KM Minor PMS Checkup": ("ph_change_oil_pms", "ph_pms_5k.jpg"),
    "10,000 KM Standard PMS Service": ("ph_change_oil_pms", "ph_pms_10k.jpg"),
    "20,000 KM Intermediate PMS Service": ("ph_change_oil_pms", "ph_pms_20k.jpg"),
    "40,000 KM Major PMS Overhaul": ("ph_engine_wash", "ph_pms_40k.jpg"),
    "60,000 KM High-Mileage PMS Protection": ("ph_brake_service_pms", "ph_pms_60k.jpg"),
    "80,000 KM Milestone PMS Service": ("ph_engine_wash", "ph_pms_80k.jpg"),
    "Change Oil & Filter Package (Basic PMS)": ("ph_change_oil_pms", "ph_change_oil.jpg"),
    "Brake System PMS Service & Fluid Flush": ("ph_brake_service_pms", "ph_brake_service.jpg"),
}

print("=== COPYING & ASSIGNING PHILIPPINE SERVICE IMAGES ===")
for service_name, (prefix, dest_name) in MAPPING.items():
    src_file = find_latest_image(prefix)
    if not src_file or not os.path.exists(src_file):
        print(f"[MISSING SRC] {prefix} for {service_name}")
        continue
    
    dest_path = os.path.join(MEDIA_SERVICE_DIR, dest_name)
    shutil.copy2(src_file, dest_path)
    
    # Update Django database
    relative_path = f"service_images/{dest_name}"
    services = Service.objects.filter(name=service_name)
    if services.exists():
        for s in services:
            s.image = relative_path
            s.save()
            print(f"[UPDATED] {s.name:45} -> {relative_path}")
    else:
        print(f"[NOT FOUND IN DB] {service_name}")

print("\nDone updating service images!")
