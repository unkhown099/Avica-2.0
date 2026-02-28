# api/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import SignupSerializer, StaffSerializer
from .models import Customer
from django.contrib.auth import authenticate, login, logout, get_user_model
from rest_framework.permissions import AllowAny
from django.contrib.auth.hashers import check_password
from .models import User, Staff
import os
import requests
import base64

from google import genai
from google.genai import types
import json
import re

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

class LoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"message": "Signup endpoint. Use POST."})

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()

        if not email or not password:
            return Response({"success": False, "message": "Email and password required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"success": False, "message": "Invalid credentials"}, status=401)

        if not check_password(password, user.password_hash):
            return Response({"success": False, "message": "Invalid credentials"}, status=401)

        login(request, user)

        ROLE_MAP = {
            "Admin": "admin",
            "Business Owner/Manager": "business_owner",
            "Branch Manager": "branch_manager",
            "Staff": "staff",
            "Employee": "employee",
        }

        try:
            staff_profile = user.staff_profile
            user_role = ROLE_MAP.get(staff_profile.role, "staff")
        except Staff.DoesNotExist:
            user_role = "customer"


        return Response({
            "success": True,
            "message": "Login successful",
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user_role
            }
        }, status=200)

class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"success": True, "message": "Logged out"}, status=status.HTTP_200_OK)

class StaffView(APIView):
    permission_classes = [AllowAny]  # change later to admin-only

    def get(self, request):
        staff = Staff.objects.select_related("user").all()

        data = []
        for s in staff:
            data.append({
                "id": s.id,
                "name": f"{s.first_name} {s.last_name}",
                "email": s.user.email,
                "phone": s.phone,
                "role": s.role,
                "branch": s.branch,
                "status": s.status,
                "lastLogin": s.user.last_login,
            })

        return Response(data)

    def post(self, request):
        serializer = StaffSerializer(data=request.data)
        if serializer.is_valid():
            staff = serializer.save()
            return Response({
                "success": True,
                "staff_id": staff.id
            }, status=201)

        return Response(serializer.errors, status=400)

class CarRecognitionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        car_image = request.FILES.get('car_image')
        if not car_image:
            return Response({"success": False, "message": "No image provided"}, status=400)

        api_key = os.getenv("GOOGLE_API_KEY")
        
        # Check if API key is invalid/missing
        if not api_key or api_key == "YOUR_GOOGLE_AI_STUDIO_KEY_HERE":
            # Return demo data but inform the user
            return Response({
                "success": True, 
                "result": {
                    "make": "Toyota",
                    "model": "Fortuner",
                    "year": "2023",
                    "color": "White",
                    "confidence": "98%",
                    "is_demo": True
                },
                "demo_mode": True
            })

        try:
            client = genai.Client(api_key=api_key)
            
            # Read image data
            image_data = car_image.read()
            
            prompt = """
            Identify the car in this image. 
            Return the result ONLY as a JSON object with these keys:
            "make", "model", "year", "color".
            If you are unsure, provide your best guess.
            Example: {"make": "Toyota", "model": "Camry", "year": "2022", "color": "Silver"}
            """

            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_data, mime_type=car_image.content_type)
                ]
            )

            # Extract JSON from response
            text = response.text
            # Basic cleanup in case of markdown blocks
            json_match = re.search(r'\{.*\}', text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                result["confidence"] = "High" # Gemini doesn't always provide score in a simple way
                result["is_demo"] = False
                return Response({"success": True, "result": result})
            
            return Response({"success": False, "message": "Failed to parse AI response"})

        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=500)
