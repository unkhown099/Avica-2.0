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
import requests
from django.conf import settings
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

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

@csrf_exempt
def analyze_vehicle(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except Exception as e:
            print("JSON PARSE ERROR:", e)
            return JsonResponse({"error": "Invalid JSON body"}, status=400)

        base64_image = data.get("image")
        if not base64_image:
            return JsonResponse({"error": "No image provided"}, status=400)

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "qwen/qwen3.5-27b",
                "max_tokens": 256,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """
                                Analyze the vehicle and return JSON ONLY in this exact format:

                                {
                                  "make": "Toyota",
                                  "model": "Corolla",
                                  "year": "2015",
                                  "color": "Red",
                                  "bodyType": "Sedan",
                                  "condition": "Good",
                                  "confidence": "high",
                                  "features": ["sunroof", "alloy wheels"],
                                  "additionalNotes": "..."
                                }

                                If you cannot determine a field, set it to null.
                                Do not return anything except JSON.
                                """
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ]
            }
        )

        ai_response = response.json()

        print("=== OPENROUTER RAW RESPONSE ===")
        print(ai_response)

        try:
            content = ai_response["choices"][0]["message"]["content"]
            print("=== AI CONTENT (raw) ===")
            print(content)

            # Strip markdown code fences if present
            content = content.strip()

            if content.startswith("```"):
                content = content.strip("```")
                content = content.replace("json", "").strip()

            print("=== AI CONTENT (cleaned) ===")
            print(content)

            analysis_json = json.loads(content)
            print("=== PARSED JSON ===")
            print(analysis_json)

        except Exception as e:
            print("ERROR PARSING AI RESPONSE:", e)
            return JsonResponse({
                "error": "AI response not valid JSON",
                "raw": ai_response
            })

        return JsonResponse(analysis_json)
