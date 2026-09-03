import base64
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import SessionAuthentication
from ..services.ai_vehicle_service import analyze_vehicle_image


class AnalyzeVehicleView(APIView):
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        base64_image = request.data.get("image")

        # Also support multipart file upload
        if not base64_image and "image" in request.FILES:
            uploaded_file = request.FILES["image"]
            try:
                base64_image = base64.b64encode(uploaded_file.read()).decode("utf-8")
            except Exception as e:
                return Response({"error": f"Failed to read image file: {str(e)}"}, status=400)

        if not base64_image:
            return Response({"error": "No image provided"}, status=400)

        try:
            result = analyze_vehicle_image(base64_image)
            return Response(result)
        except Exception as e:
            return Response({"error": f"Vehicle analysis failed: {str(e)}"}, status=500)


from ..models import VehiclePMSLog, Customer


class PreventiveMaintenanceView(APIView):
    """
    Calculates Preventive Maintenance Schedule (PMS) milestones,
    health rating, required inspection points, and recommended Otokwikk products.
    Saves and returns customer odometer check history.
    """
    authentication_classes = [JWTAuthentication, SessionAuthentication]
    permission_classes = [IsAuthenticated]

    MILESTONES = [
        {
            "km": 5000,
            "months": 3,
            "title": "5,000 KM Minor PMS Checkup",
            "level": "Minor",
            "checks": [
                "Engine Oil & Oil Filter Replacement",
                "25-Point Safety Inspection",
                "Tire Pressure & Tread Depth Inspection",
                "Brake Pad Visual Check & Fluid Level",
                "Battery Voltage & Terminal Cleaning",
                "Windshield Washer & Wiper Check",
            ],
            "recommended_products": [
                "Otokwikk Semi-Synthetic 10W-40 Engine Oil",
                "Otokwikk Premium Spin-On Oil Filter",
                "Otokwikk Ultra Foam Car Shampoo",
            ],
        },
        {
            "km": 10000,
            "months": 6,
            "title": "10,000 KM Standard PMS Service",
            "level": "Standard",
            "checks": [
                "Full Synthetic Engine Oil & Filter Change",
                "Engine Air Filter Inspection & Cleaning",
                "Front & Rear Brake Caliper Cleaning & Measurement",
                "Tire Rotation & Wheel Balancing",
                "Coolant & Brake Fluid Top-up",
                "Underchassis Torque Check",
            ],
            "recommended_products": [
                "Otokwikk Fully Synthetic Engine Oil 5W-40",
                "Otokwikk High-Efficiency Air Filter Element",
                "Otokwikk Hydrophobic Ceramic Spray Wax",
            ],
        },
        {
            "km": 20000,
            "months": 12,
            "title": "20,000 KM Intermediate PMS Service",
            "level": "Intermediate",
            "checks": [
                "Complete Synthetic Oil Service",
                "AC Cabin Filter Replacement",
                "Spark Plug Inspection & Gap Check",
                "Brake Cleaning & Fluid Moisture Test",
                "Four-Wheel Alignment & Suspension Check",
                "Battery Health Diagnostic Load Test",
            ],
            "recommended_products": [
                "Otokwikk Fully Synthetic Engine Oil 5W-40",
                "Otokwikk Heavy-Duty Brake Fluid DOT 4",
                "Otokwikk Odor Eliminator & AC Air Freshener",
            ],
        },
        {
            "km": 40000,
            "months": 24,
            "title": "40,000 KM Major PMS Overhaul",
            "level": "Major",
            "checks": [
                "Full Fluid Flush (Brake Fluid & Radiator Coolant)",
                "Throttle Body & Fuel System Decarbonization",
                "Drive Belts & Tensioner Inspection",
                "Transmission / Gear Fluid Replacement",
                "Brake Pad & Rotor Thickness Check",
                "Complete Engine Bay Detailing & Underwash",
            ],
            "recommended_products": [
                "Otokwikk Long Life Radiator Coolant 50/50 Pre-Mix",
                "Otokwikk Ceramic Brake Pads Pro",
                "Otokwikk Deep Clean Engine Degreaser",
            ],
        },
        {
            "km": 60000,
            "months": 36,
            "title": "60,000 KM High-Mileage PMS Protection",
            "level": "Comprehensive",
            "checks": [
                "Spark Plug Replacement (Iridium Set)",
                "Fuel Filter / Pump Pressure Inspection",
                "Shock Absorber, Bushings & Ball Joint Testing",
                "Full AC System Clean & Evaporator Sanitization",
                "Complete Paint Correction & Ceramic Boost",
            ],
            "recommended_products": [
                "Otokwikk Iridium Power Spark Plug (Set of 4)",
                "Otokwikk Hydrophobic Ceramic Spray Wax",
                "Otokwikk Leather & Vinyl Interior Dressing",
            ],
        },
        {
            "km": 80000,
            "months": 48,
            "title": "80,000 KM Milestone PMS Service",
            "level": "Major Milestone",
            "checks": [
                "Complete Engine, Transmission, Differential Fluid Flush",
                "Timing Belt / Timing Chain Condition Check",
                "Water Pump & Thermostat Inspection",
                "Alternator & Starter Motor Diagnostic",
                "Complete Interior Deep Clean & Exterior Detailing",
            ],
            "recommended_products": [
                "Otokwikk Maintenance-Free 12V Battery (55Ah)",
                "Otokwikk Fully Synthetic Engine Oil 5W-40",
                "Otokwikk Tire Black & Gloss Conditioning Gel",
            ],
        },
    ]

    def _calc_pms(self, mileage, vehicle_name, vehicle_size):
        # Find next upcoming milestone
        next_milestone = None
        for m in self.MILESTONES:
            if m["km"] > mileage:
                next_milestone = m
                break

        if not next_milestone:
            cycle_km = int(mileage // 10000 + 1) * 10000
            next_milestone = {
                "km": cycle_km,
                "months": 6,
                "title": f"{cycle_km:,} KM Periodic Maintenance Inspection",
                "level": "Advanced Maintenance",
                "checks": [
                    "Engine Oil & Filter Service",
                    "Full Undercarriage & Suspension Inspection",
                    "Brake Pad & Rotor Health Check",
                    "Cooling System & Battery Testing",
                ],
                "recommended_products": [
                    "Otokwikk Fully Synthetic Engine Oil 5W-40",
                    "Otokwikk Premium Spin-On Oil Filter",
                ],
            }

        km_remaining = max(0, int(next_milestone["km"] - mileage))

        # Calculate Health Score and status
        if mileage <= 0:
            health_score = 100
            status_label = "Optimal"
            status_color = "emerald"
        elif km_remaining <= 500:
            health_score = 65
            status_label = "Due Soon"
            status_color = "amber"
        elif km_remaining == 0:
            health_score = 45
            status_label = "Overdue"
            status_color = "red"
        else:
            health_score = max(75, min(98, int(100 - (mileage % 10000) / 10000 * 25)))
            status_label = "Good Condition"
            status_color = "emerald"

        return {
            "vehicle": vehicle_name,
            "vehicle_size": vehicle_size,
            "current_mileage": mileage,
            "next_milestone_km": next_milestone["km"],
            "km_remaining": km_remaining,
            "health_score": health_score,
            "status": status_label,
            "status_color": status_color,
            "current_milestone": next_milestone,
            "all_milestones": self.MILESTONES,
            "recommended_service_name": next_milestone.get("title", "5,000 KM Minor PMS Checkup"),
        }

    def _get_history(self, user):
        logs = VehiclePMSLog.objects.filter(user=user).order_by("-created_at")[:20]
        history = []
        for l in logs:
            history.append({
                "id": l.id,
                "mileage": l.mileage,
                "vehicle_name": l.vehicle_name,
                "vehicle_size": l.vehicle_size,
                "plate_number": l.plate_number or "",
                "health_score": l.health_score,
                "status_label": l.status_label,
                "target_milestone_km": l.target_milestone_km,
                "target_milestone_title": l.target_milestone_title,
                "km_remaining": l.km_remaining,
                "created_at": l.created_at.strftime("%b %d, %Y • %I:%M %p"),
                "iso_date": l.created_at.isoformat(),
            })
        return history

    def get(self, request):
        latest_log = VehiclePMSLog.objects.filter(user=request.user).order_by("-created_at").first()
        if latest_log:
            mileage = latest_log.mileage
            vehicle_name = latest_log.vehicle_name
            vehicle_size = latest_log.vehicle_size
        else:
            mileage = 0.0
            vehicle_name = "Your Vehicle"
            vehicle_size = "small"

        res = self._calc_pms(mileage, vehicle_name, vehicle_size)
        res["history"] = self._get_history(request.user)
        res["has_saved_reading"] = latest_log is not None
        if latest_log:
            res["last_checked_at"] = latest_log.created_at.strftime("%b %d, %Y • %I:%M %p")
        return Response(res)

    def post(self, request):
        data = request.data
        try:
            mileage = float(data.get("mileage", 0))
        except (ValueError, TypeError):
            mileage = 0.0

        vehicle_name = str(data.get("vehicle", "")).strip() or "Your Vehicle"
        vehicle_size = str(data.get("vehicle_size", "small")).strip()
        plate_number = str(data.get("plate_number", "")).strip()

        res = self._calc_pms(mileage, vehicle_name, vehicle_size)

        # Save PMS check log to database
        customer_profile = getattr(request.user, "customer_profile", None)
        log_entry = VehiclePMSLog.objects.create(
            user=request.user,
            customer=customer_profile,
            mileage=mileage,
            vehicle_name=vehicle_name,
            vehicle_size=vehicle_size,
            plate_number=plate_number,
            health_score=res["health_score"],
            status_label=res["status"],
            target_milestone_km=res["next_milestone_km"],
            target_milestone_title=res["current_milestone"]["title"],
            km_remaining=res["km_remaining"],
        )

        res["history"] = self._get_history(request.user)
        res["has_saved_reading"] = True
        res["last_checked_at"] = log_entry.created_at.strftime("%b %d, %Y • %I:%M %p")
        return Response(res)

