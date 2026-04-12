from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0067_paymenttransaction"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReportRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("report_type", models.CharField(choices=[("dashboard_summary", "Dashboard Summary"), ("revenue_breakdown", "Revenue Breakdown"), ("customer_insights", "Customer Insights")], default="dashboard_summary", max_length=50)),
                ("scope_type", models.CharField(choices=[("global", "Global"), ("branch", "Branch")], default="global", max_length=20)),
                ("period_type", models.CharField(choices=[("weekly", "Weekly"), ("monthly", "Monthly"), ("quarterly", "Quarterly"), ("yearly", "Yearly"), ("custom", "Custom")], default="monthly", max_length=20)),
                ("filters", models.JSONField(blank=True, default=dict)),
                ("summary", models.JSONField(blank=True, default=dict)),
                ("file_path", models.CharField(blank=True, default="", max_length=255)),
                ("status", models.CharField(choices=[("completed", "Completed"), ("failed", "Failed")], default="completed", max_length=20)),
                ("error_message", models.TextField(blank=True, default="")),
                ("generated_at", models.DateTimeField(auto_now_add=True)),
                ("branch", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="report_runs", to="api.branch")),
                ("generated_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="generated_reports", to="api.staff")),
            ],
            options={
                "db_table": "report_runs",
                "ordering": ["-generated_at"],
            },
        ),
    ]
