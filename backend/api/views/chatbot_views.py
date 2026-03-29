from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import requests

SYSTEM_PROMPT = """You are a helpful customer support assistant for Otokwikk, a premium automotive detailing shop in North Caloocan, Metro Manila.

About Otokwikk:
- Services: Exterior detailing (multi-stage wash, clay bar, machine polish), Interior detailing (steam cleaning, leather conditioning, deep extraction), and Protection packages (Ceramic coating 9H hardness, PPF applications).
- Location: Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila
- Hours: Monday - Sunday, 8:00 AM - 7:00 PM
- Contact: +63 9XX XXX XXXX | info@otokwikk.com
- Stats: 10,000+ premium clients served, 5.0 average rating, 15+ years expertise

Be concise, warm, and professional. Help customers with bookings, service inquiries, pricing, and general support. If you cannot answer something specific, invite them to call or visit the shop."""


@api_view(['POST'])
def chat_with_groq(request):
    try:
        messages = request.data.get("messages", [])
        if not messages:
            return Response({"reply": "No messages received."}, status=400)

        # Strip any system messages sent from frontend — backend controls this
        filtered = [m for m in messages if m.get("role") != "system"]

        payload = {
            "model": "openai/gpt-oss-20b",
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                *filtered,
            ],
            "temperature": 0.7,
            "max_tokens": 150,
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