from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0031_service_single_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="queueentry",
            name="service_base_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="queueentry",
            name="vehicle_type",
            field=models.CharField(blank=True, choices=[("motor", "Motor"), ("small", "Small"), ("medium", "Medium"), ("large", "Large"), ("xl", "XL")], default="", max_length=20),
        ),
    ]
