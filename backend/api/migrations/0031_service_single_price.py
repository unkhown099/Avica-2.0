from django.db import migrations, models


def copy_min_to_price(apps, schema_editor):
    Service = apps.get_model("api", "Service")
    for service in Service.objects.all().iterator():
        min_value = getattr(service, "price_min", 0) or 0
        max_value = getattr(service, "price_max", 0) or 0
        service.price = min_value or max_value or 0
        service.save(update_fields=["price"])


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0030_service_price_list"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.RunPython(copy_min_to_price, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="service",
            name="price_min",
        ),
        migrations.RemoveField(
            model_name="service",
            name="price_max",
        ),
    ]
