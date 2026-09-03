from django.shortcuts import get_object_or_404
from django.db.models import Count, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from api.models import LandingContent, MediaAsset, Customer, QueueEntry, Rating
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
        "bgMode": "slideshow",
        "imageUrl": "",
        "images": [],
        "videoUrl": "",
    },
    "services": {
        "sectionTitle": "FEATURED",
        "sectionTitleAccent": "REELS & HIGHLIGHTS",
        "sectionSubtitle": "Watch our latest car detailing transformations, ceramic coats, and viral Facebook reels.",
        "items": [
            {
                "url": "https://www.facebook.com/reel/100090897126761",
            },
            {
                "url": "https://www.facebook.com/reel/61572528405228",
            },
            {
                "url": "https://www.facebook.com/reel/61586571534281",
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
            "body": (
                "Welcome to Otokwikk Auto Care and Detailing Services. By creating an account, booking appointments, or utilizing our services across any of our branches, you agree to comply with and be bound by the following Terms and Conditions:\n\n"
                "1. ACCEPTANCE OF TERMS: By accessing the Otokwikk platform and using our online appointment scheduling, vehicle recognition, and point-of-sale systems, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.\n\n"
                "2. SERVICE BOOKINGS & APPOINTMENTS: All bookings made through our platform are subject to slot availability and branch confirmation. Customers are encouraged to arrive 10-15 minutes prior to their reserved schedule. Delays exceeding 20 minutes without prior notice may result in queue rescheduling.\n\n"
                "3. RESCHEDULING & CANCELLATIONS: Customers may reschedule or cancel their appointments via the Customer Dashboard at least 2 hours before the scheduled time. In cases where emergency rescheduling is initiated by the branch due to unforeseen maintenance or inclement weather, alternative slots will be provided for customer confirmation.\n\n"
                "4. VEHICLE CARE & VALUABLES: While our trained technicians exercise the utmost care in handling your vehicle, customers are strongly advised to remove all personal valuables, cash, and sensitive belongings prior to turning over the vehicle for service. Otokwikk is not liable for loss or damage to unremoved personal items.\n\n"
                "5. PRICING & PAYMENT: Service rates are calculated based on vehicle classification (Sedan, SUV, Van/Pickup, etc.) and selected packages. Payments can be settled via Cash, GCash, Bank Transfer, or Maya upon completion of service at the branch.\n\n"
                "6. QUALITY WARRANTY & SATISFACTION: We stand behind the quality of our auto care and detailing craftsmanship. Any concerns regarding service execution must be brought to the branch manager's attention before vehicle pull-out for immediate inspection and remediation."
            ),
        },
        {
            "key": "privacy",
            "title": "Privacy Policy",
            "body": (
                "Otokwikk is committed to protecting the privacy and confidentiality of your personal information in accordance with Republic Act No. 10173 (Data Privacy Act of 2012):\n\n"
                "1. DATA COLLECTION: We collect personal information including your full name, contact number, email address, vehicle details (make, model, plate number), and service transaction history solely for account management, service fulfillment, and appointment reminders.\n\n"
                "2. USE OF INFORMATION: Your data is utilized to facilitate accurate service bookings, vehicle preventive maintenance schedules, warranty tracking, and customer support communications.\n\n"
                "3. DATA PROTECTION: All customer credentials, vehicle photos, and service records are protected with industry-standard encryption, strict access controls, and secure session management. We never sell, rent, or lease your personal information to third-party marketers.\n\n"
                "4. YOUR RIGHTS: You have the right to access, update, or request the deletion of your personal account data at any time through your Profile Settings or by contacting our Data Protection Officer."
            ),
        },
        {
            "key": "cookie",
            "title": "Cookie Policy",
            "body": (
                "The Otokwikk web application uses essential cookies and local storage tokens to deliver a seamless, secure user experience:\n\n"
                "1. ESSENTIAL COOKIES: Required for user authentication, maintaining secure login sessions, and theme preferences (Dark Mode / Light Mode).\n\n"
                "2. FUNCTIONAL STORAGE: Used to remember your selected branch, active queue entries, and offline form drafts to prevent data loss.\n\n"
                "3. CONTROL: You can configure your browser to reject non-essential cookies; however, authentication tokens are required to access member dashboards."
            ),
        },
    ],
    "footer": {
        "tagline": "Empowering car owners with precision care and premium detailing that protects every drive.",
        "copyright": "Copyright © 2026, otokwikk. All Rights Reserved.",
        "siteMapLinks": [
            {"label": "Homepage",      "href": "#hero"},
            {"label": "Services",      "href": "#services"},
            {"label": "Branches",      "href": "#branches"},
            {"label": "Client Reviews","href": "#reviews"},
            {"label": "Facebook Pages","href": "#facebook-pages"},
            {"label": "Sign In",       "href": "/signin"},
            {"label": "Sign Up",       "href": "/signup"},
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

    # ── One-time patch: fix stale siteMapLinks that still use bare "#" hrefs ──
    ANCHOR_MAP = {
        "Homepage":      "#hero",
        "Services":      "#services",
        "Branches":      "#branches",
        "Client Reviews":"#reviews",
        "Facebook Pages":"#facebook-pages",
    }
    footer = obj.content.get("footer", {})
    site_map = footer.get("siteMapLinks", [])
    patched = False
    for link in site_map:
        label = link.get("label", "")
        if label in ANCHOR_MAP and link.get("href", "#") == "#":
            link["href"] = ANCHOR_MAP[label]
            patched = True
    if patched:
        obj.content["footer"]["siteMapLinks"] = site_map
        obj.save()

    return obj, created


# ── Public GET — no auth required ─────────────────────────────────────────────
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

        if "hero" in content:
            # Resolve relative media URLs to absolute URLs
            if content["hero"].get("videoUrl") and str(content["hero"]["videoUrl"]).startswith("/media/"):
                content["hero"]["videoUrl"] = request.build_absolute_uri(content["hero"]["videoUrl"])
            if content["hero"].get("imageUrl") and str(content["hero"]["imageUrl"]).startswith("/media/"):
                content["hero"]["imageUrl"] = request.build_absolute_uri(content["hero"]["imageUrl"])

        if "services" in content and isinstance(content["services"], dict):
            items = content["services"].get("items", [])
            for item in items:
                if isinstance(item, dict):
                    img = item.get("image") or item.get("imageUrl")
                    if img and str(img).startswith("/media/"):
                        item["image"] = request.build_absolute_uri(img)
                        item["imageUrl"] = request.build_absolute_uri(img)

        return Response(content)


class PublicSignInStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        customers_registered = Customer.objects.count()

        booking_rating_totals = Rating.objects.aggregate(
            total_score=Sum("score"),
            total_count=Count("id"),
        )
        walkin_rating_totals = QueueEntry.objects.filter(
            booking__isnull=True,
            rating_score__isnull=False,
        ).aggregate(
            total_score=Sum("rating_score"),
            total_count=Count("id"),
        )

        combined_score = (booking_rating_totals["total_score"] or 0) + (walkin_rating_totals["total_score"] or 0)
        combined_count = (booking_rating_totals["total_count"] or 0) + (walkin_rating_totals["total_count"] or 0)
        average_rating = round(combined_score / combined_count, 1) if combined_count else 0.0

        return Response({
            "customers_registered": customers_registered,
            "served_customers": customers_registered,
            "average_rating": average_rating,
        })


# ── Super-admin GET + PUT / POST ──────────────────────────────────────────────
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
        return self._save(request)

    def post(self, request):
        return self._save(request)

    def _save(self, request):
        content = request.data.get("content")
        if not isinstance(content, dict):
            # Fallback if raw JSON content was posted directly
            content = request.data if isinstance(request.data, dict) else {}

        obj, _ = _get_or_create_row()
        existing_content = obj.content if isinstance(obj.content, dict) else DEFAULT_CONTENT

        # ── Merge with existing / defaults so no fields ever go missing ─────────────────
        merged = {}
        for key in {"hero", "services", "branches", "reviews", "fbPages", "posts", "footer"}:
            def_val = existing_content.get(key, DEFAULT_CONTENT.get(key))
            incoming_val = content.get(key)
            if incoming_val is not None:
                if isinstance(def_val, dict) and isinstance(incoming_val, dict):
                    merged[key] = {**def_val, **incoming_val}
                else:
                    merged[key] = incoming_val
            else:
                merged[key] = def_val
        
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
                "http://localhost:5173",
            ]
            for prefix in fallbacks:
                if url.startswith(prefix):
                    return url[len(prefix) :] or "/"
            return url

        if "hero" in merged:
            merged["hero"]["bgMode"] = merged["hero"].get("bgMode", "slideshow") or "slideshow"
            merged["hero"]["imageUrl"] = _strip_local_url(
                merged["hero"].get("imageUrl", "") or ""
            )
            merged["hero"]["videoUrl"] = _strip_local_url(
                merged["hero"].get("videoUrl", "") or ""
            )
            images = []
            for img in merged["hero"].get("images") or []:
                if isinstance(img, str) and img.strip():
                    images.append(_strip_local_url(img.strip()))
            merged["hero"]["images"] = images

        obj.content    = merged
        obj.updated_by = request.user
        obj.save()

        return Response({
            "message":    "Landing content saved successfully.",
            "updated_at": obj.updated_at,
            "updated_by": request.user.email,
            "content":    obj.content,
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
        lower_name = file_obj.name.lower()
        if content_type.startswith("image/"):
            media_type = MediaAsset.MediaType.IMAGE
        elif content_type.startswith("video/") or lower_name.endswith((".mp4", ".webm", ".mov", ".ogg", ".mkv", ".avi")):
            media_type = MediaAsset.MediaType.VIDEO
        elif lower_name.endswith((".pdf", ".doc", ".docx", ".txt")):
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
