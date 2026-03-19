from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_fix_queueentry_branch_nullable'),
    ]

    operations = [
        migrations.AlterField(
            model_name='queueentry',
            name='branch_name',
            field=models.CharField(max_length=200, blank=True, null=True, default=''),
        ),
    ]