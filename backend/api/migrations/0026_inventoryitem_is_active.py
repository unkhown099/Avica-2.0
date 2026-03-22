from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0025_restockrequest"),
    ]

    operations = [
        migrations.AddField(
            model_name="inventoryitem",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
