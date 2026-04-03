from django.db import migrations

def add_default_plugins(apps, schema_editor):
    Plugin = apps.get_model('api', 'Plugin')
    
    default_plugins = [
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
            "settings": {
                "google_analytics_id": "",
                "facebook_pixel_id": "",
                "enable_enhanced_ecommerce": True,
            },
        },
        {
            "name": "Email Notifications",
            "slug": "email-notifications",
            "description": "Advanced email notification system with customizable templates and automated workflows.",
            "version": "1.5.0",
            "author": "Otokwikk Team",
            "website": "https://otokwikk.com/plugins/email",
            "category": "notifications",
            "status": "inactive",
            "is_system": False,
            "settings": {
                "send_welcome_emails": True,
                "send_booking_reminders": True,
                "reminder_hours_before": 24,
                "email_template_theme": "modern",
            },
        },
        {
            "name": "SMS Notifications",
            "slug": "sms-notifications",
            "description": "Send SMS alerts for booking confirmations, reminders, and promotions.",
            "version": "1.2.0",
            "author": "Otokwikk Team",
            "website": "https://otokwikk.com/plugins/sms",
            "category": "notifications",
            "status": "inactive",
            "is_system": False,
            "settings": {
                "api_provider": "twilio",
                "api_key": "",
                "api_secret": "",
                "from_number": "",
                "send_confirmations": True,
                "send_reminders": True,
            },
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
            "settings": {
                "auto_sync_interval_minutes": 30,
                "sync_on_sale": True,
                "low_stock_alert_threshold": 10,
            },
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
            "settings": {
                "stripe_enabled": False,
                "stripe_public_key": "",
                "stripe_secret_key": "",
                "paypal_enabled": False,
                "paypal_client_id": "",
                "paypal_secret": "",
                "gcash_enabled": False,
                "gcash_api_key": "",
            },
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
            "settings": {
                "default_report_format": "pdf",
                "enable_scheduled_reports": True,
                "report_retention_days": 90,
            },
        },
    ]
    
    for plugin_data in default_plugins:
        Plugin.objects.create(**plugin_data)

def remove_default_plugins(apps, schema_editor):
    Plugin = apps.get_model('api', 'Plugin')
    Plugin.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0052_plugin_pluginlog'),
    ]

    operations = [
        migrations.RunPython(add_default_plugins, remove_default_plugins),
    ]