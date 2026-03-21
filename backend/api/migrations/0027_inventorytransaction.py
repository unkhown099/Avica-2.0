from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0026_inventoryitem_is_active"),
    ]

    operations = [
        migrations.CreateModel(
            name="InventoryTransaction",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("action_type", models.CharField(choices=[("create", "Create"), ("update", "Update"), ("archive", "Archive"), ("restore", "Restore"), ("transfer_out", "Transfer Out"), ("transfer_in", "Transfer In"), ("restock_request", "Restock Request"), ("restock_rejected", "Restock Rejected")], max_length=30)),
                ("quantity_before", models.IntegerField(blank=True, null=True)),
                ("quantity_after", models.IntegerField(blank=True, null=True)),
                ("quantity_changed", models.IntegerField(default=0)),
                ("branch_name", models.CharField(blank=True, default="", max_length=100)),
                ("target_branch_name", models.CharField(blank=True, default="", max_length=100)),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("inventory_item", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="transactions", to="api.inventoryitem")),
                ("performed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="inventory_transactions", to="api.staff")),
            ],
            options={
                "db_table": "inventory_transactions",
                "ordering": ["-created_at"],
            },
        ),
    ]
