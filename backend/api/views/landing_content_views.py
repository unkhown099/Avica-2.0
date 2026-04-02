from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from api.models import LandingContent, MediaAsset
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
        "imageUrl": "",
        "images": [],
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
    "posts": [
        {
            "key": "terms",
            "title": "Terms & Conditions",
            "body": "Use of the Otokwikk platform constitutes acceptance of our terms and conditions. Customers must agree to our policies before booking services.",
        },
        {
            "key": "privacy",
            "title": "Privacy Policy",
            "body": "We collect information to improve your experience, process bookings, and maintain secure operations. Personal data is never sold to third parties.",
        },
        {
            "key": "cookie",
            "title": "Cookie Policy",
            "body": "We use cookies to keep you signed in, remember your preferences, and optimize performance across the Otokwikk platform.",
        },
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
    obj, created = LandingContent.objects.get_or_create(
        key="default",
        defaults={"content": DEFAULT_CONTENT},
    )

    # Backfill any missing top-level keys and sub-keys into existing rows
    if not created:
        changed = False
        for key, default_val in DEFAULT_CONTENT.items():
            if key not in obj.content:
                obj.content[key] = default_val
                changed = True
            elif isinstance(default_val, dict):
                for subkey, subval in default_val.items():
                    if subkey not in obj.content[key]:
                        # For imageUrl specifically, pick the first available
                        # media asset instead of leaving it blank
                        if subkey == "imageUrl" and not subval:
                            first_asset = MediaAsset.objects.filter(
                                media_type=MediaAsset.MediaType.IMAGE
                            ).order_by("uploaded_at").first()
                            obj.content[key][subkey] = (
                                f"/media/{first_asset.file.name}"
                                if first_asset else ""
                            )
                        else:
                            obj.content[key][subkey] = subval
                        changed = True
        if changed:
            obj.save()

    return obj, created


# ── Public GET — no auth required ─────────────────────────────────────────────
class LandingContentPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        obj, _ = _get_or_create_row()
        content = obj.content.copy()
        hero = content.get("hero", {})
        images = hero.get("images")

        if not isinstance(images, list) or len(images) == 0:
            images = [
                request.build_absolute_uri(a.file.url)
                for a in MediaAsset.objects.filter(media_type=MediaAsset.MediaType.IMAGE).order_by("-uploaded_at")
            ]
            if images:
                hero = {**hero, "images": images}
                content["hero"] = hero

        return Response(content)


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

        required_keys = {"hero", "services", "branches", "reviews", "fbPages", "posts", "footer"}
        missing = required_keys - set(content.keys())
        if missing:
            return Response(
                {"error": f"Missing required sections: {', '.join(missing)}"},
                status=400,
            )

        # ── Merge with defaults so no fields ever go missing ─────────────────
        merged = {}
        for key in required_keys:
            if isinstance(DEFAULT_CONTENT.get(key), dict):
                merged[key] = {**DEFAULT_CONTENT[key], **content.get(key, {})}
            else:
                merged[key] = content.get(key, DEFAULT_CONTENT.get(key))
        
        def _strip_local_url(url):
            if not isinstance(url, str):
                return url

            base_url = request.build_absolute_uri("/").rstrip("/")
            if url.startswith(base_url):
                return url[len(base_url) :] or "/"

            fallbacks = [
                "http://127.0.0.1:8000",
                "http://localhost:8000",
                "https://127.0.0.1:8000",
                "https://localhost:8000",
            ]
            for prefix in fallbacks:
                if url.startswith(prefix):
                    return url[len(prefix) :] or "/"
            return url

        if "hero" in merged:
            merged["hero"]["imageUrl"] = _strip_local_url(
                merged["hero"].get("imageUrl", "") or ""
            )
            images = []
            for img in merged["hero"].get("images") or []:
                if isinstance(img, str) and img.strip():
                    images.append(_strip_local_url(img.strip()))
            merged["hero"]["images"] = images

        obj, _ = _get_or_create_row()
        obj.content    = merged
        obj.updated_by = request.user
        obj.save()

        return Response({
            "message":    "Landing content saved successfully.",
            "updated_at": obj.updated_at,
            "updated_by": request.user.email,
        })

    def delete(self, request):
        obj, _ = _get_or_create_row()
        obj.content = DEFAULT_CONTENT
        obj.updated_by = request.user
        obj.save()
        return Response({
            "message": "Landing content reset to server defaults.",
            "updated_at": obj.updated_at,
            "updated_by": request.user.email,
            "content": obj.content,
        })


class MediaAssetListView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        assets = MediaAsset.objects.order_by("-uploaded_at")
        return Response([
            {
                "id": a.id,
                "name": a.name,
                "url": request.build_absolute_uri(a.file.url),
                "media_type": a.media_type,
                "uploaded_at": a.uploaded_at,
                "uploaded_by": a.uploaded_by.email if a.uploaded_by else None,
            }
            for a in assets
        ])

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file uploaded."}, status=400)

        name = request.data.get("name") or file_obj.name
        content_type = file_obj.content_type or ""
        if content_type.startswith("image/"):
            media_type = MediaAsset.MediaType.IMAGE
        elif file_obj.name.lower().endswith((".pdf", ".doc", ".docx", ".txt")):
            media_type = MediaAsset.MediaType.DOCUMENT
        else:
            media_type = MediaAsset.MediaType.OTHER

        asset = MediaAsset.objects.create(
            name=name,
            file=file_obj,
            media_type=media_type,
            uploaded_by=request.user,
        )
        return Response({
            "id": asset.id,
            "name": asset.name,
            "url": request.build_absolute_uri(asset.file.url),
            "media_type": asset.media_type,
            "uploaded_at": asset.uploaded_at,
            "uploaded_by": asset.uploaded_by.email if asset.uploaded_by else None,
        }, status=201)


class MediaAssetDetailView(APIView):
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def delete(self, request, pk):
        asset = get_object_or_404(MediaAsset, pk=pk)
        asset.file.delete(save=False)
        asset.delete()
        return Response(status=204)