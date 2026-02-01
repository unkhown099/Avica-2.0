# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import SignupSerializer
from .models import Customer

class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Create corresponding customer record
            Customer.objects.create(
                user=user,
                first_name=request.data.get('first_name'),
                last_name=request.data.get('last_name'),
                phone=request.data.get('phone'),
                loyalty_points=0
            )

            return Response({
                "success": True,
                "title": "Account Created!",
                "message": "Welcome! Your customer account has been successfully created."
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            "success": False,
            "title": "Signup Failed",
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
