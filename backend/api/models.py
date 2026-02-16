# api/models.py
from django.db import models
from django.contrib.auth.hashers import make_password
from django.utils import timezone

class User(models.Model):
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="customer_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)

class Staff(models.Model):
    ROLE_CHOICES = [
        ("Admin", "Admin"),
        ("Business Owner", "Business Owner"),
        ("Branch Manager", "Branch Manager"),
        ("Staff", "Staff (Cashier)"),
        ("Employee", "Employee (Mechanic)"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    branch = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="Active")
