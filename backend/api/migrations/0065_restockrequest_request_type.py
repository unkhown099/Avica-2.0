from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0064_rating_response_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="restockrequest",
            name="request_type",
            field=models.CharField(
                choices=[("restock", "Restock"), ("transfer", "Transfer")],
                default="restock",
                max_length=20,
            ),
        ),
    ]
