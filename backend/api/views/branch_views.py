# api/views/branch_views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from api.models import Branch
from api.serializers.branch_serializer import BranchSerializer


class BranchListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get(self, request):
        branches = Branch.objects.prefetch_related(
            "staff_members",
            "bookings",
            "queue_entries",
            "ratings",
        ).all()
        serializer = BranchSerializer(branches, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BranchSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BranchDetailView(APIView):

    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get_object(self, pk):
        try:
            return Branch.objects.prefetch_related(
                "staff_members", "bookings", "queue_entries", "ratings"
            ).get(pk=pk)
        except Branch.DoesNotExist:
            return None

    def get(self, request, pk):
        branch = self.get_object(pk)
        if not branch:
            return Response({"error": "Branch not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(BranchSerializer(branch).data)

    def put(self, request, pk):
        branch = self.get_object(pk)
        if not branch:
            return Response({"error": "Branch not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = BranchSerializer(branch, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        return self.put(request, pk)

    def delete(self, request, pk):
        branch = self.get_object(pk)
        if not branch:
            return Response({"error": "Branch not found."}, status=status.HTTP_404_NOT_FOUND)
        branch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)