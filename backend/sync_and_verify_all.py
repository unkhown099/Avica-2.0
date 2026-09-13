import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User, Staff, Customer, Branch
from django.contrib.auth import authenticate
from api.views.auth_views import _get_profile_data

UNIVERSAL_PASSWORD = "Password123!"

# Master list of all 38 system accounts from PDF
SYSTEM_ACCOUNTS = [
    # ── Executive & System Administration ──
    {
        "name": "Alexander Morales",
        "email": "superadmin@avica.com",
        "role": "Super Admin",
        "branch": "Central Head Office",
        "type": "Staff",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "name": "Eduardo Ramos",
        "email": "owner@avica.com",
        "role": "Business Owner",
        "branch": "Central Head Office",
        "type": "Staff",
        "is_staff": False,
        "is_superuser": False,
    },
    {
        "name": "Pierce De Ocampo",
        "email": "admin@avica.com",
        "role": "Admin",
        "branch": "Central Head Office",
        "type": "Staff",
        "is_staff": True,
        "is_superuser": True,
    },

    # ── Inventory Management ──
    {
        "name": "Christian Dela Cruz",
        "email": "inventory.manager@avica.com",
        "role": "Inventory",
        "branch": "Central Warehouse",
        "type": "Staff",
    },
    {
        "name": "Gabriel Soriano",
        "email": "inventory.staff@avica.com",
        "role": "Inventory",
        "branch": "Central Warehouse",
        "type": "Staff",
    },

    # ── Branch Managers ──
    {
        "name": "Mateo Alcantara",
        "email": "manager.saranay@avica.com",
        "role": "Branch Manager",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "name": "Ricardo Dizon",
        "email": "manager.tanza@avica.com",
        "role": "Branch Manager",
        "branch": "Tanza Cavite",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "name": "Rolando Aquino",
        "email": "manager.southcal@avica.com",
        "role": "Branch Manager",
        "branch": "South Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "name": "Ferdinand Santos",
        "email": "manager.sanmateo@avica.com",
        "role": "Branch Manager",
        "branch": "San Mateo Rizal",
        "branch_id": 6,
        "type": "Staff",
    },
    {
        "name": "Bernardo Castillo",
        "email": "manager.camarin@avica.com",
        "role": "Branch Manager",
        "branch": "Camarin North Caloocan",
        "branch_id": 7,
        "type": "Staff",
    },

    # ── Branch Staff / Cashiers / Service Advisors ──
    {
        "name": "Jerome Bautista",
        "email": "staff.saranay@avica.com",
        "role": "Staff",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "name": "Mark Anthony Reyes",
        "email": "staff.tanza@avica.com",
        "role": "Staff",
        "branch": "Tanza Cavite",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "name": "Reggie Salazar",
        "email": "staff.southcal@avica.com",
        "role": "Staff",
        "branch": "South Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "name": "Dennis Ilagan",
        "email": "staff.sanmateo@avica.com",
        "role": "Staff",
        "branch": "San Mateo Rizal",
        "branch_id": 6,
        "type": "Staff",
    },
    {
        "name": "Ronnie Villanueva",
        "email": "staff.camarin@avica.com",
        "role": "Staff",
        "branch": "Camarin North Caloocan",
        "branch_id": 7,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: Saranay North Cal ──
    {
        "name": "Danilo Ramos",
        "email": "danilo.ramos@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "name": "Raymond Garcia",
        "email": "raymond.garcia@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "name": "Mark Joseph Castro",
        "email": "markjoseph.castro@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "name": "Carlito Fernandez",
        "email": "carlito.fernandez@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },
    {
        "name": "Rico Salazar",
        "email": "rico.salazar@avica.com",
        "role": "Employee",
        "branch": "Saranay North Cal",
        "branch_id": 4,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: Tanza Cavite ──
    {
        "name": "Arnel Mendoza",
        "email": "arnel.mendoza@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "name": "Kenneth Flores",
        "email": "kenneth.flores@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "name": "John Paul Dela Rosa",
        "email": "johnpaul.delarosa@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 3,
        "type": "Staff",
    },
    {
        "name": "Joshua Ramos",
        "email": "joshua.ramos@avica.com",
        "role": "Employee",
        "branch": "Tanza Cavite",
        "branch_id": 3,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: South Caloocan ──
    {
        "name": "Michael Santos",
        "email": "michael.santos@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "name": "Noel Vergara",
        "email": "noel.vergara@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "name": "Jeffrey Villanueva",
        "email": "jeffrey.villanueva@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },
    {
        "name": "Paolo Cruz",
        "email": "paolo.cruz@avica.com",
        "role": "Employee",
        "branch": "South Caloocan",
        "branch_id": 5,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: San Mateo Rizal ──
    {
        "name": "Alvin David",
        "email": "alvin.david@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 6,
        "type": "Staff",
    },
    {
        "name": "Gerald Toralba",
        "email": "gerald.toralba@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 6,
        "type": "Staff",
    },
    {
        "name": "Bryan Tolentino",
        "email": "bryan.tolentino@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 6,
        "type": "Staff",
    },
    {
        "name": "Lester Gonzales",
        "email": "lester.gonzales@avica.com",
        "role": "Employee",
        "branch": "San Mateo Rizal",
        "branch_id": 6,
        "type": "Staff",
    },

    # ── Auto Technicians / Employees: Camarin North Caloocan ──
    {
        "name": "Christopher Reyes",
        "email": "christopher.reyes@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 7,
        "type": "Staff",
    },
    {
        "name": "Marvin Dizon",
        "email": "marvin.dizon@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 7,
        "type": "Staff",
    },
    {
        "name": "Ericson Valenzuela",
        "email": "ericson.valenzuela@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 7,
        "type": "Staff",
    },
    {
        "name": "Dexter Pascual",
        "email": "dexter.pascual@avica.com",
        "role": "Employee",
        "branch": "Camarin North Caloocan",
        "branch_id": 7,
        "type": "Staff",
    },

    # ── Customers / Vehicle Owners ──
    {
        "name": "Juan Dela Cruz",
        "email": "customer@avica.com",
        "role": "Customer",
        "branch": "Saranay / Multi-Branch",
        "type": "Customer",
    },
    {
        "name": "Maria Clara Santos",
        "email": "maria.santos@avica.com",
        "role": "Customer",
        "branch": "Tanza / Multi-Branch",
        "type": "Customer",
    },
]

# Preload branches
branches_by_id = {b.id: b for b in Branch.objects.all()}
all_branches = list(Branch.objects.all())

print(f"=== SYNCING ALL {len(SYSTEM_ACCOUNTS)} USER ACCOUNTS WITH Password123! ===", flush=True)

for i, acc in enumerate(SYSTEM_ACCOUNTS, 1):
    email = acc["email"].strip().lower()
    name_parts = acc["name"].split(None, 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "is_active": True,
            "email_verified": True,
        }
    )
    user.is_active = True
    user.email_verified = True
    user.is_staff = acc.get("is_staff", False)
    user.is_superuser = acc.get("is_superuser", False)
    user.set_password(UNIVERSAL_PASSWORD)
    user.save()

    if acc["type"] == "Staff":
        branch_obj = None
        if "branch_id" in acc and acc["branch_id"] in branches_by_id:
            branch_obj = branches_by_id[acc["branch_id"]]
        elif acc.get("branch") and acc["branch"] not in ["Central Head Office", "Central Warehouse"]:
            key = acc["branch"].split()[0].lower()
            branch_obj = next((b for b in all_branches if key in b.name.lower()), None)

        Staff.objects.update_or_create(
            user=user,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "role": acc["role"],
                "phone": "+639171234567",
                "branch": branch_obj,
                "branch_name": branch_obj.name if branch_obj else acc["branch"],
                "status": "Active",
            }
        )
    elif acc["type"] == "Customer":
        Customer.objects.update_or_create(
            user=user,
            defaults={
                "first_name": first_name,
                "last_name": last_name,
                "phone": "+639189876543",
            }
        )
    
    # Also verify login right here
    u_auth = authenticate(email=email, password=UNIVERSAL_PASSWORD)
    if u_auth:
        role, fn, ln, sf, ph, pic = _get_profile_data(u_auth)
        print(f"[{i:02d}/{len(SYSTEM_ACCOUNTS)}] SUCCESS: {email:<30} | Role: {role:<15} | Name: {fn} {ln}", flush=True)
    else:
        print(f"[{i:02d}/{len(SYSTEM_ACCOUNTS)}] FAILED:  {email:<30}", flush=True)

print("\n=== COMPLETE: ALL ACCOUNTS SYNCED AND TESTED ===", flush=True)
