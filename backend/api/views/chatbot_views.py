from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import requests

# Import your models
from ..models import Branch, Service, ServiceCategory


def build_system_prompt():
    """Dynamically build the system prompt from live DB data."""

    # ── Branches ──────────────────────────────────────────────────────────────
    branches = Branch.objects.filter(is_active=True)
    branch_lines = []
    for b in branches:
        branch_lines.append(f"  • {b.name} — {b.address} | Hours: {b.hours} | Slots: {b.slots}")
    branches_text = "\n".join(branch_lines) if branch_lines else "  • No active branches found."

    # ── Services (grouped by category) ───────────────────────────────────────
    services = Service.objects.filter(is_active=True).order_by("category", "name")
    services_by_category = {}
    for svc in services:
        services_by_category.setdefault(svc.category, []).append(svc)

    service_lines = []
    for category, svcs in services_by_category.items():
        service_lines.append(f"\n  [{category}]")
        for svc in svcs:
            if svc.price_list:
                price_parts = ", ".join(
                    f"{size}: ₱{amt}" for size, amt in svc.price_list.items()
                )
                price_str = f"Price by size: {price_parts}"
            else:
                price_str = f"Price: ₱{svc.price}"

            desc = f" — {svc.description}" if svc.description else ""
            dur  = f" | Duration: {svc.duration}" if svc.duration else ""
            service_lines.append(f"    • {svc.name}{desc} | {price_str}{dur}")

    services_text = "\n".join(service_lines) if service_lines else "  • No active services found."

    # ── Compose prompt ────────────────────────────────────────────────────────
    return f"""You are a helpful customer support assistant for Otokwikk, a premium automotive detailing shop in Metro Manila.

BRANCHES (live from database):
{branches_text}

SERVICES (live from database):
{services_text}

GENERAL INFO:
- Contact: +63 9XX XXX XXXX | info@otokwikk.com
- Stats: 10,000+ premium clients served, 5.0 average rating, 15+ years expertise

INSTRUCTIONS:
- Be concise, warm, and professional.
- When asked about services, always include the name, price, and duration.
- When asked about branches, include the address and hours.
- Help customers with bookings, service inquiries, pricing, and general support.
- If you cannot answer something specific, invite them to call or visit the shop.
- Always answer based on the live data above — do not invent services or locations."""


@api_view(['POST'])
def chat_with_groq(request):
    try:
        messages = request.data.get("messages", [])
        if not messages:
            return Response({"reply": "No messages received."}, status=400)

        filtered = [m for m in messages if m.get("role") != "system"]

        system_prompt = build_system_prompt()

        payload = {
            "model": "openai/gpt-oss-20b",
            "messages": [
                {"role": "system", "content": system_prompt},
                *filtered,
            ],
            "temperature": 0.7,
            "max_tokens": 300,
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=15,
        )

        data = response.json()
        reply = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "Sorry, I couldn't process that.")
        )

        return Response({"reply": reply})

    except Exception as e:
        print("Chatbot error:", e)
        return Response({"reply": "Something went wrong. Please try again later."}, status=500)