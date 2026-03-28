from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0037_remove_customer_age_customer_birth_date"),
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
                    ("done", "Done"),
                    ("rescheduled", "Rescheduled"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="booking",
            name="reschedule_note",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="booking",
            name="reschedule_options",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="booking",
            name="reschedule_previous_status",
            field=models.CharField(default="confirmed", max_length=20),
        ),
        migrations.AddField(
            model_name="booking",
            name="reschedule_selected_option",
            field=models.JSONField(blank=True, default=None, null=True),
        ),
        migrations.AddField(
            model_name="booking",
            name="reschedule_status",
            field=models.CharField(
                choices=[
                    ("none", "None"),
                    ("pending_customer", "Pending Customer Response"),
                    ("accepted", "Accepted"),
                    ("declined", "Declined"),
                ],
                default="none",
                max_length=30,
            ),
        ),
        migrations.AddField(
            model_name="booking",
            name="reschedule_proposed_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="proposed_reschedules",
                to="api.staff",
            ),
        ),
    ]
