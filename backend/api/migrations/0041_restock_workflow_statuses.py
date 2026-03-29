from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0040_queueentry_customer_user"),
    ]

    operations = [
        migrations.AlterField(
            model_name="restockrequest",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("approved", "Approved"),
                    ("received", "Received"),
                    ("rejected", "Rejected"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="inventorytransaction",
            name="action_type",
            field=models.CharField(
                choices=[
                    ("create", "Create"),
                    ("update", "Update"),
                    ("archive", "Archive"),
                    ("restore", "Restore"),
                    ("transfer_out", "Transfer Out"),
                    ("transfer_in", "Transfer In"),
                    ("restock_request", "Restock Request"),
                    ("restock_approved", "Restock Approved"),
                    ("restock_received", "Restock Received"),
                    ("restock_rejected", "Restock Rejected"),
                ],
                max_length=30,
            ),
        ),
    ]
