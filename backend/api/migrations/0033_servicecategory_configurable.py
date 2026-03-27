from django.db import migrations, models


def seed_service_categories(apps, schema_editor):
    Service = apps.get_model("api", "Service")
    ServiceCategory = apps.get_model("api", "ServiceCategory")

    defaults = ["Maintenance", "Repair", "Diagnostic", "Cosmetic"]
    existing_names = set(
        Service.objects.exclude(category__isnull=True)
        .exclude(category__exact="")
        .values_list("category", flat=True)
        .distinct()
    )

    for name in sorted(set(defaults) | existing_names):
        ServiceCategory.objects.get_or_create(name=name.strip())


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0032_queueentry_service_details"),
    ]

    operations = [
        migrations.CreateModel(
            name="ServiceCategory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "service_categories",
                "ordering": ["name"],
            },
        ),
        migrations.AlterField(
            model_name="service",
            name="category",
            field=models.CharField(max_length=100),
        ),
        migrations.RunPython(seed_service_categories, migrations.RunPython.noop),
    ]
