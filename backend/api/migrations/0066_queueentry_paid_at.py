from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0065_restockrequest_request_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="queueentry",
            name="paid_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
