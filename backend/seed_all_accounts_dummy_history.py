import os
import sys
import django
from datetime import timedelta, date
from decimal import Decimal
import random

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.utils import timezone
try:
    from api.models import (  # type: ignore
        User, Staff, Customer, Branch, Booking, QueueEntry,
        PaymentTransaction, Rating, RestockRequest, InventoryItem,
        InventoryTransaction, ReportRun, Notification, DirectMessage,
        VehiclePMSLog, CustomerVehicle, Plugin, PluginLog
    )
except ImportError:
    from backend.api.models import (  # type: ignore
        User, Staff, Customer, Branch, Booking, QueueEntry,
        PaymentTransaction, Rating, RestockRequest, InventoryItem,
        InventoryTransaction, ReportRun, Notification, DirectMessage,
        VehiclePMSLog, CustomerVehicle, Plugin, PluginLog
    )

now = timezone.now()

print("=" * 60)
print("SEEDING RICH DUMMY INFORMATION AND HISTORY FOR ALL ACCOUNTS")
print("=" * 60)

# ── 1. Sanitize & Upgrade Names for All Accounts ─────────────────────────
name_corrections = {
    'Owner1@gmail.com': ('Roberto', 'Tan'),
    'owner@avica.com': ('Eduardo', 'Ramos'),
    'Manager1@gmail.com': ('Rodrigo', 'Santos'),
    'manager@avica.com': ('Carlos', 'Mendoza'),
    'Staff1@gmail.com': ('Christian', 'Dela Cruz'),
    'staff@avica.com': ('Jerome', 'Bautista'),
    'Employee1@gmail.com': ('Rommel', 'Navarro'),
    'employee@avica.com': ('Danilo', 'Ramos'),
    'Inventory1@gmail.com': ('Gabriel', 'Soriano'),
    'inventory@avica.com': ('Vicente', 'Tan'),
    'inventorymanager@avica.com': ('Mark Anthony', 'Reyes'),
    'ExampleCustomer@gmail.com': ('Marco Antonio', 'Reyes'),
    'example@gmail.com': ('Angela Nicole', 'Bautista'),
    'customer@avica.com': ('Juan', 'Dela Cruz'),
    'maria.santos@avica.com': ('Maria Clara', 'Santos'),
}

for email, (fn, ln) in name_corrections.items():
    u = User.objects.filter(email__iexact=email).first()
    if u:
        if hasattr(u, 'staff_profile') and u.staff_profile:
            s = u.staff_profile
            s.first_name = fn
            s.last_name = ln
            s.phone = s.phone or "09171234567"
            s.save(update_fields=['first_name', 'last_name', 'phone'])
        if hasattr(u, 'customer_profile') and u.customer_profile:
            c = u.customer_profile
            c.first_name = fn
            c.last_name = ln
            c.phone = c.phone or "09179876543"
            c.loyalty_points = max(c.loyalty_points, random.randint(150, 450))
            c.save(update_fields=['first_name', 'last_name', 'phone', 'loyalty_points'])

# Ensure all Staff with "Account" or "Example" in their names are clean
for s in Staff.objects.all():
    if "Account" in s.last_name or "Example" in s.last_name:
        s.first_name = "Carlos" if "Manager" in s.first_name else "Jerome"
        s.last_name = "Mendoza" if "Manager" in s.first_name else "Bautista"
        s.save()

print("[+] Account profile names sanitized and upgraded to professional Filipino names.")

# ── 2. Reference Catalogs ────────────────────────────────────────────────
branches = list(Branch.objects.filter(is_active=True))
if not branches:
    print("[-] No active branches found!")
    exit(1)

# Assign branches to any staff that doesn't have one
for idx, s in enumerate(Staff.objects.all()):
    if not s.branch:
        s.branch = branches[idx % len(branches)]
        s.branch_name = s.branch.name
        s.save(update_fields=['branch', 'branch_name'])

staff_cashiers = list(Staff.objects.filter(role__in=['Staff', 'staff']))
detailer_employees = list(Staff.objects.filter(role__in=['Employee', 'employee']))
branch_managers = list(Staff.objects.filter(role__in=['Branch Manager', 'manager']))
inventory_staff = list(Staff.objects.filter(role__in=['Inventory', 'Inventory Manager', 'inventory']))
customers = list(Customer.objects.all())

print(f"[i] Branches: {len(branches)} | Staff: {len(staff_cashiers)} | Employees: {len(detailer_employees)} | Managers: {len(branch_managers)} | Customers: {len(customers)}")

services_data = [
    ("Premium Carwash", Decimal("250.00"), "Wash & Wax exterior detailing with tire black and vacuum."),
    ("Engine Steamed Wash", Decimal("650.00"), "Deep degreasing steam engine bay cleansing."),
    ("Under Wash", Decimal("400.00"), "High pressure chassis undercarriage cleaning and anti-rust spray."),
    ("Premium Hand Wax", Decimal("500.00"), "Carnuba wax hand buffing for mirror finish protection."),
    ("Interior Detailing", Decimal("3000.00"), "Deep shampoo extraction of seats, carpet, and ozone antibacterial sterilization."),
    ("Exterior Detailing", Decimal("3500.00"), "3-step machine paint correction, swirl elimination, and synthetic sealant."),
    ("Headlight Restoration", Decimal("750.00"), "Oxidation wet sanding and UV protective polymer coating."),
    ("Acid Rain Removal (Glass)", Decimal("1000.00"), "Windshield and side mirror watermark extraction with rain repellent."),
    ("Ceramic Coating", Decimal("8500.00"), "9H Nano ceramic multi-year paint protection coating."),
    ("Buffing", Decimal("1100.00"), "High speed compound buffing to restore faded vehicle clear coat."),
]

customer_vehicles_catalog = {
    'customer@avica.com': [
        ("Toyota", "Vios", "2022", "Pearl White", "NBD 1234", "small"),
        ("Toyota", "Fortuner", "2023", "Silver Metallic", "NBD 5678", "medium"),
    ],
    'maria.santos@avica.com': [
        ("Honda", "Civic RS", "2021", "Rallye Red", "ABC 8899", "small"),
    ],
    'ExampleCustomer@gmail.com': [
        ("Mitsubishi", "Montero Sport", "2023", "Jet Black", "NBD 9911", "medium"),
    ],
    'example@gmail.com': [
        ("Ford", "Ranger Raptor", "2022", "Arctic White", "NBD 3344", "large"),
    ],
}

review_templates = [
    ("Napakalinis ng gawa! Sobrang bango ng interior at kintab ng paint.", 5, "Maraming salamat po sa pagtitiwala sa Otokwikk! Looking forward to your next visit!"),
    ("Mabibilis gumalaw ang mga staff at maasikaso. Sulit ang bayad.", 5, "Salamat po sir/ma'am! Laging handang maglingkod ang aming team."),
    ("Very satisfied sa engine wash at underwash, tanggal lahat ng putik.", 5, "Thank you po! Inaalagaan talaga namin ang bawat detalye ng sasakyan ninyo."),
    ("Maganda ang service at malamig ang customer waiting lounge.", 4, "Salamat po sa feedback! Patuloy po naming papagandahin ang aming pasilidad."),
    ("Kulang lang ng kaunti sa punas ng windshield pero inasikaso agad ng cashier.", 4, "Paumanhin po sa naging abala, sinabihan na po namin ang detailer team para sa susunod. Salamat po!"),
    ("High quality ceramic coating, hydrophobic talaga kapag umuulan.", 5, "Maraming salamat po! Enjoy the gloss and ceramic protection po!"),
]

# ── 3. Seed Registered Customer Vehicles ─────────────────────────────────
for c in customers:
    user_email = c.user.email
    veh_list = customer_vehicles_catalog.get(user_email, [
        ("Toyota", "Corolla Cross", "2022", "Platinum White", f"CAE {random.randint(1000, 9999)}", "medium")
    ])
    for idx, (make, model, year, color, plate, size) in enumerate(veh_list):
        CustomerVehicle.objects.get_or_create(
            customer=c,
            plate_number=plate,
            defaults={
                'user': c.user,
                'make': make,
                'model': model,
                'year': year,
                'color': color,
                'vehicle_size': size,
                'is_primary': (idx == 0),
            }
        )

print("[+] Customer registered vehicles seeded.")

# ── 4. Seed Bookings, Queues, Payments, & Ratings for Customers ───────────
# Seed across past 60 days
created_bookings_count = 0
created_payments_count = 0
created_ratings_count = 0

day_offsets = [2, 5, 9, 14, 21, 28, 35, 42, 52]

for c_idx, c in enumerate(customers):
    user = c.user
    user_vehicles = list(CustomerVehicle.objects.filter(customer=c))
    
    # Historical Completed Bookings
    for d_idx, day_offset in enumerate(day_offsets):
        svc_name, svc_price, svc_desc = services_data[(c_idx + d_idx) % len(services_data)]
        branch = branches[(c_idx + d_idx) % len(branches)]
        vehicle_obj = user_vehicles[(c_idx + d_idx) % len(user_vehicles)] if user_vehicles else None
        
        veh_name = f"{vehicle_obj.make} {vehicle_obj.model}" if vehicle_obj else "Toyota Vios"
        veh_size = vehicle_obj.vehicle_size if vehicle_obj else "small"
        plate_no = vehicle_obj.plate_number if vehicle_obj else "NBD 1234"
        
        booking_date = (now - timedelta(days=day_offset)).date()
        booking_time_val = f"{random.choice([9, 10, 11, 13, 14, 15, 16])}:00 {'AM' if random.choice([True, False]) else 'PM'}"
        completed_dt = now - timedelta(days=day_offset, hours=2, minutes=random.randint(5, 50))
        queued_dt = completed_dt - timedelta(minutes=random.randint(45, 90))
        
        # Pick staff and employee for this branch
        branch_staff = [s for s in staff_cashiers if s.branch == branch] or staff_cashiers
        branch_emps = [e for e in detailer_employees if e.branch == branch] or detailer_employees
        assigned_staff = branch_staff[(c_idx + d_idx) % len(branch_staff)] if branch_staff else None
        assigned_emp = branch_emps[(c_idx + d_idx) % len(branch_emps)] if branch_emps else None
        
        booking, b_created = Booking.objects.get_or_create(
            user=user,
            branch=branch,
            date=booking_date,
            service=svc_name,
            defaults={
                'time': booking_time_val,
                'price': svc_price,
                'vehicle': veh_name,
                'vehicle_size': veh_size,
                'plate_number': plate_no,
                'notes': f"Requested standard {svc_name} service package.",
                'status': 'done',
                'staff': f"{assigned_staff.first_name} {assigned_staff.last_name}" if assigned_staff else "Cashier",
            }
        )
        if b_created:
            created_bookings_count += 1
            Booking.objects.filter(id=booking.id).update(created_at=queued_dt)

        # Queue Entry
        queue, q_created = QueueEntry.objects.get_or_create(
            booking=booking,
            defaults={
                'branch': branch,
                'branch_name': branch.name,
                'customer_user': user,
                'customer_name': f"{c.first_name} {c.last_name}",
                'phone': c.phone or "09170000000",
                'vehicle': veh_name,
                'vehicle_type': veh_size,
                'plate_number': plate_no,
                'service': svc_name,
                'notes': "Appointment booked via online portal.",
                'source': 'booking',
                'status': 'done',
                'queued_at': queued_dt,
                'service_started_at': queued_dt + timedelta(minutes=15),
                'completed_at': completed_dt,
                'service_base_price': svc_price,
                'price': svc_price,
                'payment_status': 'paid',
                'paid_at': completed_dt,
                'payment_method': random.choice(['Cash', 'GCash', 'PayMongo', 'Credit Card']),
                'assigned_employee': assigned_emp,
            }
        )

        # Payment Transaction
        pay_method = queue.payment_method or 'Cash'
        pay_trans, p_created = PaymentTransaction.objects.get_or_create(
            queue_entry=queue,
            defaults={
                'staff': assigned_staff,
                'branch': branch,
                'transaction_type': 'appointment',
                'description': f"Payment for {svc_name} - {plate_no}",
                'quantity': 1,
                'amount': svc_price,
                'payment_method': pay_method,
                'notes': f"Processed at {branch.name} counter by {assigned_staff.first_name if assigned_staff else 'Staff'}.",
                'paid_at': completed_dt,
            }
        )
        if p_created:
            created_payments_count += 1
            PaymentTransaction.objects.filter(id=pay_trans.id).update(created_at=completed_dt)

        # Ratings
        if d_idx % 2 == 0:
            comment_text, score, response_text = review_templates[(c_idx + d_idx) % len(review_templates)]
            branch_mgrs = [m for m in branch_managers if m.branch == branch] or branch_managers
            responding_mgr = branch_mgrs[0] if branch_mgrs else None
            
            rating, r_created = Rating.objects.get_or_create(
                booking=booking,
                defaults={
                    'customer': c,
                    'branch': branch,
                    'score': score,
                    'comment': comment_text,
                    'response_status': 'responded',
                    'responded_at': completed_dt + timedelta(hours=random.randint(1, 12)),
                    'responded_by': responding_mgr,
                }
            )
            if r_created:
                created_ratings_count += 1
                Rating.objects.filter(id=rating.id).update(created_at=completed_dt + timedelta(minutes=30))

    # Add 1 Upcoming / Active booking for each customer
    upcoming_svc, upcoming_price, _ = services_data[(c_idx + 2) % len(services_data)]
    upcoming_branch = branches[c_idx % len(branches)]
    upcoming_veh = user_vehicles[0] if user_vehicles else None
    
    upcoming_booking, _ = Booking.objects.get_or_create(
        user=user,
        date=(now + timedelta(days=random.randint(1, 4))).date(),
        service=upcoming_svc,
        defaults={
            'branch': upcoming_branch,
            'time': '10:00 AM',
            'price': upcoming_price,
            'vehicle': f"{upcoming_veh.make} {upcoming_veh.model}" if upcoming_veh else "Toyota Vios",
            'vehicle_size': upcoming_veh.vehicle_size if upcoming_veh else "small",
            'plate_number': upcoming_veh.plate_number if upcoming_veh else "NBD 1234",
            'notes': "Upcoming scheduled PMS & maintenance appointment.",
            'status': 'confirmed',
            'staff': "Staff TBA",
        }
    )

print(f"[+] Bookings seeded: {created_bookings_count} | Payments: {created_payments_count} | Ratings: {created_ratings_count}")

# ── 5. Seed Additional Walk-In Queue Entries to Fill All Branches & Employees ─
# Ensure every detailer employee has active completed jobs
walkin_count = 0
for idx, emp in enumerate(detailer_employees):
    emp_branch = emp.branch or branches[idx % len(branches)]
    branch_staff = [s for s in staff_cashiers if s.branch == emp_branch] or staff_cashiers
    cashier = branch_staff[idx % len(branch_staff)] if branch_staff else None
    
    for job_num in range(4):
        svc_name, svc_price, _ = services_data[(idx + job_num) % len(services_data)]
        days_ago = (job_num * 7) + (idx % 5) + 1
        comp_time = now - timedelta(days=days_ago, hours=3)
        q_time = comp_time - timedelta(minutes=50)
        
        plates = ["NDO 4120", "ZAA 8831", "CAR 5521", "TBA 9021", "NBD 7714", "WQA 2209"]
        veh_models = ["Toyota Hilux", "Honda City", "Nissan Navara", "Mazda 3", "Suzuki Jimny", "Kia Seltos"]
        plate = plates[(idx + job_num) % len(plates)]
        veh = veh_models[(idx + job_num) % len(veh_models)]
        cust_name = f"Walk-in Client {plate}"
        
        existing_qe = QueueEntry.objects.filter(
            branch=emp_branch,
            plate_number=plate,
            queued_at__date=q_time.date(),
            service=svc_name
        ).first()
        
        if not existing_qe:
            qe = QueueEntry.objects.create(
                branch=emp_branch,
                plate_number=plate,
                service=svc_name,
                branch_name=emp_branch.name,
                customer_name=cust_name,
                phone="09181234567",
                vehicle=veh,
                vehicle_type='medium',
                notes="Direct branch walk-in customer.",
                source='walk_in',
                status='done',
                queued_at=q_time,
                service_started_at=q_time + timedelta(minutes=10),
                completed_at=comp_time,
                service_base_price=svc_price,
                price=svc_price,
                payment_status='paid',
                paid_at=comp_time,
                payment_method='Cash',
                assigned_employee=emp,
            )
            walkin_count += 1
            # Add cashier payment transaction
            PaymentTransaction.objects.create(
                staff=cashier,
                branch=emp_branch,
                queue_entry=qe,
                transaction_type='walk_in',
                description=f"Walk-in {svc_name} - {plate}",
                quantity=1,
                amount=svc_price,
                payment_method='Cash',
                notes=f"Walk-in service completed by {emp.first_name} {emp.last_name}.",
                paid_at=comp_time,
            )

print(f"[+] Employee walk-in service tasks seeded: {walkin_count}")

# ── 6. Seed Vehicle PMS Logs for Customer Vehicles ────────────────────────
for c in customers:
    vehs = CustomerVehicle.objects.filter(customer=c)
    for v in vehs:
        for pms_idx, (km, title, health, label, days_back) in enumerate([
            (5000, "5,000 KM Initial PMS Inspection", 98, "Excellent Condition", 55),
            (10000, "10,000 KM Regular Oil & Filter Change", 95, "Good Condition", 30),
            (15000, "15,000 KM Comprehensive Brake & Fluid Inspection", 92, "Good Condition", 8),
        ]):
            log_date = now - timedelta(days=days_back)
            if not VehiclePMSLog.objects.filter(user=c.user, plate_number=v.plate_number, target_milestone_km=km).exists():
                log = VehiclePMSLog.objects.create(
                    user=c.user,
                    customer=c,
                    plate_number=v.plate_number,
                    target_milestone_km=km,
                    mileage=float(km),
                    vehicle_name=f"{v.make} {v.model}",
                    vehicle_size=v.vehicle_size,
                    health_score=health,
                    status_label=label,
                    target_milestone_title=title,
                    km_remaining=max(0, 20000 - km),
                )
                VehiclePMSLog.objects.filter(id=log.id).update(created_at=log_date)

print("[+] Vehicle PMS service milestone logs seeded.")

# ── 7. Seed Direct Messages Between Customers and Detailer Employees ─────
direct_msg_samples = [
    ("Good day po sir! We have received your vehicle in the bay and are starting the preliminary wash.", "employee", 4),
    ("Noted po, paki-ingatan po lalo na yung rear spoiler. Salamat!", "customer", 3),
    ("Opo sir, noted po! Proceeding na po kami to claying and hand wax.", "employee", 2),
    ("Sir tapos na po ang interior detailing at mist sterilization. Ready for pickup na po!", "employee", 1),
]

for c in customers:
    emp = detailer_employees[c.id % len(detailer_employees)] if detailer_employees else None
    if emp:
        for text, sender, hrs_ago in direct_msg_samples:
            if not DirectMessage.objects.filter(customer=c, employee=emp, message=text).exists():
                DirectMessage.objects.create(
                    customer=c,
                    employee=emp,
                    message=text,
                    sender_type=sender,
                    is_read=True,
                    created_at=now - timedelta(hours=hrs_ago, days=c.id),
                )

print("[+] Direct customer-employee messaging history seeded.")

# ── 8. Seed Restock Requests & Inventory Transactions ─────────────────────
inventory_items = list(InventoryItem.objects.all())
if inventory_items:
    restock_count = 0
    for idx, b in enumerate(branches):
        mgrs = [m for m in branch_managers if m.branch == b] or branch_managers
        mgr = mgrs[0] if mgrs else None
        inv_reviewer = inventory_staff[0] if inventory_staff else mgr
        
        sample_items = inventory_items[idx*3 : (idx*3)+3] or inventory_items[:3]
        for item_idx, itm in enumerate(sample_items):
            for status, offset_days in [('received', 25), ('approved', 10), ('pending', 2)]:
                if not RestockRequest.objects.filter(branch=b, inventory_item=itm, status=status).exists():
                    req = RestockRequest.objects.create(
                        branch=b,
                        inventory_item=itm,
                        status=status,
                        requested_by=mgr,
                        quantity_requested=random.randint(10, 50),
                        notes=f"Restock batch for branch operations at {b.name}.",
                        request_type='restock',
                        reviewed_by=inv_reviewer,
                        reviewer_note="Approved based on weekly branch consumption threshold." if status != 'pending' else "",
                        reviewed_at=now - timedelta(days=offset_days) if status != 'pending' else None,
                    )
                    restock_count += 1
                    created_dt = now - timedelta(days=offset_days + 1)
                    RestockRequest.objects.filter(id=req.id).update(created_at=created_dt)
                    
                    # Also log inventory transaction
                    InventoryTransaction.objects.create(
                        inventory_item=itm,
                        action_type='restock_received' if status == 'received' else 'restock_approved',
                        quantity_before=itm.quantity,
                        quantity_after=itm.quantity + req.quantity_requested,
                        quantity_changed=req.quantity_requested,
                        branch_name=b.name,
                        performed_by=inv_reviewer,
                        notes=f"Stock shipment processed for {itm.name} ({b.name}).",
                    )

    print(f"[+] Restock requests & inventory transactions seeded: {restock_count}")

# ── 9. Seed Report Runs for Managers & Admins ─────────────────────────────
report_count = 0
for idx, b in enumerate(branches):
    mgrs = [m for m in branch_managers if m.branch == b] or branch_managers
    mgr = mgrs[0] if mgrs else None
    
    for period, p_type in [('monthly', 'Monthly Operations & Revenue Summary'), ('weekly', 'Weekly Service Throughput Audit')]:
        if not ReportRun.objects.filter(branch=b, period_type=period, report_type='dashboard_summary').exists():
            ReportRun.objects.create(
                branch=b,
                period_type=period,
                report_type='dashboard_summary',
                scope_type='branch',
                status='completed',
                generated_by=mgr,
                summary={
                    'branch_name': b.name,
                    'total_revenue': float(random.randint(120000, 380000)),
                    'services_completed': random.randint(140, 320),
                    'customer_satisfaction_rate': 98.4,
                    'active_staff': 6,
                },
                file_path=f"/reports/branch_{b.id}_{period}_report.pdf",
            )
            report_count += 1

# Superadmin Global Report Runs
superadmin_user = Staff.objects.filter(role__in=['Super Admin', 'super_admin']).first()
if superadmin_user:
    for rep_type in ['dashboard_summary', 'revenue_breakdown', 'customer_insights']:
        if not ReportRun.objects.filter(branch=None, scope_type='global', period_type='monthly', report_type=rep_type).exists():
            ReportRun.objects.create(
                branch=None,
                scope_type='global',
                period_type='monthly',
                report_type=rep_type,
                status='completed',
                generated_by=superadmin_user,
                summary={
                    'network_total_revenue': 1485000.0,
                    'network_total_services': 1620,
                    'highest_performing_branch': 'South Caloocan',
                    'average_ticket_size': 916.6,
                },
                file_path=f"/reports/network_wide_{rep_type}.pdf",
            )
            report_count += 1

print(f"[+] Managerial and executive report runs seeded: {report_count}")

# ── 10. Seed Notifications for Every Account ─────────────────────────────
notification_count = 0

notifications_by_role = {
    'Customer': [
        ("Booking Confirmed", "Your appointment for Premium Carwash has been confirmed! Please arrive 10 minutes early.", "booking", "/customer/appointments"),
        ("Service Completed", "Your vehicle service has been completed and is ready for pickup. Thank you for choosing Otokwikk!", "service", "/customer/appointments"),
        ("Loyalty Points Added", "You just earned +50 loyalty points on your recent car care service! Keep it up!", "rewards", "/customer/rewards"),
        ("New Promo Available", "Enjoy 15% off on Interior Detailing this weekend across all Otokwikk branches!", "promo", "/customer/booking"),
        ("PMS Milestone Reminder", "Your vehicle is approaching 15,000 KM. Book your comprehensive PMS checkup now.", "maintenance", "/customer/pms"),
    ],
    'Branch Manager': [
        ("Daily Branch Summary Ready", "Yesterday's branch operations summary is ready. Total services finished: 18.", "report", "/manager/dashboard"),
        ("New Booking Request", "A new online appointment was submitted by Juan Dela Cruz for tomorrow at 10:00 AM.", "booking", "/manager/appointments"),
        ("Inventory Stock Alert", "Carwash Foam Shampoo stock at your branch is below recommended safety stock (5 units remaining).", "inventory", "/manager/inventory"),
        ("5-Star Review Received", "A customer just rated your branch 5 stars: 'Sobrang linis at kintab!'", "rating", "/manager/reviews"),
        ("Restock Request Approved", "Restock Request #104 has been approved by Central Warehouse and is en route.", "inventory", "/manager/inventory"),
    ],
    'Staff': [
        ("Shift Schedule Update", "Your cashier shift schedule for the upcoming week has been posted.", "schedule", "/staff/queue"),
        ("Cash Payment Recorded", "Payment of ₱500.00 (Cash) recorded for Toyota Vios (NBD 1234).", "payment", "/staff/pos"),
        ("Queue Alert", "Vehicle NBD 5678 has been moved into the drying bay and is ready for billing.", "queue", "/staff/queue"),
        ("End of Day Cash Remittance", "Remember to perform daily cash drawer balancing and register settlement.", "pos", "/staff/pos"),
    ],
    'Employee': [
        ("Task Assigned to You", "You have been assigned to service Toyota Fortuner (NBD 5678) - Premium Carwash.", "service", "/employee/dashboard"),
        ("Job Completed Confirmation", "Great job! Service on Honda Civic (ABC 8899) marked done.", "service", "/employee/dashboard"),
        ("Customer Commendation", "A client left a high rating on your recent exterior wax work. Keep up the great work!", "rating", "/employee/dashboard"),
        ("Weekly Safety Briefing", "Reminder: Branch tool maintenance and safety protocol review tomorrow 8:00 AM.", "general", "/employee/dashboard"),
    ],
    'Inventory': [
        ("Restock Request Submitted", "Branch restock request has been forwarded to Saranay Main Warehouse for fulfillment.", "inventory", "/inventory/alerts"),
        ("Stock Delivery Verified", "Supplier shipment from Saranay Main Warehouse confirmed received and added to shelf.", "inventory", "/inventory/stock"),
        ("Quarterly Inventory Audit", "Scheduled cycle count for all chemical detergents and coatings is scheduled for Friday.", "inventory", "/inventory/stock"),
    ],
    'Inventory Manager': [
        ("Restock Request Pending Approval", "Branch Tanza has submitted Restock Request #112 for Carwash Foam Shampoo.", "inventory", "/inventory-manager/inventory"),
        ("Main Warehouse Stock Level Verified", "Saranay Main Warehouse replenishment batch from supplier verified complete.", "inventory", "/inventory-manager/inventory"),
        ("Inter-Branch Transfer Dispatched", "Stock transfer batch from Saranay Main Warehouse to South Caloocan dispatched.", "inventory", "/inventory-manager/inventory"),
        ("Monthly Inventory Audit Completed", "All branch stock distribution levels and physical counts reconciled.", "inventory", "/inventory-manager/inventory"),
    ],
    'Super Admin': [
        ("Multi-Branch Financial Summary", "Consolidated network-wide revenue report for the current month is ready.", "admin", "/superadmin/reports"),
        ("System Backup Successful", "Nightly encrypted database backup and transaction log replication succeeded.", "system", "/superadmin/settings"),
        ("Branch Performance Milestone", "Tanza Cavite branch has exceeded its monthly target by 14%!", "branch", "/superadmin/branches"),
        ("Security Audit Log", "All administrator login sessions and API authorization tokens verified normal.", "security", "/superadmin/audit-logs"),
    ],
    'Business Owner': [
        ("Executive Overview Ready", "Monthly executive summary: Net revenue +18% compared to previous month.", "owner", "/owner/dashboard"),
        ("Customer Retention Rate Up", "Customer return visit rate improved to 78.4% across Caloocan & Cavite branches.", "insights", "/owner/analytics"),
        ("Quarterly Expansion Update", "San Mateo branch operational stability score is 99.2%.", "owner", "/owner/branches"),
    ]
}

for user in User.objects.all():
    staff = getattr(user, 'staff_profile', None)
    cust = getattr(user, 'customer_profile', None)
    
    if staff:
        role = staff.role
        if role in ['Super Admin', 'super_admin']:
            role_key = 'Super Admin'
        elif role in ['Admin', 'admin']:
            role_key = 'Super Admin'
        elif role in ['Business Owner', 'owner']:
            role_key = 'Business Owner'
        elif role in ['Branch Manager', 'manager']:
            role_key = 'Branch Manager'
        elif role in ['Staff', 'staff']:
            role_key = 'Staff'
        elif role in ['Employee', 'employee']:
            role_key = 'Employee'
        elif 'Inventory' in role:
            role_key = 'Inventory'
        else:
            role_key = 'Staff'
    elif cust:
        role_key = 'Customer'
    elif user.is_superuser:
        role_key = 'Super Admin'
    else:
        role_key = 'Customer'
        
    template_list = notifications_by_role.get(role_key, notifications_by_role['Customer'])
    for title, msg, n_type, path in template_list:
        if not Notification.objects.filter(user=user, title=title).exists():
            notif = Notification.objects.create(
                user=user,
                title=title,
                message=msg,
                is_read=random.choice([True, False]),
                notification_type=n_type,
                target_path=path,
            )
            notification_count += 1
            Notification.objects.filter(id=notif.id).update(created_at=now - timedelta(days=random.randint(1, 20), hours=random.randint(1, 10)))

print(f"[+] Realistic notifications seeded across all user accounts: {notification_count}")

# ── 11. Final Summary ────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SEEDING COMPLETED SUCCESSFULLY!")
print(f"Total Users: {User.objects.count()}")
print(f"Total Bookings: {Booking.objects.count()}")
print(f"Total Queue Entries: {QueueEntry.objects.count()}")
print(f"Total Payment Transactions: {PaymentTransaction.objects.count()}")
print(f"Total Ratings / Reviews: {Rating.objects.count()}")
print(f"Total Restock Requests: {RestockRequest.objects.count()}")
print(f"Total Inventory Transactions: {InventoryTransaction.objects.count()}")
print(f"Total Report Runs: {ReportRun.objects.count()}")
print(f"Total Notifications: {Notification.objects.count()}")
print(f"Total Direct Messages: {DirectMessage.objects.count()}")
print(f"Total Vehicle PMS Logs: {VehiclePMSLog.objects.count()}")
print("=" * 60)
