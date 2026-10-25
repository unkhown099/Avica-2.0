import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import InventoryItem, Branch

products_data = [
    {
        'name': 'Otokwikk Car Soap (High-Foam Snow Wash 1L)',
        'category': 'Other',
        'sku_base': 'OTK-CSOAP-1L',
        'unit': 'Bottle',
        'price': 250.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 300,
        'branch_qty': 35,
        'min_qty': 8,
    },
    {
        'name': 'Otokwikk Car Soap with Carnauba Wax (1 Gallon)',
        'category': 'Other',
        'sku_base': 'OTK-CSOAP-1GL',
        'unit': 'Gallon',
        'price': 750.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 200,
        'branch_qty': 25,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Ceramic Coating 9H Pro Kit (50ml)',
        'category': 'Other',
        'sku_base': 'OTK-CERAM-50ML',
        'unit': 'Box',
        'price': 2800.00,
        'supplier': 'Otokwikk Detailing Labs',
        'central_qty': 120,
        'branch_qty': 15,
        'min_qty': 3,
    },
    {
        'name': 'Otokwikk Quick Detailer & Gloss Enhancer (500ml)',
        'category': 'Other',
        'sku_base': 'OTK-QDET-500ML',
        'unit': 'Bottle',
        'price': 380.00,
        'supplier': 'Otokwikk Detailing Labs',
        'central_qty': 220,
        'branch_qty': 30,
        'min_qty': 6,
    },
    {
        'name': 'Otokwikk Acid Rain Remover Solution (250ml)',
        'category': 'Other',
        'sku_base': 'OTK-ARAIN-250ML',
        'unit': 'Bottle',
        'price': 350.00,
        'supplier': 'Otokwikk Auto Chem',
        'central_qty': 180,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Headlight Restoration Compound (250ml)',
        'category': 'Other',
        'sku_base': 'OTK-HDLT-250ML',
        'unit': 'Bottle',
        'price': 320.00,
        'supplier': 'Otokwikk Auto Chem',
        'central_qty': 160,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Engine Degreaser & Cleaner (1L)',
        'category': 'Other',
        'sku_base': 'OTK-EDEG-1L',
        'unit': 'Bottle',
        'price': 340.00,
        'supplier': 'Otokwikk Auto Chem',
        'central_qty': 190,
        'branch_qty': 25,
        'min_qty': 6,
    },
    {
        'name': 'Otokwikk Undercoat Rubberized Underwash Spray (500ml)',
        'category': 'Other',
        'sku_base': 'OTK-UCOAT-500ML',
        'unit': 'Can',
        'price': 420.00,
        'supplier': 'Otokwikk Auto Chem',
        'central_qty': 150,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Premium Buffing & Polishing Compound (1L)',
        'category': 'Other',
        'sku_base': 'OTK-BUFF-1L',
        'unit': 'Bottle',
        'price': 950.00,
        'supplier': 'Otokwikk Detailing Labs',
        'central_qty': 130,
        'branch_qty': 18,
        'min_qty': 4,
    },
    {
        'name': 'Otokwikk All Shine Tire Black Gel (500ml)',
        'category': 'Tires',
        'sku_base': 'OTK-TSHINE-500ML',
        'unit': 'Bottle',
        'price': 260.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 350,
        'branch_qty': 45,
        'min_qty': 10,
    },
    {
        'name': 'Otokwikk Interior Leather & Vinyl Conditioner (500ml)',
        'category': 'Other',
        'sku_base': 'OTK-INTL-500ML',
        'unit': 'Bottle',
        'price': 420.00,
        'supplier': 'Otokwikk Detailing Labs',
        'central_qty': 170,
        'branch_qty': 22,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Edgeless Plush Microfiber Towels (3-Pack)',
        'category': 'Other',
        'sku_base': 'OTK-MFT-3PK',
        'unit': 'Pack',
        'price': 220.00,
        'supplier': 'Otokwikk Accessories',
        'central_qty': 400,
        'branch_qty': 50,
        'min_qty': 12,
    },
    {
        'name': 'Otokwikk Odor Eliminator & AC Freshener Mist (250ml)',
        'category': 'Other',
        'sku_base': 'OTK-AIRF-250ML',
        'unit': 'Bottle',
        'price': 190.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 320,
        'branch_qty': 40,
        'min_qty': 8,
    },
    {
        'name': 'Otokwikk Clay Bar Surface Prep Bar (200g)',
        'category': 'Other',
        'sku_base': 'OTK-CLAY-200G',
        'unit': 'Pieces',
        'price': 280.00,
        'supplier': 'Otokwikk Detailing Labs',
        'central_qty': 180,
        'branch_qty': 24,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Microfiber Chenille Wash Mitt',
        'category': 'Other',
        'sku_base': 'OTK-WMITT-01',
        'unit': 'Pieces',
        'price': 160.00,
        'supplier': 'Otokwikk Accessories',
        'central_qty': 280,
        'branch_qty': 35,
        'min_qty': 8,
    },
    {
        'name': 'Otokwikk Fully Synthetic Engine Oil 5W-40 (4L)',
        'category': 'Lubricants',
        'sku_base': 'OTK-OIL5W40-4L',
        'unit': 'Gallon',
        'price': 1850.00,
        'supplier': 'Otokwikk Lubricants Philippines',
        'central_qty': 140,
        'branch_qty': 16,
        'min_qty': 4,
    },
    {
        'name': 'Otokwikk Semi-Synthetic Engine Oil 10W-40 (1L)',
        'category': 'Lubricants',
        'sku_base': 'OTK-OIL10W40-1L',
        'unit': 'Liter',
        'price': 420.00,
        'supplier': 'Otokwikk Lubricants Philippines',
        'central_qty': 260,
        'branch_qty': 35,
        'min_qty': 6,
    },
    {
        'name': 'Otokwikk Long Life Radiator Coolant 50/50 (2L)',
        'category': 'Lubricants',
        'sku_base': 'OTK-COOL-2L',
        'unit': 'Bottle',
        'price': 380.00,
        'supplier': 'Otokwikk Auto Chem',
        'central_qty': 190,
        'branch_qty': 25,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Heavy-Duty Brake Fluid DOT 4 (500ml)',
        'category': 'Brakes',
        'sku_base': 'OTK-BFDOT4-500ML',
        'unit': 'Bottle',
        'price': 290.00,
        'supplier': 'Otokwikk Brake Systems',
        'central_qty': 210,
        'branch_qty': 28,
        'min_qty': 6,
    },
    {
        'name': 'Otokwikk Premium Spin-On Oil Filter',
        'category': 'Filters',
        'sku_base': 'OTK-OFIL-01',
        'unit': 'Pieces',
        'price': 280.00,
        'supplier': 'Otokwikk Filtration',
        'central_qty': 260,
        'branch_qty': 32,
        'min_qty': 6,
    },
]

def seed_products():
    branches = list(Branch.objects.filter(is_active=True))
    created_count = 0

    # Clean old/stale inventory items to ensure only authentic Otokwikk products exist
    current_skus = set()
    for p in products_data:
        current_skus.add(p['sku_base'])
        for b in branches:
            current_skus.add(f"{p['sku_base']}-B{b.id}")

    # Remove items not in current_skus to avoid mixing old dummy entries
    deleted_old, _ = InventoryItem.objects.exclude(sku__in=current_skus).delete()
    if deleted_old:
        print(f"Removed {deleted_old} obsolete inventory items.")

    for p in products_data:
        # 1. Central Item
        central_sku = p['sku_base']
        central_item, _ = InventoryItem.objects.update_or_create(
            sku=central_sku,
            defaults={
                'name': p['name'],
                'category': p['category'],
                'quantity': p['central_qty'],
                'minimum_qty': p['min_qty'],
                'unit': p['unit'],
                'price': p['price'],
                'supplier': p['supplier'],
                'branch': None,
                'is_active': True,
            }
        )
        created_count += 1
        
        # 2. Branch Items for each active branch
        for b in branches:
            branch_sku = f"{p['sku_base']}-B{b.id}"
            branch_item, _ = InventoryItem.objects.update_or_create(
                sku=branch_sku,
                defaults={
                    'name': p['name'],
                    'category': p['category'],
                    'quantity': p['branch_qty'],
                    'minimum_qty': p['min_qty'],
                    'unit': p['unit'],
                    'price': p['price'],
                    'supplier': p['supplier'],
                    'branch': b,
                    'is_active': True,
                }
            )
            created_count += 1

    print(f'Successfully created/updated {created_count} inventory items across Central and {len(branches)} branches!')
    return created_count

if __name__ == '__main__':
    seed_products()
