from django.db import migrations

PLUGINS = [
    {"name": "Booking Engine", "slug": "booking-engine", "description": "Core booking and appointment scheduling system.", "version": "2.1.0", "author": "Otokwikk", "category": "other", "status": "active", "is_system": True},
    {"name": "Queue Manager", "slug": "queue-manager", "description": "Walk-in queue and real-time service tracking.", "version": "1.8.0", "author": "Otokwikk", "category": "automation", "status": "active", "is_system": True},
    {"name": "Inventory Tracker", "slug": "inventory-tracker", "description": "Stock management, restock alerts, and demand forecasting.", "version": "1.5.2", "author": "Otokwikk", "category": "reporting", "status": "active", "is_system": False},
    {"name": "SMS Notifications", "slug": "sms-notifications", "description": "Send SMS alerts to customers for bookings and queue updates.", "version": "1.0.0", "author": "Otokwikk", "category": "notifications", "status": "inactive", "is_system": False},
    {"name": "Analytics Dashboard", "slug": "analytics-dashboard", "description": "Advanced reporting and business intelligence charts.", "version": "1.2.0", "author": "Otokwikk", "category": "analytics", "status": "inactive", "is_system": False},
    {"name": "PayMongo Gateway", "slug": "paymongo-gateway", "description": "Online payment processing via PayMongo.", "version": "2.0.1", "author": "Otokwikk", "category": "payment", "status": "active", "is_system": False},
    {"name": "AI Chatbot", "slug": "ai-chatbot", "description": "Groq-powered chatbot for customer support and vehicle analysis.", "version": "1.1.0", "author": "Otokwikk", "category": "integrations", "status": "active", "is_system": False},
    {"name": "Google OAuth", "slug": "google-oauth", "description": "Sign in with Google integration.", "version": "1.0.0", "author": "Otokwikk", "category": "integrations", "status": "active", "is_system": False},
    {"name": "Email Notifications", "slug": "email-notifications", "description": "Automated email alerts for bookings, reminders, and broadcasts.", "version": "1.3.0", "author": "Otokwikk", "category": "notifications", "status": "active", "is_system": False},
    {"name": "Damage Analysis AI", "slug": "damage-analysis-ai", "description": "AI-powered vehicle damage detection and assessment.", "version": "1.0.5", "author": "Otokwikk", "category": "automation", "status": "active", "is_system": False},
    {"name": "Marketing Broadcast", "slug": "marketing-broadcast", "description": "Send promotional messages and announcements to user segments.", "version": "1.0.0", "author": "Otokwikk", "category": "marketing", "status": "inactive", "is_system": False},
]

def seed_plugins(apps, schema_editor):
    Plugin = apps.get_model("api", "Plugin")
    for p in PLUGINS:
        Plugin.objects.get_or_create(slug=p["slug"], defaults=p)

def unseed_plugins(apps, schema_editor):
    Plugin = apps.get_model("api", "Plugin")
    slugs = [p["slug"] for p in PLUGINS]
    Plugin.objects.filter(slug__in=slugs).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("api", "0064_rating_response_status"),
    ]

    operations = [
        migrations.RunPython(seed_plugins, unseed_plugins),
    ]