from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from ..models import Customer
from ..serializers.customer_serializer import CustomerSerializer


class AdminCustomerListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        customers = Customer.objects.select_related("user").all()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)


# Add this new view for the current user's profile
class CurrentCustomerProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            customer = Customer.objects.get(user=request.user)
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Customer.DoesNotExist:
            return Response({
                "address": "",
                "car_make": "",
                "car_model": "",
                "car_year": "",
                "car_color": "",
                "car_plate": "",
            })

    def put(self, request):
        try:
            customer, created = Customer.objects.get_or_create(user=request.user)
            
            # Update fields
            customer.address = request.data.get("address", customer.address)
            customer.car_make = request.data.get("car_make", customer.car_make)
            customer.car_model = request.data.get("car_model", customer.car_model)
            customer.car_year = request.data.get("car_year", customer.car_year)
            customer.car_color = request.data.get("car_color", customer.car_color)
            customer.car_plate = request.data.get("car_plate", customer.car_plate)
            customer.save()
            
            serializer = CustomerSerializer(customer)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=400
            )