from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from ..models import InventoryItem
from ..serializers.inventory_serializer import InventoryItemSerializer


class InventoryListCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        category = request.query_params.get("category")
        branch   = request.query_params.get("branch")
        search   = request.query_params.get("search")
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

        # Filter by status after serialization (status is a @property)
        if inv_status and inv_status != "All Status":
            data = [i for i in data if i["status"] == inv_status]

        return Response(data)

    def post(self, request):
        serializer = InventoryItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class InventoryDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return InventoryItem.objects.select_related("branch").get(pk=pk)
        except InventoryItem.DoesNotExist:
            return None

    def patch(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = InventoryItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = self.get_object(pk)
        if not item:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)