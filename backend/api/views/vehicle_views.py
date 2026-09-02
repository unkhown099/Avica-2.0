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