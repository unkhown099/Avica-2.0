from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate
from ..serializers.auth_serializer import SignupSerializer
from ..models import User, Customer, Staff
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from email.mime.image import MIMEImage
import os


class SignupView(APIView):
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Set inactive until email is verified
            user.is_active = False
            user.save()

            Customer.objects.create(
                user=user,
                first_name=request.data.get("first_name"),
                last_name=request.data.get("last_name"),
                suffix=request.data.get("suffix"),
                phone=request.data.get("phone"),
                loyalty_points=0,
            )

            # Send verification email
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            verify_url = f"http://localhost:5173/verify-email?token={token}&uid={uid}"
            
            subject = "Verify your email - Otokwikk"
            
            # HTML Email Template
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background-color: #07070d; margin: 0; padding: 0; color: #ffffff; }}
                    .container {{ max-width: 600px; margin: 20px auto; background: linear-gradient(135deg, #111827 0%, #07070d 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }}
                    .header {{ background-color: #000000; padding: 40px; text-align: center; }}
                    .logo {{ height: 60px; }}
                    .content {{ padding: 40px; text-align: center; }}
                    h1 {{ color: #ffffff; font-size: 28px; font-weight: 800; margin-bottom: 10px; }}
                    p {{ color: #9ca3af; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }}
                    .button {{ display: inline-block; background-color: #dc2626; color: #ffffff; padding: 16px 36px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 18px; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3); }}
                    .footer {{ background-color: rgba(0,0,0,0.3); padding: 30px; text-align: center; border-t: 1px solid rgba(255,255,255,0.05); }}
                    .footer-text {{ color: #4b5563; font-size: 12px; }}
                    .divider {{ height: 1px; background: linear-gradient(to right, transparent, rgba(220, 38, 38, 0.3), transparent); margin: 30px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <img src="cid:logo" alt="Otokwikk" class="logo">
                    </div>
                    <div class="content">
                        <h1>Welcome to Otokwikk!</h1>
                        <p>Hi {request.data.get('first_name')},<br>Thank you for joining us. Please verify your email address to activate your account and start your journey with Otokwikk.</p>
                        <a href="{verify_url}" class="button">Verify Email Address</a>
                        <div class="divider"></div>
                        <p style="font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br>
                        <span style="color: #6366f1;">{verify_url}</span></p>
                    </div>
                    <div class="footer">
                        <p class="footer-text">© 2026 Otokwikk Services. All rights reserved.<br>This is an automated email, please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            text_content = strip_tags(html_content)
            
            try:
                msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
                msg.attach_alternative(html_content, "text/html")
                
                # Attach logo as CID
                logo_path = os.path.join(settings.BASE_DIR, 'api', 'assets', 'otokwikklogo.png')
                if os.path.exists(logo_path):
                    with open(logo_path, 'rb') as f:
                        img = MIMEImage(f.read())
                        img.add_header('Content-ID', '<logo>')
                        msg.attach(img)
                
                msg.send()
            except Exception as e:
                print(f"Failed to send email: {e}")

            return Response(
                {
                    "success": True,
                    "title": "Account Created!",
                    "message": "Please check your email to verify your account before logging in.",
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {"success": False, "title": "Signup Failed", "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


def _get_profile_data(user):
    """
    Returns (role, first_name, last_name, suffix, phone) for any user.
    Uses explicit Manager queries instead of reverse accessors to avoid
    'User has no attribute customer/staff_profile' errors regardless of
    how the FK/OneToOne related_name is defined on the model.
    """
    ROLE_MAP = {
        "Admin":          "admin",
        "Business Owner": "business_owner",
        "Branch Manager": "branch_manager",
        "Staff":          "staff",
        "Employee":       "employee",
        "Inventory":      "inventory",
    }

    # Check staff first
    try:
        staff = Staff.objects.get(user=user)
        return (
            ROLE_MAP.get(staff.role, "staff"),
            getattr(staff, "first_name", "") or "",
            getattr(staff, "last_name",  "") or "",
            getattr(staff, "suffix",     "") or "",
            getattr(staff, "phone",      "") or "",
            getattr(staff, "profile_picture", "") or "",
        )
    except Staff.DoesNotExist:
        pass

    # Fall back to customer
    try:
        customer = Customer.objects.get(user=user)
        return (
            "customer",
            customer.first_name or "",
            customer.last_name  or "",
            customer.suffix     or "",
            customer.phone      or "",
            customer.profile_picture or "",
        )
    except Customer.DoesNotExist:
        pass

    # No profile found at all
    return "customer", "", "", "", "", ""


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        try:
            email    = request.data.get("email",    "").strip()
            password = request.data.get("password", "").strip()

            print("Login attempt:", email)

            if not email or not password:
                return Response(
                    {"success": False, "message": "Email and password required"},
                    status=400,
                )

            user = authenticate(email=email, password=password)
            print("User authenticated?", user)
 
            if not user:
                return Response(
                    {"success": False, "message": "Invalid credentials"},
                    status=401,
                )
 
            if not user.is_active:
                return Response(
                    {"success": False, "message": "Please verify your email before logging in."},
                    status=401,
                )
 
            user_role, first_name, last_name, suffix, phone, profile_picture = _get_profile_data(user)
 
            # Build JWT with extra claims so the frontend can decode the name
            refresh = RefreshToken.for_user(user)
            refresh["first_name"] = first_name
            refresh["last_name"]  = last_name
            refresh["suffix"]     = suffix
            refresh["email"]      = user.email
            refresh["role"]       = user_role
            refresh["phone"]      = phone
            refresh["profile_picture"] = profile_picture

            access_token = str(refresh.access_token)

            return Response(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": {
                        "id":         user.id,
                        "email":      user.email,
                        "role":       user_role,
                        "first_name": first_name,
                        "last_name":  last_name,
                        "suffix":     suffix,
                        "phone":      phone,
                        "profile_picture": profile_picture,
                    },
                    "tokens": {
                        "access":  access_token,
                        "refresh": str(refresh),
                    },
                },
                status=200,
            )

        except Exception as e:
            print("Login error:", e)
            return Response({"success": False, "message": str(e)}, status=500)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response(
                    {"success": False, "message": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()

            return Response(
                {"success": True, "message": "Logged out successfully"},
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response(
                {"success": False, "message": "Invalid or expired token"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_role, first_name, last_name, suffix, phone, profile_picture = _get_profile_data(user)
 
        return Response({
            "id":         user.id,
            "email":      user.email,
            "role":       user_role,
            "first_name": first_name,
            "last_name":  last_name,
            "suffix":     suffix,
            "phone":      phone,
            "profile_picture": profile_picture,
        })
    
    # Add this PUT method for updating profile
    def put(self, request):
        user = request.user
        user_role, first_name, last_name, suffix, phone, profile_picture = _get_profile_data(user)
        
        # Update the profile (Customer or Staff)
        try:
            if user_role == "customer":
                customer = Customer.objects.get(user=user)
                if 'first_name' in request.data:
                    customer.first_name = request.data['first_name']
                if 'last_name' in request.data:
                    customer.last_name = request.data['last_name']
                if 'phone' in request.data:
                    customer.phone = request.data['phone']
                customer.save()
            else:
                staff = Staff.objects.get(user=user)
                if 'first_name' in request.data:
                    staff.first_name = request.data['first_name']
                if 'last_name' in request.data:
                    staff.last_name = request.data['last_name']
                if 'phone' in request.data:
                    staff.phone = request.data['phone']
                staff.save()
        except (Customer.DoesNotExist, Staff.DoesNotExist):
            pass
        
        # Return updated data
        user_role, first_name, last_name, suffix, phone, profile_picture = _get_profile_data(user)
        
        return Response({
            "id":         user.id,
            "email":      user.email,
            "role":       user_role,
            "first_name": first_name,
            "last_name":  last_name,
            "suffix":     suffix,
            "phone":      phone,
            "profile_picture": profile_picture,
        })

class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"success": False, "message": "Token is required"}, status=400)

        try:
            # Specify the CLIENT_ID of the app that accesses the backend:
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
            
            email = idinfo.get("email")
            first_name = idinfo.get("given_name", "")
            last_name = idinfo.get("family_name", "")
            picture = idinfo.get("picture", "")

            user, created = User.objects.get_or_create(email=email)
            if created:
                # Random password since they login via Google
                user.set_unusable_password()
                user.is_active = True  # Google accounts are pre-verified
                user.email_verified = True
                user.save()
                
                # Create customer profile if new user
                Customer.objects.create(
                    user=user,
                    first_name=first_name,
                    last_name=last_name,
                    profile_picture=picture,
                    loyalty_points=0
                )
            else:
                # Update picture if it changed
                try:
                    profile = Customer.objects.get(user=user)
                    profile.profile_picture = picture
                    profile.save()
                except Customer.DoesNotExist:
                    pass

            user_role, profile_first_name, profile_last_name, suffix, phone, profile_picture = _get_profile_data(user)

            refresh = RefreshToken.for_user(user)
            refresh["first_name"] = profile_first_name
            refresh["last_name"]  = profile_last_name
            refresh["suffix"]     = suffix
            refresh["email"]      = user.email
            refresh["role"]       = user_role
            refresh["phone"]      = phone
            refresh["profile_picture"] = profile_picture

            return Response({
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "role": user_role,
                    "first_name": profile_first_name,
                    "last_name": profile_last_name,
                    "suffix": suffix,
                    "phone": phone,
                    "profile_picture": profile_picture,
                },
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }
            })

        except Exception as e:
            return Response({"success": False, "message": str(e)}, status=500)


class VerifyEmailView(APIView):
    permission_classes = []

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")

        if not uidb64 or not token:
            return Response({"success": False, "message": "Missing UID or token"}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"success": False, "message": "Invalid user ID"}, status=400)

        if default_token_generator.check_token(user, token):
            user.is_active = True
            user.email_verified = True
            user.save()
            return Response({"success": True, "message": "Email verified successfully!"}, status=200)
        else:
            return Response({"success": False, "message": "Invalid or expired token"}, status=400)


class ForgotPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"success": False, "message": "Email is required"}, status=400)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # We return success even if user doesn't exist for security (avoid email enumeration)
            return Response({
                "success": True, 
                "message": "If an account exists with this email, a reset link has been sent."
            }, status=200)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"http://localhost:5173/reset-password?token={token}&uid={uid}"
        
        subject = "Reset your password - Otokwikk"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Inter', sans-serif; background-color: #07070d; color: #ffffff; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 40px auto; background: #111827; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }}
                .header {{ background: #000000; padding: 30px; text-align: center; }}
                .content {{ padding: 40px; text-align: center; }}
                h1 {{ font-size: 24px; font-weight: 800; margin-bottom: 20px; }}
                p {{ color: #9ca3af; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }}
                .button {{ display: inline-block; background: #dc2626; color: #ffffff; padding: 14px 30px; border-radius: 12px; font-weight: 700; text-decoration: none; }}
                .footer {{ background: rgba(0,0,0,0.2); padding: 20px; text-align: center; color: #4b5563; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <img src="https://i.ibb.co/vzR0F7Z/otokwikklogo.png" alt="Otokwikk" style="height: 50px;">
                </div>
                <div class="content">
                    <h1>Password Reset Request</h1>
                    <p>We received a request to reset your password. Click the button below to choose a new one. This link will expire in 24 hours.</p>
                    <a href="{reset_url}" class="button">Reset Password</a>
                    <p style="margin-top: 30px; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    © 2026 Otokwikk Services. Professional Auto Detailing.
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = strip_tags(html_content)
        
        try:
            msg = EmailMultiAlternatives(subject, text_content, settings.DEFAULT_FROM_EMAIL, [user.email])
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            return Response({
                "success": True, 
                "message": "If an account exists with this email, a reset link has been sent."
            }, status=200)
        except Exception as e:
            return Response({"success": False, "message": f"Failed to send email: {str(e)}"}, status=500)


class ResetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("password")

        if not uidb64 or not token or not new_password:
            return Response({"success": False, "message": "All fields are required"}, status=400)

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"success": False, "message": "Invalid reset link"}, status=400)

        if default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response({"success": True, "message": "Password updated successfully!"}, status=200)
        else:
            return Response({"success": False, "message": "Invalid or expired token"}, status=400)
