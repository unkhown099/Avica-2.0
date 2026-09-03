import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import InventoryItem, Branch, InventoryTransaction

products_data = [
    {
        'name': 'Otokwikk Ultra Foam Car Shampoo (1L)',
        'category': 'Other',
        'sku_base': 'OTK-SHMP-1L',
        'unit': 'Bottle',
        'price': 320.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 250,
        'branch_qty': 30,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Hydrophobic Ceramic Spray Wax (500ml)',
        'category': 'Other',
        'sku_base': 'OTK-WAX-500',
        'unit': 'Bottle',
        'price': 650.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 200,
        'branch_qty': 25,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Deep Clean Engine Degreaser (1L)',
        'category': 'Other',
        'sku_base': 'OTK-ENDEG-1L',
        'unit': 'Bottle',
        'price': 350.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 150,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Glass Watermark Remover & Rain Guard (250ml)',
        'category': 'Other',
        'sku_base': 'OTK-GLSWM-250',
        'unit': 'Bottle',
        'price': 380.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 180,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Tire Black & Gloss Conditioning Gel (500ml)',
        'category': 'Tires',
        'sku_base': 'OTK-TIRBG-500',
        'unit': 'Bottle',
        'price': 280.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 300,
        'branch_qty': 40,
        'min_qty': 8,
    },
    {
        'name': 'Otokwikk Leather & Vinyl Interior Dressing (500ml)',
        'category': 'Other',
        'sku_base': 'OTK-LTHDR-500',
        'unit': 'Bottle',
        'price': 450.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 160,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Edgeless Plush Microfiber Towel Set (3 pcs)',
        'category': 'Other',
        'sku_base': 'OTK-MFTOW-3PK',
        'unit': 'Pack',
        'price': 250.00,
        'supplier': 'Otokwikk Accessories',
        'central_qty': 400,
        'branch_qty': 50,
        'min_qty': 10,
    },
    {
        'name': 'Otokwikk Fully Synthetic Engine Oil 5W-40 (4L)',
        'category': 'Lubricants',
        'sku_base': 'OTK-FS5W40-4L',
        'unit': 'Gallon',
        'price': 1850.00,
        'supplier': 'Otokwikk Lubricants Philippines',
        'central_qty': 120,
        'branch_qty': 15,
        'min_qty': 4,
    },
    {
        'name': 'Otokwikk Semi-Synthetic Engine Oil 10W-40 (1L)',
        'category': 'Lubricants',
        'sku_base': 'OTK-SS10W40-1L',
        'unit': 'Liter',
        'price': 420.00,
        'supplier': 'Otokwikk Lubricants Philippines',
        'central_qty': 240,
        'branch_qty': 35,
        'min_qty': 6,
    },
    {
        'name': 'Otokwikk Heavy-Duty Brake Fluid DOT 4 (500ml)',
        'category': 'Brakes',
        'sku_base': 'OTK-DOT4-500',
        'unit': 'Bottle',
        'price': 290.00,
        'supplier': 'Otokwikk Brake Systems',
        'central_qty': 200,
        'branch_qty': 25,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Ceramic Brake Pads Pro (Front Set)',
        'category': 'Brakes',
        'sku_base': 'OTK-BRKPD-FRT',
        'unit': 'Set',
        'price': 1450.00,
        'supplier': 'Otokwikk Brake Systems',
        'central_qty': 80,
        'branch_qty': 10,
        'min_qty': 3,
    },
    {
        'name': 'Otokwikk High-Efficiency Air Filter Element',
        'category': 'Filters',
        'sku_base': 'OTK-AIRFL-01',
        'unit': 'Pieces',
        'price': 450.00,
        'supplier': 'Otokwikk Filtration',
        'central_qty': 150,
        'branch_qty': 20,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Premium Spin-On Oil Filter',
        'category': 'Filters',
        'sku_base': 'OTK-OILFL-01',
        'unit': 'Pieces',
        'price': 280.00,
        'supplier': 'Otokwikk Filtration',
        'central_qty': 250,
        'branch_qty': 30,
        'min_qty': 6,
    },
    {
        'name': 'Otokwikk Long Life Radiator Coolant 50/50 Pre-Mix (2L)',
        'category': 'Lubricants',
        'sku_base': 'OTK-COOL-2L',
        'unit': 'Bottle',
        'price': 380.00,
        'supplier': 'Otokwikk Auto Chem Lab',
        'central_qty': 180,
        'branch_qty': 25,
        'min_qty': 5,
    },
    {
        'name': 'Otokwikk Iridium Power Spark Plug (Set of 4)',
        'category': 'Ignition',
        'sku_base': 'OTK-SPKPL-4PK',
        'unit': 'Pack',
        'price': 1200.00,
        'supplier': 'Otokwikk Performance Parts',
        'central_qty': 100,
        'branch_qty': 12,
        'min_qty': 3,
    },
    {
        'name': 'Otokwikk Maintenance-Free 12V High-Cranking Battery (55Ah)',
        'category': 'Batteries',
        'sku_base': 'OTK-BAT55AH-12V',
        'unit': 'Pieces',
        'price': 4200.00,
        'supplier': 'Otokwikk Power Systems',
        'central_qty': 50,
        'branch_qty': 8,
        'min_qty': 2,
    },
    {
        'name': 'Otokwikk Odor Eliminator & AC Air Freshener Spray (200ml)',
        'category': 'Other',
        'sku_base': 'OTK-ACFRSH-200',
        'unit': 'Bottle',
        'price': 220.00,
        'supplier': 'Otokwikk Auto Care Lab',
        'central_qty': 300,
        'branch_qty': 35,
        'min_qty': 8,
    },
    {
        'name': 'Otokwikk All-Weather Heavy Duty Rubber Car Mat (4pc Set)',
        'category': 'Other',
        'sku_base': 'OTK-RBMAT-4PC',
        'unit': 'Set',
        'price': 1650.00,
        'supplier': 'Otokwikk Accessories',
        'central_qty': 60,
        'branch_qty': 8,
        'min_qty': 2,
    },
]

branches = list(Branch.objects.all())
created_count = 0

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
