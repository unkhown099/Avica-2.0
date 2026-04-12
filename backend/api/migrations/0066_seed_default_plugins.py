from django.db import migrations

PLUGINS = [
    {
        "name": "Analytics Tracker",
        "slug": "analytics-tracker",
        "description": "Track user behavior, page views, and conversions with Google Analytics and Facebook Pixel integration.",
        "version": "2.1.0",
        "author": "Otokwikk Team",
        "website": "https://otokwikk.com/plugins/analytics",
        "category": "analytics",
        "status": "active",
        "is_system": False,
        "settings": {"facebook_pixel_id": "", "google_analytics_id": "", "enable_enhanced_ecommerce": True},
    },
    {
        "name": "Email Notifications",
        "slug": "email-notifications",
        "description": "Advanced email notification system with customizable templates and automated workflows.",
        "version": "1.5.0",
        "author": "Otokwikk Team",
        "website": "https://otokwikk.com/plugins/emailnotifications",
        "category": "notifications",
        "status": "inactive",
        "is_system": False,
        "settings": {"send_welcome_emails": True, "email_template_theme": "modern", "reminder_hours_before": 24, "send_booking_reminders": True},
    },
    {
        "name": "SMS Notifications",
        "slug": "sms-notifications",
        "description": "Send SMS alerts for booking confirmations, reminders, and promotions.",
        "version": "1.2.0",
        "author": "Otokwikk Team",
        "website": "https://otokwikk.com/plugins/smsnotifications",
        "category": "notifications",
        "status": "inactive",
        "is_system": False,
        "settings": {"api_key": "", "api_secret": "", "from_number": "", "api_provider": "twilio", "send_reminders": True, "send_confirmations": True},
    },
    {
        "name": "Inventory Sync",
        "slug": "inventory-sync",
        "description": "Synchronize inventory across multiple branches and external POS systems.",
        "version": "1.0.0",
        "author": "Otokwikk Team",
        "website": "https://otokwikk.com/plugins/inventory-sync",
        "category": "integrations",
        "status": "active",
        "is_system": False,
        "settings": {"sync_on_sale": True, "low_stock_alert_threshold": 10, "auto_sync_interval_minutes": 30},
    },
    {
        "name": "Payment Gateways",
        "slug": "payment-gateways",
        "description": "Integrate multiple payment providers including Stripe, PayPal, and GCash.",
        "version": "2.0.0",
        "author": "Otokwikk Team",
        "website": "https://otokwikk.com/plugins/payments",
        "category": "payment",
        "status": "inactive",
        "is_system": False,
        "settings": {"gcash_api_key": "", "gcash_enabled": False, "paypal_secret": "", "paypal_enabled": False, "stripe_enabled": False, "paypal_client_id": "", "stripe_public_key": "", "stripe_secret_key": ""},
    },
    {
        "name": "Advanced Reporting",
        "slug": "advanced-reporting",
        "description": "Generate detailed reports with custom metrics, export to PDF/Excel, and scheduled reports.",
        "version": "1.3.0",
        "author": "Otokwikk Team",
        "website": "https://otokwikk.com/plugins/reporting",
        "category": "reporting",
        "status": "active",
        "is_system": False,
        "settings": {"default_report_format": "pdf", "report_retention_days": 90, "enable_scheduled_reports": True},
    },
]

def seed(apps, schema_editor):
    Plugin = apps.get_model("api", "Plugin")
    for p in PLUGINS:
        Plugin.objects.get_or_create(slug=p["slug"], defaults=p)

def unseed(apps, schema_editor):
    Plugin = apps.get_model("api", "Plugin")
    Plugin.objects.filter(slug__in=[p["slug"] for p in PLUGINS]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("api", "0065_seed_plugins"),  # ← replace with your actual last migration
    ]

    operations = [
        migrations.RunPython(seed, unseed),
    ]