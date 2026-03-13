from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import requests

@api_view(['POST'])
def chat_with_groq(request):
    try:
        messages = request.data.get("messages", [])
        if not messages:
            return Response({"reply": "No messages received."}, status=400)

        payload = {
            "model": "openai/gpt-oss-20b",  # Groq chat model
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 150  # limit tokens to save cost
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.GROQ_API_KEY}"
        }

        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=payload,
            headers=headers,
            timeout=15
        )

        data = response.json()
        print("Groq API raw response:", data)  # <-- see full response in terminal

        reply = data.get("choices", [{}])[0].get("message", {}).get(
            "content",
            "Sorry, I couldn't process that."
        )

        return Response({"reply": reply})

    except Exception as e:
        print("Chatbot error:", e)
        return Response({"reply": "Something went wrong. Please try again later."}, status=500)