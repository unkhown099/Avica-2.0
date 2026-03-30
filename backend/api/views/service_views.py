from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import status
from ..models import Service, ServiceCategory, Branch, Staff
from ..serializers.service_serializer import ServiceSerializer
from ..serializers.service_category_serializer import ServiceCategorySerializer


class ServiceCategoryListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "GET":
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def get(self, request):
        qs = ServiceCategory.objects.filter(is_active=True).order_by("name")
        serializer = ServiceCategorySerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ServiceCategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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

    def get_permissions(self):
        if self.request.method == "PATCH":
            return [IsAuthenticated()]
        return [IsAdminUser()]

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

        user = request.user
        is_admin = user.is_staff or user.is_superuser

        # Look up role from Staff profile (role lives on Staff, not User)
        try:
            staff = Staff.objects.get(user=user)
            user_role = staff.role  # e.g. "Branch Manager"
        except Staff.DoesNotExist:
            user_role = None

        is_manager = user_role == "Branch Manager"

        # Managers may only update branch_ids — nothing else
        if is_manager and not is_admin:
            branch_ids = request.data.get("branch_ids")
            if branch_ids is None:
                return Response(
                    {"detail": "Managers may only update branch assignments."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            service.branches.set(Branch.objects.filter(id__in=branch_ids))
            return Response(ServiceSerializer(service).data)

        # Admins can patch anything
        if not is_admin:
            return Response({"detail": "Forbidden."}, status=status.HTTP_403_FORBIDDEN)

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