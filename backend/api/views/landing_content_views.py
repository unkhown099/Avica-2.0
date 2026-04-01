from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from api.models import LandingContent
from api.permissions import IsSuperAdmin


# ── Default content (fallback if DB row doesn't exist yet) ───────────────────
DEFAULT_CONTENT = {
    "hero": {
        "headline": "PRECISION",
        "headlineAccent": "DETAILING",
        "subtitle": "Experience the Art of Automotive Perfection",
        "ctaLoggedIn": "GO TO DASHBOARD",
        "ctaGuest": "BOOK YOUR EXPERIENCE",
        "signInPrompt": "Part of the elite?",
        "signInLabel": "SIGN IN HERE",
    },
    "services": {
        "sectionTitle": "OUR",
        "sectionTitleAccent": "SERVICES",
        "sectionSubtitle": "Precision-driven solutions for every automotive need. We bring out the best in every vehicle.",
        "items": [
            {
                "title": "EXTERIOR",
                "sub": "Showroom Shine",
                "desc": "Multi-stage washing process, clay bar treatment, and machine polishing for a mirror-like finish.",
            },
            {
                "title": "INTERIOR",
                "sub": "Pure Luxury",
                "desc": "Steam cleaning, leather conditioning, and deep extraction for a sterile, fresh-from-factory interior.",
            },
            {
                "title": "PROTECTION",
                "sub": "Ultima Guard",
                "desc": "Grade-A Ceramic coatings and PPF applications providing 9H hardness and hydrophobic properties.",
            },
        ],
    },
    "branches": [
        {
            "name": "North Caloocan",
            "id": "north",
            "address": "Lot 1 Block 1, Camarin Road, North Caloocan, Metro Manila",
            "hours": "8:00 AM - 7:00 PM",
            "phone": "+63 9XX XXX XXXX",
            "fb": "https://www.facebook.com/profile.php?id=100090897126761",
            "mapUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1930.5615!2d121.023!3d14.752!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b1b477bf30a7%3A0x34a49388d0848c77!2sOtokwikk%20North%20Caloocan!5e0!3m2!1sen!2sph!4v1708740000000!5m2!1sen!2sph",
        },
        {
            "name": "South Caloocan",
            "id": "south",
            "address": "77 General Tinio, Morning Breeze Subdivision, Caloocan",
            "hours": "8:00 AM - 7:00 PM",
            "phone": "+63 9XX XXX XXXX",
            "fb": "https://www.facebook.com/profile.php?id=61572528405228",
            "mapUrl": "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3860.1066!2d120.9878!3d14.6624!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397b73d971961bd%3A0x44a251e7c7d1e2bc!2sOtokwikk%20South%20Caloocan!5e0!3m2!1sen!2sph!4v1742220000000!5m2!1sen!2sph",
        },
    ],
    "reviews": [
        {"name": "SIR BJ",            "city": "Tanza, Cavite",       "text": "Ang ganda ng linis, may pafoot paper and wheel plastic covering pa! Dami magpapalinis pag ganyan. Heheh Dito ko na papalinis mga kotse ng skul."},
        {"name": "SIR CLARENZ",        "city": "Quezon City",         "text": "Panalo yung engine wash nyo sir! Linis lahat! Papuntahin ko yung ninong ko dyan ipa engine wash nya yung Innova nya."},
        {"name": "SIR JOHN RONAN",     "city": "San Mateo, Rizal",    "text": "SOLID! Worth it yung bayad! Mura na, QUALITY pa."},
        {"name": "SIR GERMAINE DANCA", "city": "North Caloocan",      "text": "For top notch and premium car care and affordable price.. Visit #Otokwikk at Saranay Road, Caloocan City."},
        {"name": "SIR MIGS ONG",       "city": "South Caloocan",      "text": "Thanks heaps for the top-notch service, Otokwikk! Highly recommended! Pogi na ulit si Sky!"},
    ],
    "fbPages": [
        {"name": "Otokwikk - North Caloocan",  "url": "https://www.facebook.com/profile.php?id=100090897126761"},
        {"name": "Otokwikk - Tanza Cavite",    "url": "https://www.facebook.com/otokwikk.tanzacavite"},
        {"name": "Otokwikk - Camarin",         "url": "https://www.facebook.com/profile.php?id=61586571534281"},
        {"name": "Otokwikk - Quezon City",     "url": "https://www.facebook.com/profile.php?id=61577247173903"},
        {"name": "Otokwikk - South Caloocan",  "url": "https://www.facebook.com/profile.php?id=61572528405228"},
        {"name": "Otokwikk - San Mateo Rizal", "url": "https://www.facebook.com/profile.php?id=61556323569842"},
    ],
    "footer": {
        "tagline": "Empowering car owners with precision care and premium detailing that protects every drive.",
        "copyright": "Copyright © 2026, otokwikk. All Rights Reserved.",
        "siteMapLinks": [
            {"label": "Homepage", "href": "#"},
            {"label": "Services",  "href": "#"},
            {"label": "Branches",  "href": "#"},
            {"label": "Client Reviews", "href": "#"},
            {"label": "Facebook Pages", "href": "#"},
            {"label": "Sign In",   "href": "/signin"},
            {"label": "Sign Up",   "href": "/signup"},
        ],
        "legalLinks": [
            {"label": "Privacy Policy",  "href": "#"},
            {"label": "Terms of Service","href": "#"},
            {"label": "Cookie Policy",   "href": "#"},
        ],
    },
}


def _get_or_create_row():
    """Return (instance, created). Creates the default row on first call."""
    obj, created = LandingContent.objects.get_or_create(
        key="default",
        defaults={"content": DEFAULT_CONTENT},
    )
    return obj, created


# ── Public GET — no auth required ─────────────────────────────────────────────
class LandingContentPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        obj, _ = _get_or_create_row()
        return Response(obj.content)


# ── Super-admin GET + PUT ──────────────────────────────────────────────────────
class LandingContentAdminView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        obj, _ = _get_or_create_row()
        return Response({
            "content":    obj.content,
            "updated_at": obj.updated_at,
            "updated_by": obj.updated_by.email if obj.updated_by else None,
        })

    def put(self, request):
        content = request.data.get("content")
        if not isinstance(content, dict):
            return Response(
                {"error": "`content` must be a JSON object."},
                status=400,
            )

        # Basic shape validation — all top-level keys must be present
        required_keys = {"hero", "services", "branches", "reviews", "fbPages", "footer"}
        missing = required_keys - set(content.keys())
        if missing:
            return Response(
                {"error": f"Missing required sections: {', '.join(missing)}"},
                status=400,
            )

        obj, _ = _get_or_create_row()
        obj.content    = content
        obj.updated_by = request.user
        obj.save()

        return Response({
            "message":    "Landing content saved successfully.",
            "updated_at": obj.updated_at,
            "updated_by": request.user.email,
        })