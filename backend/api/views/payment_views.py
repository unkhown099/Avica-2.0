import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings

class CreatePayMongoLinkView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        amount = request.data.get("amount")
        description = request.data.get("description", "Otokwikk Payment")
        
        if not amount:
            return Response({"error": "Amount is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        amount_cents = int(float(amount) * 100) # PayMongo accepts amount in cents
        
        PAYMONGO_SECRET_KEY = getattr(settings, "PAYMONGO_SECRET_KEY", "").strip()
        
        # If in test/mock mode
        if not PAYMONGO_SECRET_KEY or PAYMONGO_SECRET_KEY == "sk_test_placeholder":
            return Response({
                "checkout_url": "mock_qrph",
                "reference_number": "MOCK-12345",
                "message": "PayMongo key not set or in test mode. Using Mock mode."
            }, status=status.HTTP_200_OK)
            
        import base64
        encoded_key = base64.b64encode(f"{PAYMONGO_SECRET_KEY}:".encode()).decode('utf-8')
        headers = {
            "accept": "application/json",
            "content-type": "application/json",
            "authorization": f"Basic {encoded_key}"
        }

        try:
            url = "https://api.paymongo.com/v1/links"
            payload = {
                "data": {
                    "attributes": {
                        "amount": amount_cents,
                        "description": description or "POS Checkout",
                        "remarks": "POS transaction"
                    }
                }
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            res_data = response.json()
            
            if response.status_code == 200:
                checkout_url = res_data.get("data", {}).get("attributes", {}).get("checkout_url")
                ref_num = res_data.get("data", {}).get("attributes", {}).get("reference_number")
                return Response({
                    "checkout_url": checkout_url,
                    "reference_number": ref_num
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "error": res_data.get("errors", [{}])[0].get("detail", "Failed to create payment link"),
                    "details": res_data
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except requests.exceptions.Timeout:
            return Response({"error": "PayMongo API request timed out."}, status=status.HTTP_544_GATEWAY_TIMEOUT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
