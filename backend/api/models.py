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
    user           = models.OneToOneField(User, on_delete=models.CASCADE, related_name="customer_profile")
    first_name     = models.CharField(max_length=100)
    last_name      = models.CharField(max_length=100)
    suffix = models.CharField(max_length=10, blank=True, null=True)
    phone          = models.CharField(max_length=20, blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)

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
    last_name  = models.CharField(max_length=100)
    phone      = models.CharField(max_length=20)
    role       = models.CharField(max_length=50, choices=ROLE_CHOICES)
    status     = models.CharField(max_length=20, default="Active")

    # ── OLD field kept and renamed so no data is lost ─────────────────────────
    # This preserves whatever branch name string was stored before the migration.
    branch_name = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text="Legacy plain-text branch name. Kept for reference; use `branch` FK instead.",
    )

    # ── NEW FK to Branch ──────────────────────────────────────────────────────
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff_members",
    )

    class Meta:
        db_table = "staffs"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"


# ── Booking ───────────────────────────────────────────────────────────────────
class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending",   "Pending"),
        ("confirmed", "Confirmed"),
        ("cancelled", "Cancelled"),
    ]

    user         = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    service      = models.CharField(max_length=100)

    # ── CHANGED: CharField → DecimalField for clean revenue arithmetic ────────
    # Migration will use a default of 0 for existing rows.
    price        = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    branch       = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, related_name="bookings")
    date         = models.DateField()
    time         = models.CharField(max_length=20)
    vehicle      = models.CharField(max_length=100, blank=True, default="")
    plate_number = models.CharField(max_length=20,  blank=True, default="")
    notes        = models.TextField(blank=True, default="")
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    staff        = models.CharField(max_length=100, blank=True, default="TBA")
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table  = "bookings"
        ordering  = ["-created_at"]

    def __str__(self):
        return f"{self.user} — {self.service} @ {self.branch} on {self.date}"


# ── Rating ────────────────────────────────────────────────────────────────────
# Stores customer satisfaction ratings per completed booking.
# One rating per booking (OneToOne).
class Rating(models.Model):
    SCORE_CHOICES = [(i, str(i)) for i in range(1, 6)]   # 1–5 stars

    booking  = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="rating")
    customer = models.ForeignKey(Customer,  on_delete=models.CASCADE, related_name="ratings")
    branch   = models.ForeignKey(Branch,    on_delete=models.CASCADE, related_name="ratings")
    score    = models.PositiveSmallIntegerField(choices=SCORE_CHOICES)
    comment  = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ratings"

    def __str__(self):
        return f"Rating {self.score}/5 — {self.booking}"


# ── QueueEntry ────────────────────────────────────────────────────────────────
class QueueEntry(models.Model):
    STATUS_CHOICES = [
        ("waiting",    "Waiting"),
        ("in_service", "In Service"),
        ("done",       "Done"),
        ("skipped",    "Skipped"),
    ]

    SOURCE_CHOICES = [
        ("booking", "Booking"),
        ("walk_in", "Walk-in"),
    ]

    booking = models.OneToOneField(
        Booking,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="queue_entry",
    )

    assigned_employee = models.ForeignKey(
        Staff,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="queue_assignments",
        limit_choices_to={"role": "Employee"},
    )

    customer_name = models.CharField(max_length=200)
    phone         = models.CharField(max_length=50,  blank=True, default="")
    vehicle       = models.CharField(max_length=200, blank=True, default="")
    plate_number  = models.CharField(max_length=50,  blank=True, default="")
    service       = models.CharField(max_length=200)
    notes         = models.TextField(blank=True, default="")

    # ── OLD CharField kept as branch_name so no data is lost ─────────────────
    branch_name = models.CharField(
        max_length=200,
        blank=True,
        default="",
        help_text="Legacy plain-text branch name. Use `branch` FK instead.",
    )

    # ── NEW FK to Branch ──────────────────────────────────────────────────────
    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="queue_entries",
    )

    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="walk_in")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="waiting")

    position = models.PositiveIntegerField(default=0)

    queued_at          = models.DateTimeField(default=timezone.now)
    service_started_at = models.DateTimeField(null=True, blank=True)
    completed_at       = models.DateTimeField(null=True, blank=True)
    price          = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(
        max_length=20,
        choices=[("unpaid", "Unpaid"), ("paid", "Paid")],
        default="unpaid",
    )
    payment_method = models.CharField(max_length=20, blank=True, default="")

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

# ── Service ───────────────────────────────────────────────────────────────────
class Service(models.Model):
    CATEGORY_CHOICES = [
        ("Maintenance", "Maintenance"),
        ("Repair",      "Repair"),
        ("Diagnostic",  "Diagnostic"),
        ("Cosmetic",    "Cosmetic"),
    ]

    name        = models.CharField(max_length=100)
    category    = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, default="")
    duration    = models.CharField(max_length=50, blank=True, default="")
    price_min   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_max   = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active   = models.BooleanField(default=True)
    branches    = models.ManyToManyField(Branch, related_name="services", blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "services"

    def __str__(self):
        return self.name

# ── InventoryItem ─────────────────────────────────────────────────────────────
class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ("Lubricants", "Lubricants"),
        ("Brakes",     "Brakes"),
        ("Filters",    "Filters"),
        ("Batteries",  "Batteries"),
        ("Tires",      "Tires"),
        ("Ignition",   "Ignition"),
        ("Other",      "Other"),
    ]

    name         = models.CharField(max_length=100)
    category     = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    sku          = models.CharField(max_length=100, unique=True)
    quantity     = models.PositiveIntegerField(default=0)
    minimum_qty  = models.PositiveIntegerField(default=0, help_text="Threshold for low stock alert")
    unit         = models.CharField(max_length=50, default="Pieces")
    price        = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    supplier     = models.CharField(max_length=100, blank=True, default="")
    branch       = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_items",
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "inventory_items"

    def __str__(self):
        return f"{self.name} ({self.branch})"

    @property
    def status(self):
        if self.quantity <= 0:
            return "Out of Stock"
        elif self.quantity <= self.minimum_qty:
            return "Low Stock"
        return "In Stock"