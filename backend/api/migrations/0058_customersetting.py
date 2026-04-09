from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0057_directmessage"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomerSetting",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("notifications", models.JSONField(blank=True, default=dict)),
                ("privacy", models.JSONField(blank=True, default=dict)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "customer",
                    models.OneToOneField(
                        on_delete=models.deletion.CASCADE,
                        related_name="settings",
                        to="api.customer",
                    ),
                ),
            ],
            options={
                "db_table": "customer_settings",
            },
        ),
    ]
