# api/views/inventory_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated  # ← changed
from rest_framework import status
from ..models import InventoryItem
from ..serializers.inventory_serializer import InventoryItemSerializer

# Roles that can READ inventory (for POS)
READ_ROLES  = ["Admin", "Business Owner", "Branch Manager", "Staff", "Inventory"]
# Roles that can WRITE inventory
WRITE_ROLES = ["Admin", "Business Owner", "Branch Manager", "Inventory"]

def get_staff_role(request):
    try:
        return request.user.staff_profile.role
    except Exception:
        return None


class InventoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]  # ← was IsAdminUser

    def get(self, request):
        role = get_staff_role(request)
        if role not in READ_ROLES:
            return Response({"detail": "Permission denied."}, status=403)

        category   = request.query_params.get("category")
        branch     = request.query_params.get("branch")
        search     = request.query_params.get("search")
        inv_status = request.query_params.get("status")

        qs = InventoryItem.objects.select_related("branch").all()
        if category:
            qs = qs.filter(category=category)
        if branch:
            qs = qs.filter(branch__name=branch)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(sku__icontains=search)

        serializer = InventoryItemSerializer(qs, many=True)
        data = serializer.data
        if inv_status and inv_status != "All Status":
            data = [i for i in data if i["status"] == inv_status]
        return Response(data)

    def post(self, request):
        role = get_staff_role(request)
        if role not in WRITE_ROLES:
            return Response({"detail": "Permission denied."}, status=403)
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InventoryDetailView(APIView):
    permission_classes = [IsAuthenticated]  # ← was IsAdminUser

    def get_object(self, pk):
        try:
            return InventoryItem.objects.select_related("branch").get(pk=pk)
        except InventoryItem.DoesNotExist:
            return None

    def patch(self, request, pk):
        role = get_staff_role(request)
        if role not in WRITE_ROLES:
            return Response({"detail": "Permission denied."}, status=403)
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Not found."}, status=404)
        serializer = InventoryItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        role = get_staff_role(request)
        if role not in WRITE_ROLES:
            return Response({"detail": "Permission denied."}, status=403)
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Not found."}, status=404)
        item.delete()
        return Response(status=204)