from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0024_alter_queueentry_branch_name"),
    ]

    operations = [
        migrations.CreateModel(
            name="RestockRequest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("quantity_requested", models.PositiveIntegerField(default=1)),
                ("notes", models.TextField(blank=True, default="")),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("reviewer_note", models.TextField(blank=True, default="")),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "branch",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="restock_requests", to="api.branch"),
                ),
                (
                    "inventory_item",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="restock_requests", to="api.inventoryitem"),
                ),
                (
                    "requested_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="restock_requests_created", to="api.staff"),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="restock_requests_reviewed", to="api.staff"),
                ),
            ],
            options={
                "db_table": "restock_requests",
                "ordering": ["-created_at"],
            },
        ),
    ]
