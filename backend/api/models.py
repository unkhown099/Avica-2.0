# api/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission
from django.utils import timezone
from django.conf import settings

# Custom user manager
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # hashes password correctly
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # required for admin access
    email_verified = models.BooleanField(default=False)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    # Override ManyToMany fields to avoid clashes with auth.User
    groups = models.ManyToManyField(
        Group,
        related_name="custom_user_set",  # changed to avoid clash
        blank=True,
        help_text="The groups this user belongs to.",
        verbose_name="groups",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name="custom_user_permissions_set",  # changed to avoid clash
        blank=True,
        help_text="Specific permissions for this user.",
        verbose_name="user permissions",
    )

    # login field
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="customer_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)

    class Meta:
        db_table = "customers"


class Staff(models.Model):
    ROLE_CHOICES = [
        ("Admin", "Admin"),
        ("Business Owner", "Business Owner"),
        ("Branch Manager", "Branch Manager"),
        ("Staff", "Staff (Cashier)"),
        ("Employee", "Employee (Mechanic)"),
        ("Inventory", "Inventory"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="staff_profile")
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    branch = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default="Active")

    class Meta:
        db_table = "staffs"

class Branch(models.Model):
    name    = models.CharField(max_length=100)
    address = models.CharField(max_length=200)
    hours   = models.CharField(max_length=100)
    slots   = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)
 
    def __str__(self):
        return self.name
    class Meta:
        db_table = "branches"

class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ]
 
    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    service      = models.CharField(max_length=100)
    price        = models.CharField(max_length=20)        # e.g. "₱2,500"
    branch       = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, related_name="bookings")
    date         = models.DateField()
    time         = models.CharField(max_length=20)        # e.g. "10:00 AM"
    vehicle      = models.CharField(max_length=100, blank=True, default="")
    plate_number = models.CharField(max_length=20,  blank=True, default="")
    notes        = models.TextField(blank=True, default="")
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    staff        = models.CharField(max_length=100, blank=True, default="TBA")
    created_at   = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ["-created_at"]
 
    def __str__(self):
        return f"{self.user} — {self.service} @ {self.branch} on {self.date}"
    class Meta:
        db_table = "bookings"

class QueueEntry(models.Model):
    STATUS_CHOICES = [
        ("waiting",    "Waiting"),
        ("in_service", "In Service"),
        ("done",       "Done"),
        ("skipped",    "Skipped"),
    ]
 
    SOURCE_CHOICES = [
        ("booking",  "Booking"),
        ("walk_in",  "Walk-in"),
    ]
 
    # Linked booking — null for walk-ins
    booking = models.OneToOneField(
        "Booking",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="queue_entry",
    )
 
    # Assigned mechanic/employee — null until assigned
    assigned_employee = models.ForeignKey(
        "Staff",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="queue_assignments",
        limit_choices_to={"role": "Employee"},  # only Employees (Mechanics)
    )
 
    # Denormalised fields — populated from booking or entered manually
    customer_name = models.CharField(max_length=200)
    phone         = models.CharField(max_length=50,  blank=True, default="")
    vehicle       = models.CharField(max_length=200, blank=True, default="")
    plate_number  = models.CharField(max_length=50,  blank=True, default="")
    service       = models.CharField(max_length=200)
    branch        = models.CharField(max_length=200, blank=True, default="")
    notes         = models.TextField(blank=True, default="")
 
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="walk_in")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="waiting")
 
    # Position in the queue — auto-assigned on creation
    position = models.PositiveIntegerField(default=0)
 
    # Timestamps
    queued_at          = models.DateTimeField(default=timezone.now)
    service_started_at = models.DateTimeField(null=True, blank=True)
    completed_at       = models.DateTimeField(null=True, blank=True)
 
    class Meta:
        db_table = "queue_entries"
        ordering = ["position", "queued_at"]
 
    def __str__(self):
        emp = self.assigned_employee.first_name if self.assigned_employee else "Unassigned"
        return f"#{self.position} {self.customer_name} — {self.service} [{self.status}] → {emp}"
 
    def save(self, *args, **kwargs):
        # Auto-assign next available position for brand-new entries
        if not self.pk and self.position == 0:
            last = QueueEntry.objects.filter(
                status__in=["waiting", "in_service"]
            ).order_by("-position").first()
            self.position = (last.position + 1) if last else 1
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = "queue_entries"