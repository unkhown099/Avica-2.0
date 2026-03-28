from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0039_booking_no_show_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="queueentry",
            name="customer_user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="walkin_queue_entries",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
