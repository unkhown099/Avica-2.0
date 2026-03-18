# api/models.py
from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
)
from django.utils import timezone
from django.conf import settings


# ── User Manager ──────────────────────────────────────────────────────────────
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


# ── User ──────────────────────────────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):
    email          = models.EmailField(unique=True)
    is_active      = models.BooleanField(default=True)
    is_staff       = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    last_login     = models.DateTimeField(null=True, blank=True)
    created_at     = models.DateTimeField(default=timezone.now)
    updated_at     = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set",
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_permissions_set",
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    USERNAME_FIELD  = "email"
    REQUIRED_FIELDS = []
    objects         = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email


# ── Customer ──────────────────────────────────────────────────────────────────
class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="customer_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=20, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "customers"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


# ── Branch ────────────────────────────────────────────────────────────────────
class Branch(models.Model):
    name      = models.CharField(max_length=100)
    address   = models.CharField(max_length=200)
    hours     = models.CharField(max_length=100)
    slots     = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "branches"


# ── Staff ─────────────────────────────────────────────────────────────────────
class Staff(models.Model):
    ROLE_CHOICES = [
        ("Admin",          "Admin"),
        ("Business Owner", "Business Owner"),
        ("Branch Manager", "Branch Manager"),
        ("Staff",          "Staff (Cashier)"),
        ("Employee",       "Employee (Mechanic)"),
        ("Inventory",      "Inventory"),
    ]

    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    suffix = models.CharField(max_length=20, blank=True, null=True)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    branch = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="Active")
    profile_picture = models.URLField(max_length=500, blank=True, null=True)
    birthdate = models.DateField(blank=True, null=True)

    class Meta:
        db_table = "queue_entries"
        ordering = ["position", "queued_at"]

    def __str__(self):
        emp = self.assigned_employee.first_name if self.assigned_employee else "Unassigned"
        return f"#{self.position} {self.customer_name} — {self.service} [{self.status}] → {emp}"

    def save(self, *args, **kwargs):
        if not self.pk and self.position == 0:
            last = QueueEntry.objects.filter(
                status__in=["waiting", "in_service"]
            ).order_by("-position").first()
            self.position = (last.position + 1) if last else 1
        super().save(*args, **kwargs)