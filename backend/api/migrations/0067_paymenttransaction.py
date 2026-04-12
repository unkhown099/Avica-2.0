from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0066_queueentry_paid_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="PaymentTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("transaction_type", models.CharField(choices=[("appointment", "Appointment"), ("walk_in", "Walk-in"), ("service", "Service"), ("product", "Product")], max_length=20)),
                ("description", models.CharField(blank=True, default="", max_length=255)),
                ("quantity", models.PositiveIntegerField(default=1)),
                ("amount", models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ("payment_method", models.CharField(blank=True, default="", max_length=20)),
                ("notes", models.TextField(blank=True, default="")),
                ("paid_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("branch", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="payment_transactions", to="api.branch")),
                ("queue_entry", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="payment_transactions", to="api.queueentry")),
                ("staff", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="payment_transactions", to="api.staff")),
            ],
            options={
                "db_table": "payment_transactions",
                "ordering": ["-paid_at", "-created_at"],
            },
        ),
    ]
