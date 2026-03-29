from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0041_restock_workflow_statuses"),
    ]

    operations = [
        migrations.AlterField(
            model_name="staff",
            name="role",
            field=models.CharField(
                choices=[
                    ("Admin", "Admin"),
                    ("Business Owner", "Business Owner"),
                    ("Branch Manager", "Branch Manager"),
                    ("Staff", "Staff (Cashier)"),
                    ("Employee", "Employee (Mechanic)"),
                    ("Inventory", "Inventory"),
                    ("Inventory Manager", "Inventory Manager"),
                ],
                max_length=50,
            ),
        ),
    ]
