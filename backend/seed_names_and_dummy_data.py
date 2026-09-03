import os
import django
from datetime import timedelta, date
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
from api.models import Staff, Customer, User, Branch, Booking, QueueEntry, PaymentTransaction, Rating

# ── 1. Update Staff Names ──────────────────────────────────────────────────
staff_updates = {
    8: {'first_name': 'Eduardo', 'last_name': 'Ramos'},
    9: {'first_name': 'Ricardo', 'last_name': 'Dizon'},
    10: {'first_name': 'Mark Anthony', 'last_name': 'Reyes'},
    11: {'first_name': 'Arnel', 'last_name': 'Mendoza'},
    12: {'first_name': 'Christian', 'last_name': 'Dela Cruz'},
    13: {'first_name': 'Alexander', 'last_name': 'Morales'},
    14: {'first_name': 'Alexander', 'last_name': 'Morales'},
    15: {'first_name': 'Rodrigo', 'last_name': 'Santos'},
    16: {'first_name': 'Vicente', 'last_name': 'Tan'},
    17: {'first_name': 'Mateo', 'last_name': 'Alcantara'},
    18: {'first_name': 'Jerome', 'last_name': 'Bautista'},
    19: {'first_name': 'Danilo', 'last_name': 'Ramos'},
    20: {'first_name': 'Gabriel', 'last_name': 'Soriano'},
    21: {'first_name': 'Rommel', 'last_name': 'Navarro'},
}

for staff_id, names in staff_updates.items():
    staff = Staff.objects.filter(id=staff_id).first()
    if staff:
        staff.first_name = names['first_name']
        staff.last_name = names['last_name']
        staff.save(update_fields=['first_name', 'last_name'])
        print(f"Updated Staff #{staff_id} to {staff.first_name} {staff.last_name}")

# Also replace any other staff with "Example" or "Account" in name
for s in Staff.objects.all():
    changed = False
    if "Example" in s.last_name or "Account" in s.last_name:
        s.first_name = "Christian"
        s.last_name = "Bautista"
        changed = True
    elif "Staff" in s.first_name:
        s.first_name = "Jerome"
        changed = True
    elif "Manager" in s.first_name:
        s.first_name = "Ricardo"
        changed = True
    elif "Employee" in s.first_name:
        s.first_name = "Arnel"
        changed = True
    if changed:
        s.save()
        print(f"Sanitized Staff #{s.id} to {s.first_name} {s.last_name}")

# ── 2. Update Customer Names ───────────────────────────────────────────────
cust_updates = {
    1: {'first_name': 'Maria Clara', 'last_name': 'Santos'},
    4: {'first_name': 'Juan', 'last_name': 'Dela Cruz'},
}

for cust_id, names in cust_updates.items():
    c = Customer.objects.filter(id=cust_id).first()
    if c:
        c.first_name = names['first_name']
        c.last_name = names['last_name']
        c.save(update_fields=['first_name', 'last_name'])
        print(f"Updated Customer #{cust_id} to {c.first_name} {c.last_name}")

# Also check for any other customer with John Doe
for c in Customer.objects.filter(first_name__icontains="John", last_name__icontains="Doe"):
    c.first_name = "Juan"
    c.last_name = "Dela Cruz"
    c.save(update_fields=['first_name', 'last_name'])
    print(f"Sanitized Customer #{c.id} to Juan Dela Cruz")

# ── 3. Seed Realistic Multi-Branch Operational Data ────────────────────────
branches = list(Branch.objects.filter(is_active=True))
juan_user = Customer.objects.filter(first_name="Juan").first()
if juan_user:
    juan_user = juan_user.user
else:
    juan_user = User.objects.filter(customer_profile__isnull=False).first()

maria_user = Customer.objects.filter(first_name="Maria Clara").first()
if maria_user:
    maria_user = maria_user.user
else:
    maria_user = User.objects.filter(customer_profile__isnull=False).last()

now = timezone.now()

services_list = [
    ("Premium Carwash", Decimal("250.00")),
    ("Premium Hand Wax", Decimal("450.00")),
    ("Engine Steamed Wash", Decimal("650.00")),
    ("Interior Detailing", Decimal("2500.00")),
    ("Exterior Detailing", Decimal("3000.00")),
    ("Ceramic Coating", Decimal("8500.00")),
    ("Under Wash", Decimal("350.00")),
    ("Acid Rain Removal (Glass)", Decimal("800.00")),
]

vehicles = [
    ("Toyota Vios 2022", "small", "NBD 4821"),
    ("Mitsubishi Montero Sport 2023", "medium", "DAR 9201"),
    ("Ford Ranger Raptor 2021", "large", "CAE 7712"),
    ("Honda Civic RS 2020", "small", "WQI 5542"),
    ("Toyota Fortuner GR-S 2024", "medium", "XYZ 8839"),
]

for idx, b in enumerate(branches):
    staff_member = b.staff_members.first()
    # Create 3-5 completed bookings per branch over past 30 days
    for day_offset in [1, 3, 7, 12, 18, 25]:
        svc_name, svc_price = services_list[(idx + day_offset) % len(services_list)]
        veh_name, veh_size, plate = vehicles[(idx + day_offset) % len(vehicles)]
        target_user = juan_user if day_offset % 2 == 0 else maria_user
        if not target_user:
            continue
            
        booking_date = (now - timedelta(days=day_offset)).date()
        booking_dt = now - timedelta(days=day_offset, hours=2)
        
        booking, created = Booking.objects.get_or_create(
            user=target_user,
            branch=b,
            date=booking_date,
            service=svc_name,
            defaults={
                'time': '10:00 AM',
                'price': svc_price,
                'vehicle': veh_name,
                'vehicle_size': veh_size,
                'plate_number': plate,
                'status': 'done',
                'staff': f"{staff_member.first_name} {staff_member.last_name}" if staff_member else "Staff",
            }
        )
        
        queue, _ = QueueEntry.objects.get_or_create(
            booking=booking,
            defaults={
                'branch': b,
                'branch_name': b.name,
                'customer_user': target_user,
                'customer_name': f"{target_user.customer_profile.first_name} {target_user.customer_profile.last_name}" if hasattr(target_user, 'customer_profile') else "Customer",
                'service': svc_name,
                'price': svc_price,
                'status': 'done',
                'payment_status': 'paid',
                'completed_at': booking_dt,
                'queued_at': booking_dt - timedelta(minutes=45),
                'assigned_employee': staff_member,
            }
        )
        
        PaymentTransaction.objects.get_or_create(
            queue_entry=queue,
            defaults={
                'branch': b,
                'staff': staff_member,
                'transaction_type': 'service',
                'description': svc_name,
                'quantity': 1,
                'amount': svc_price,
                'payment_method': 'Cash',
                'paid_at': booking_dt,
            }
        )
        
        if hasattr(target_user, 'customer_profile'):
            Rating.objects.get_or_create(
                booking=booking,
                defaults={
                    'customer': target_user.customer_profile,
                    'branch': b,
                    'score': 5 if day_offset % 3 != 0 else 4,
                    'comment': 'Napaka-ayos ng linis at mababait ang mga staff!',
                    'response_status': 'responded',
                    'responded_at': booking_dt + timedelta(hours=1),
                    'responded_by': staff_member,
                }
            )

print("Successfully seeded realistic Filipino staff names, customer records, and branch comparative operational data!")
