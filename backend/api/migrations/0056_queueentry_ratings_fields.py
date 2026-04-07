from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0055_merge_0052_servicemessage_0054_merge_20260405_1014"),
    ]

    operations = [
        migrations.AddField(
            model_name="queueentry",
            name="rated_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="queueentry",
            name="rating_comment",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="queueentry",
            name="rating_score",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
