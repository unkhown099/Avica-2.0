import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Service, ServiceCategory, Branch

# Official Otokwikk Auto Service Center Pricelist
OTOKWIKK_PRICELIST = [
    {
        "name": "Premium Carwash",
        "category": "Maintenance",
        "duration": "30-45 mins",
        "description": "• High-pressure snow foam wash\n• Deep wheel & wheel well cleaning\n• Interior vacuum & dashboard wipe down\n• Tire black shine dressing",
        "image": "service_images/premium_carwash.jpg",
        "price_list": {
            "motor": 100.0,
            "small": 150.0,
            "medium": 190.0,
            "large": 220.0,
            "xl": 250.0,
        },
    },
    {
        "name": "Engine Steamed Wash",
        "category": "Maintenance",
        "duration": "45-60 mins",
        "description": "• High-temperature steam degreasing\n• Engine bay grime & oil sludge removal\n• Safe on electronics & wire harnesses\n• Protective non-sticky engine dressing",
        "image": "service_images/engine_steamed_wash.jpg",
        "price_list": {
            "small": 500.0,
            "medium": 550.0,
            "large": 600.0,
            "xl": 650.0,
        },
    },
    {
        "name": "Under Wash",
        "category": "Maintenance",
        "duration": "30-45 mins",
        "description": "• High-pressure underchassis blast\n• Road grime, salt & mud removal\n• Comprehensive chassis rust prevention check\n• Exhaust & suspension rinse",
        "image": "service_images/under_wash.jpg",
        "price_list": {
            "small": 400.0,
            "medium": 450.0,
            "large": 500.0,
            "xl": 550.0,
        },
    },
    {
        "name": "Premium Hand Wax",
        "category": "Cosmetic",
        "duration": "45-60 mins",
        "description": "• Grade-A Brazilian carnauba paste wax\n• Hand-buffed deep optical paint gloss\n• Hydrophobic water-beading layer\n• UV protection against solar oxidation",
        "image": "service_images/premium_hand_wax.jpg",
        "price_list": {
            "small": 500.0,
            "medium": 550.0,
            "large": 600.0,
            "xl": 650.0,
        },
    },
    {
        "name": "Buffing",
        "category": "Cosmetic",
        "duration": "1.5 - 2 hrs",
        "description": "• Dual-action orbital machine buffing\n• Light scratch & micro-swirl correction\n• Clearcoat clarity restoration\n• High-gloss finishing glaze",
        "image": "service_images/buffing.jpg",
        "price_list": {
            "small": 1100.0,
            "medium": 1300.0,
            "large": 1500.0,
            "xl": 1700.0,
        },
    },
    {
        "name": "Headlight Restoration",
        "category": "Cosmetic",
        "duration": "45-60 mins",
        "description": "• Removes yellowing, haze & UV lens oxidation\n• Multi-stage precision wet sanding\n• Optical compound & polish\n• UV-resistant sealant clear protection",
        "image": "service_images/headlight_restoration.jpg",
        "price_list": {
            "small": 750.0,
            "medium": 750.0,
            "large": 750.0,
            "xl": 750.0,
        },
    },
    {
        "name": "Interior Detailing",
        "category": "Cosmetic",
        "duration": "3 - 4 hrs",
        "description": "• Full fabric & leather deep shampoo extraction\n• Ceiling, pillar & trunk steam cleaning\n• Dashboard, console & door panel conditioning\n• Anti-bacterial odor elimination treatment",
        "image": "service_images/interior_detailing.jpg",
        "price_list": {
            "small": 3000.0,
            "medium": 3500.0,
            "large": 4000.0,
            "xl": 4500.0,
        },
    },
    {
        "name": "Exterior Detailing",
        "category": "Cosmetic",
        "duration": "3 - 4 hrs",
        "description": "• Fine clay bar chemical decontamination\n• 2-stage paint cut & polish correction\n• Rim, wheel well & trim restoration\n• Long-lasting paint sealant shield",
        "image": "service_images/exterior_detailing.jpg",
        "price_list": {
            "small": 3500.0,
            "medium": 4000.0,
            "large": 4500.0,
            "xl": 5000.0,
        },
    },
    {
        "name": "Acid Rain Removal (Glass)",
        "category": "Cosmetic",
        "duration": "1 - 1.5 hrs",
        "description": "• Eliminates mineral watermarks & calcium etching\n• Restores crystal clear windshield visibility\n• Glass polish & deep degreasing\n• Rain-repellent hydrophobic treatment",
        "image": "service_images/acid_rain_removal_glass.jpg",
        "price_list": {
            "small": 1000.0,
            "medium": 1200.0,
            "large": 1400.0,
            "xl": 1600.0,
        },
    },
    {
        "name": "All Shine",
        "category": "Cosmetic",
        "duration": "20-30 mins",
        "description": "• Exterior plastic & rubber trim rejuvenation\n• Tire & mag wheel high-gloss shine\n• Engine shroud & cover dressing\n• Interior vinyl & leather protectant",
        "image": "service_images/all_shine.jpg",
        "price_list": {
            "motor": 50.0,
            "small": 100.0,
            "medium": 150.0,
            "large": 200.0,
            "xl": 250.0,
        },
    },
    {
        "name": "Ceramic Coating",
        "category": "Cosmetic",
        "duration": "1 - 2 days",
        "description": "• 9H hardness nano-ceramic coating\n• Multi-year hydrophobic & chemical protection\n• Extreme mirror reflection & gloss\n• Full multi-stage paint preparation included",
        "image": "service_images/ceramic_coating.jpg",
        "price_list": {
            "motor": 2500.0,
            "small": 8999.0,
            "medium": 11999.0,
            "large": 14999.0,
            "xl": 15999.0,
        },
    },
]

def seed_services():
    print("=== SEEDING OTOKWIKK OFFICIAL SERVICES & PRICELIST ===")
    
    # Ensure categories exist
    for cat_name in ["Maintenance", "Cosmetic", "Repair", "Diagnostic"]:
        ServiceCategory.objects.get_or_create(name=cat_name)
    
    all_branches = list(Branch.objects.all())
    print(f"Found {len(all_branches)} branches in database.")

    for item in OTOKWIKK_PRICELIST:
        price_list = item["price_list"]
        # Base price is the minimum tier price (or starting small price)
        values = [float(v) for v in price_list.values() if v is not None]
        base_price = min(values) if values else 0.0

        service, created = Service.objects.update_or_create(
            name=item["name"],
            defaults={
                "category": item["category"],
                "duration": item["duration"],
                "description": item["description"],
                "image": item["image"],
                "price": base_price,
                "price_list": price_list,
                "is_active": True,
            }
        )

        # Attach all active branches
        if all_branches:
            service.branches.set(all_branches)

        action = "CREATED" if created else "UPDATED"
        print(f"[{action}] {service.name:<30} | Cat: {service.category:<12} | Base: PHP {service.price:,.2f} | Tiers: {list(price_list.keys())}")

    total_services = Service.objects.filter(is_active=True).count()
    print(f"\nTotal active services now in database: {total_services}")

if __name__ == "__main__":
    seed_services()
