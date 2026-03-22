from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from ..models import Customer
from ..models import Booking
from ..serializers.customer_serializer import CustomerSerializer


class AdminCustomerListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requester_staff = getattr(request.user, "staff_profile", None)
        customers = Customer.objects.select_related("user").all()

        # Non-admin staff only see customers with bookings in their branch.
        if requester_staff and requester_staff.role != "Admin":
            if requester_staff.branch_id:
                customer_user_ids = Booking.objects.filter(
                    branch_id=requester_staff.branch_id
                ).values_list("user_id", flat=True).distinct()
                customers = customers.filter(user_id__in=customer_user_ids)
            else:
                customers = customers.none()

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
