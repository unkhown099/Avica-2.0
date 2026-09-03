import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Staff, Branch, User

branch_employees_data = {
    # Tanza Cavite (Branch 3)
    3: [
        {"first_name": "Arnel", "last_name": "Mendoza", "email": "arnel.mendoza@otokwikk.ph"},
        {"first_name": "Kenneth", "last_name": "Flores", "email": "kenneth.flores@otokwikk.ph"},
        {"first_name": "John Paul", "last_name": "Dela Rosa", "email": "johnpaul.delarosa@otokwikk.ph"},
        {"first_name": "Joshua", "last_name": "Ramos", "email": "joshua.ramos@otokwikk.ph"},
    ],
    # Saranay North Cal (Branch 4)
    4: [
        {"first_name": "Danilo", "last_name": "Ramos", "email": "danilo.ramos@otokwikk.ph"},
        {"first_name": "Raymond", "last_name": "Garcia", "email": "raymond.garcia@otokwikk.ph"},
        {"first_name": "Mark Joseph", "last_name": "Castro", "email": "markjoseph.castro@otokwikk.ph"},
        {"first_name": "Carlito", "last_name": "Fernandez", "email": "carlito.fernandez@otokwikk.ph"},
        {"first_name": "Rico", "last_name": "Salazar", "email": "rico.salazar@otokwikk.ph"},
    ],
    # South Caloocan (Branch 5)
    5: [
        {"first_name": "Michael", "last_name": "Santos", "email": "michael.santos@otokwikk.ph"},
        {"first_name": "Noel", "last_name": "Vergara", "email": "noel.vergara@otokwikk.ph"},
        {"first_name": "Jeffrey", "last_name": "Villanueva", "email": "jeffrey.villanueva@otokwikk.ph"},
        {"first_name": "Paolo", "last_name": "Cruz", "email": "paolo.cruz@otokwikk.ph"},
    ],
    # San Mateo Rizal (Branch 6)
    6: [
        {"first_name": "Alvin", "last_name": "David", "email": "alvin.david@otokwikk.ph"},
        {"first_name": "Gerald", "last_name": "Toralba", "email": "gerald.toralba@otokwikk.ph"},
        {"first_name": "Bryan", "last_name": "Tolentino", "email": "bryan.tolentino@otokwikk.ph"},
        {"first_name": "Lester", "last_name": "Gonzales", "email": "lester.gonzales@otokwikk.ph"},
    ],
    # Camarin North Caloocan (Branch 7)
    7: [
        {"first_name": "Christopher", "last_name": "Reyes", "email": "christopher.reyes@otokwikk.ph"},
        {"first_name": "Marvin", "last_name": "Dizon", "email": "marvin.dizon@otokwikk.ph"},
        {"first_name": "Ericson", "last_name": "Valenzuela", "email": "ericson.valenzuela@otokwikk.ph"},
        {"first_name": "Dexter", "last_name": "Pascual", "email": "dexter.pascual@otokwikk.ph"},
    ],
}

created_or_updated = 0
for branch_id, emp_list in branch_employees_data.items():
    branch = Branch.objects.filter(id=branch_id).first()
    if not branch:
        continue
    for emp_data in emp_list:
        email = emp_data["email"]
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={
                "is_active": True,
                "email_verified": True,
            }
        )
        if not user.has_usable_password():
            user.set_password("Otokwikk@2026")
            user.save()

        staff, created = Staff.objects.update_or_create(
            user=user,
            defaults={
                "first_name": emp_data["first_name"],
                "last_name": emp_data["last_name"],
                "role": "Employee",
                "phone": "+639171234567",
                "branch": branch,
                "branch_name": branch.name,
                "status": "Active",
            }
        )
        created_or_updated += 1
        print(f"Set Staff #{staff.id}: {staff.first_name} {staff.last_name} -> {branch.name}")

print(f"Successfully configured {created_or_updated} active branch employees across all branches!")
