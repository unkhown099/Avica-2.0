import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..services.ai_vehicle_service import analyze_vehicle_image


class AnalyzeVehicleView(APIView):
    """
    Class-based API endpoint for analyzing vehicle images.
    Expects POST request with JSON body:
    {
        "image": "<base64 string>"
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        base64_image = request.data.get("image")
        if not base64_image:
            return Response({"error": "No image provided"}, status=400)

        result = analyze_vehicle_image(base64_image)
        return Response(result)