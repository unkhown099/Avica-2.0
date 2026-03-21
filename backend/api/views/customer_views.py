from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
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
