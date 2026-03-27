from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0029_booking_cancellation_reason"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="price_list",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
