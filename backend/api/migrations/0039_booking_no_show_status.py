from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0038_booking_reschedule_fields"),
    ]

    operations = [
        migrations.AlterField(
            model_name="booking",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("confirmed", "Confirmed"),
                    ("cancelled", "Cancelled"),
                    ("no_show", "No Show"),
                    ("done", "Done"),
                    ("rescheduled", "Rescheduled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
