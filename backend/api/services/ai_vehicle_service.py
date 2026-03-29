import json
import requests
from django.conf import settings

def analyze_vehicle_image(base64_image: str) -> dict:
    if not base64_image:
        return {"error": "No image provided"}

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "qwen/qwen2.5-vl-72b-instruct",
            "max_tokens": 256,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """You are an expert automotive analyst with 20 years of experience identifying vehicles.

Analyze this vehicle image and return JSON ONLY in this exact format:

{
  "make": "Toyota",
  "model": "Corolla",
  "year": "2018-2022",
  "color": "Red",
  "bodyType": "Sedan",
  "condition": "Good",
  "confidence": "high",
  "features": ["sunroof", "alloy wheels"],
  "additionalNotes": "..."
}

STRICT RULES:
- "year": ALWAYS provide your best estimate or range (e.g. "2015-2019"). NEVER return null.
- "condition": ALWAYS choose one: "Excellent", "Good", "Fair", or "Poor" based on visible paint, body panels, and overall appearance. NEVER return null.
- "make": ALWAYS provide your best guess even if uncertain. NEVER return null.
- "model": provide best guess or null only if truly impossible.
- "color": ALWAYS provide the dominant color. NEVER return null.
- "bodyType": ALWAYS provide (Sedan, SUV, Truck, Sports Car, etc). NEVER return null.
- Only return valid JSON. No markdown, no backticks, no explanation."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
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
        return json.loads(content)
    except Exception as e:
        print("ERROR PARSING AI RESPONSE:", e)
        print("RAW RESPONSE:", json.dumps(ai_response, indent=2))
        return {"error": "AI response not valid JSON", "raw": str(ai_response)}