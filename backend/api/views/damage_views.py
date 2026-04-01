import json
import requests
from django.conf import settings
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from ..models import Service


class AnalyzeDamageView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        images = request.data.get("images", [])
        if not images:
            return Response({"error": "No images provided"}, status=400)

        image_blocks = [
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{img}"}
            }
            for img in images
        ]

        # ── Pull all active services so AI can match by name ─────────────────
        active_services = Service.objects.filter(is_active=True)
        service_names = [s.name for s in active_services]
        service_catalog_text = ", ".join(service_names) if service_names else "No services available"

        # ── Debug: show what services are available ───────────────────────────
        print("=== DAMAGE DETECTION DEBUG ===")
        print("Available service names in DB:", service_names)

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.DAMAGE_DETECTION_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "google/gemini-2.0-flash-001",  # ← switched for better bbox accuracy
                "max_tokens": 700,  # ← bumped up for Gemini's more verbose responses
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"""You are an expert automotive damage assessor.

Analyze the vehicle image(s) for damage. Then, from the service catalog below, recommend which services apply.

AVAILABLE SERVICES (use EXACT names only):
{service_catalog_text}

Return JSON ONLY in this exact format:

{{
  "damageDetected": true,
  "confidence": 0.92,
  "damages": [
    {{
      "type": "Scratch",
      "location": "Front bumper",
      "severity": "Minor",
      "confidence": 0.95,
      "boundingBox": {{
        "x": 0.12,
        "y": 0.45,
        "width": 0.18,
        "height": 0.09
      }}
    }}
  ],
  "recommendations": ["Paint touch-up recommended"],
  "recommendedServiceNames": ["Exterior Detail"],
  "estimatedCost": "₱3,500 – ₱5,000"
}}

BOUNDING BOX RULES:
- All values are 0.0 to 1.0 as a fraction of image dimensions.
- "x" and "y" are the TOP-LEFT corner of the damage area.
- "width" and "height" cover the full damage region.
- If you cannot localize a damage precisely, omit the boundingBox key for that damage only.
- Bounding boxes must be TIGHT around the specific damage only — not the whole panel or car.
- For a dent: box only the crumpled or deformed metal area.
- For a crack: box only the crack line and immediate surrounding area.
- Maximum box size: width and height should rarely exceed 0.35 of the image dimension.
- If multiple separate damage areas exist on the same panel, draw a separate box for each.
- Always prioritize the most visually prominent damage area — crumpled or deformed metal takes priority over surface scratches.
- Do not box the grille or undamaged panels as damage areas.

OTHER STRICT RULES:
- "damageDetected": true or false.
- "confidence": decimal 0.0–1.0. NEVER null.
- "damages": list all visible damage. Empty array [] if none.
- "severity" ONLY accepts these 3 values: "Minor", "Moderate", "Severe".
- NEVER write "Major", "Critical", "Heavy", "Extreme", or any other word for severity.
- If damage is very bad, use "Severe". That is the maximum value allowed.
- Using any severity value other than Minor/Moderate/Severe will cause a system error.
- "recommendations": general repair advice strings.
- "recommendedServiceNames": exact names from catalog only. Empty array [] if none match.
- "estimatedCost": Philippine Peso range. "₱0" if no damage.
- Return valid JSON only. No markdown, no backticks, no explanation."""
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

            # ── Debug: show raw AI response ───────────────────────────────────
            print("AI raw response:", content[:500])  # first 500 chars to avoid log spam

            if "```" in content:
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            result = json.loads(content)

            # ── Debug: show what AI recommended ──────────────────────────────
            print("AI recommendedServiceNames:", result.get("recommendedServiceNames", []))

            # ── Match recommended service names back to DB objects ────────────
            recommended_names = result.get("recommendedServiceNames", [])
            matched_services = []

            if recommended_names:
                for name in recommended_names:
                    # 1st try: exact case-insensitive match
                    svc = active_services.filter(name__iexact=name).first()

                    # 2nd try: partial match — service name contains the AI word
                    if not svc:
                        svc = active_services.filter(name__icontains=name).first()

                    # 3rd try: AI word contains the service name (e.g. "Dent Repair" matches "Repair")
                    if not svc:
                        for active_svc in active_services:
                            if active_svc.name.lower() in name.lower():
                                svc = active_svc
                                break

                    print(f"  Matching '{name}' → {'FOUND: ' + svc.name if svc else 'NOT FOUND'}")

                    if svc:
                        matched_services.append({
                            "id": svc.id,
                            "name": svc.name,
                            "price": str(svc.price),
                            "price_list": svc.price_list,
                            "category": svc.category,
                            "duration": svc.duration,
                            "description": svc.description,
                            "branches": [
                                {"id": b.id, "name": b.name}
                                for b in svc.branches.filter(is_active=True)
                            ],
                        })

            # ── Deduplicate by id ─────────────────────────────────────────────
            seen_ids = set()
            deduped = []
            for s in matched_services:
                if s["id"] not in seen_ids:
                    seen_ids.add(s["id"])
                    deduped.append(s)

            print(f"Matched services count: {len(deduped)}")
            print("==============================")

            result["matchedServices"] = deduped
            return Response(result)

        except Exception as e:
            print("ERROR PARSING DAMAGE AI RESPONSE:", e)
            print("RAW:", json.dumps(ai_response, indent=2))
            return Response({"error": "AI response not valid JSON", "raw": str(ai_response)}, status=500)