from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0063_alter_queueentry_vehicle_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="rating",
            name="response_status",
            field=models.CharField(
                choices=[("pending", "Pending"), ("responded", "Responded")],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="rating",
            name="responded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="rating",
            name="responded_by",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="ratings_responded",
                to="api.staff",
            ),
        ),
    ]
