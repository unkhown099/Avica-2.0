from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0013_alter_booking_options_alter_queueentry_options_and_more'),
    ]

    operations = [
        # Since branch_name columns already exist in the database,
        # we just need to tell Django about them without trying to add them again
        
        # For Staff model
        migrations.AlterField(
            model_name='staff',
            name='branch_name',
            field=models.CharField(
                max_length=100,
                blank=True,
                default="",
                help_text="Legacy plain-text branch name. Kept for reference; use `branch` FK instead.",
            ),
        ),
        
        # For QueueEntry model
        migrations.AlterField(
            model_name='queueentry',
            name='branch_name',
            field=models.CharField(
                max_length=200,
                blank=True,
                default="",
                help_text="Legacy plain-text branch name. Use `branch` FK instead.",
            ),
        ),
        
        # Also ensure the new branch FK fields are properly set up
        migrations.AlterField(
            model_name='staff',
            name='branch',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='staff_members',
                to='api.branch',
            ),
        ),
        
        migrations.AlterField(
            model_name='queueentry',
            name='branch',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='queue_entries',
                to='api.branch',
            ),
        ),
    ]