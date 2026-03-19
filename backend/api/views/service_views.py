from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import status
from ..models import Service
from ..serializers.service_serializer import ServiceSerializer


class ServiceListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get(self, request):
        category = request.query_params.get("category")
        branch   = request.query_params.get("branch")
        search   = request.query_params.get("search")

        qs = Service.objects.prefetch_related("branches").all()

        if category:
            qs = qs.filter(category=category)
        if branch:
            qs = qs.filter(branches__name=branch)
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(description__icontains=search)

        serializer = ServiceSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ServiceDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get_object(self, pk):
        try:
            return Service.objects.prefetch_related("branches").get(pk=pk)
        except Service.DoesNotExist:
            return None

    def get(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(ServiceSerializer(service).data)

    def patch(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = self.get_object(pk)
        if not service:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        service.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)