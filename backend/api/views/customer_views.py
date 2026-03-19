from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from ..models import Customer
from ..serializers.customer_serializer import CustomerSerializer


class AdminCustomerListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        customers = Customer.objects.select_related("user").all()
        serializer = CustomerSerializer(customers, many=True)
        return Response(serializer.data)