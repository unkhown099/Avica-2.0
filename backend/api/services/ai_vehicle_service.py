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
            "model": "qwen/qwen3.5-27b",
            "max_tokens": 256,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """
                            Analyze the vehicle and return JSON ONLY in this exact format:

                            {
                              "make": "Toyota",
                              "model": "Corolla",
                              "year": "2015",
                              "color": "Red",
                              "bodyType": "Sedan",
                              "condition": "Good",
                              "confidence": "high",
                              "features": ["sunroof", "alloy wheels"],
                              "additionalNotes": "..."
                            }

                            If you cannot determine a field, set it to null.
                            Do not return anything except JSON.
                            """
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
        if content.startswith("```"):
            content = content.strip("```").replace("json", "").strip()
        return json.loads(content)
    except Exception as e:
        print("ERROR PARSING AI RESPONSE:", e)
        return {"error": "AI response not valid JSON", "raw": ai_response}