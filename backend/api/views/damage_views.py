import json
import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication


class AnalyzeDamageView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        images = request.data.get("images", [])
        if not images:
            return Response({"error": "No images provided"}, status=400)

        # Build image content blocks
        image_blocks = [
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{img}"}
            }
            for img in images
        ]

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DAMAGE_DETECTION_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "qwen/qwen2.5-vl-72b-instruct",
                "max_tokens": 512,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """You are an expert automotive damage assessor with 20 years of experience.

Analyze the vehicle image(s) for any damage and return JSON ONLY in this exact format:

{
  "damageDetected": true,
  "confidence": 0.92,
  "damages": [
    {
      "type": "Scratch",
      "location": "Front bumper",
      "severity": "Minor",
      "confidence": 0.95
    }
  ],
  "recommendations": [
    "Paint touch-up recommended for scratches"
  ],
  "estimatedCost": "₱3,500 – ₱5,000"
}

STRICT RULES:
- "damageDetected": ALWAYS true or false based on what you see.
- "confidence": overall confidence as decimal 0.0 to 1.0. NEVER null.
- "damages": list all visible damage. Empty array [] if none found.
- Each damage must have type, location, severity (Minor/Moderate/Severe), and confidence.
- "recommendations": list actionable repair recommendations. Empty array [] if no damage.
- "estimatedCost": provide a Philippine Peso range estimate (e.g. "₱2,000 – ₱4,000"). If no damage, set to "₱0".
- Only return valid JSON. No markdown, no backticks, no explanation."""
                            },
                            *image_blocks
                        ]
                    }
                ]
            },
        )

        ai_response = response.json()

        try:
            content = ai_response["choices"][0]["message"]["content"].strip()
            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()
            return Response(json.loads(content))
        except Exception as e:
            print("ERROR PARSING DAMAGE AI RESPONSE:", e)
            print("RAW:", json.dumps(ai_response, indent=2))
            return Response({"error": "AI response not valid JSON", "raw": str(ai_response)}, status=500)