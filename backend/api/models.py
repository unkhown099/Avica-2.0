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
    birth_date = models.DateField(null=True, blank=True)
    phone          = models.CharField(max_length=20, blank=True, null=True)
    loyalty_points = models.IntegerField(default=0)
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)

    class Meta:
        db_table = "customers"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class CustomerSetting(models.Model):
    customer = models.OneToOneField(
        Customer,
        on_delete=models.CASCADE,
        related_name="settings",
    )
    notifications = models.JSONField(
        default=dict,
        blank=True,
    )
    privacy = models.JSONField(
        default=dict,
        blank=True,
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customer_settings"

    def __str__(self):
        return f"Settings for {self.customer_id}"


# ── Branch ────────────────────────────────────────────────────────────────────
class Branch(models.Model):
    name      = models.CharField(max_length=100)
    address   = models.CharField(max_length=200)
    hours     = models.CharField(max_length=100)
    phone     = models.CharField(max_length=20, blank=True, default="")
    fb_url    = models.URLField(max_length=500, blank=True, default="")
    latitude  = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    longitude = models.DecimalField(max_digits=12, decimal_places=9, null=True, blank=True)
    slots     = models.PositiveIntegerField(default=5)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "branches"


class BranchScheduleConfig(models.Model):
    branch = models.OneToOneField(
        Branch,
        on_delete=models.CASCADE,
        related_name="schedule_config",
    )
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "branch_schedule_configs"

    def __str__(self):
        return f"Schedule Config - {self.branch.name}"


# ── Staff ─────────────────────────────────────────────────────────────────────
class Staff(models.Model):
    ROLE_CHOICES = [
        ("super_admin",    "Super Admin"),
        ("Admin",          "Admin"),
        ("Business Owner", "Business Owner"),
        ("Branch Manager", "Branch Manager"),
        ("Staff",          "Staff (Cashier)"),
        ("Employee",       "Employee"),
        ("Inventory",      "Inventory"),
        ("Inventory Manager", "Inventory Manager"),
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
    profile_picture = models.ImageField(upload_to="profile_pictures/", blank=True, null=True)

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
        ("no_show", "No Show"),
        ("done", "Done"),
        ("rescheduled", "Rescheduled"),
    ]

    VEHICLE_SIZE_CHOICES = [
        ("motor", "Motorcycle"),
        ("small", "Small (Sedan/Hatchback)"),
        ("medium", "Medium (Crossover/SUV)"),
        ("large", "Large (Van/Pickup)"),
        ("xl", "Extra Large (Commercial/Bus)"),
    ]

    RESCHEDULE_STATUS_CHOICES = [
        ("none", "None"),
        ("pending_customer", "Pending Customer Response"),
        ("accepted", "Accepted"),
        ("declined", "Declined"),
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
    vehicle_size = models.CharField(max_length=20, choices=VEHICLE_SIZE_CHOICES, blank=True, default="small")
    plate_number = models.CharField(max_length=20,  blank=True, default="")
    notes        = models.TextField(blank=True, default="")
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    cancellation_reason = models.TextField(blank=True, default="", null=True)
    reschedule_status = models.CharField(
        max_length=30,
        choices=RESCHEDULE_STATUS_CHOICES,
        default="none",
    )
    reschedule_previous_status = models.CharField(max_length=20, default="confirmed")
    reschedule_options = models.JSONField(blank=True, default=list)
    reschedule_selected_option = models.JSONField(blank=True, null=True, default=None)
    reschedule_note = models.TextField(blank=True, default="")
    reschedule_proposed_by = models.ForeignKey(
        "Staff",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="proposed_reschedules",
    )
    # In your Booking model
    reschedule_request_reason = models.TextField(blank=True, null=True)
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

    VEHICLE_TYPE_CHOICES = [
        ("motor", "Motorcycle"),
        ("small", "Small (Sedan/Hatchback)"),
        ("medium", "Medium (Crossover/SUV)"),
        ("large", "Large (Van/Pickup)"),
        ("xl", "Extra Large (Commercial/Bus)"),
    ]

    booking = models.OneToOneField(
        Booking,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="queue_entry",
    )
    customer_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="walkin_queue_entries",
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
    vehicle_type  = models.CharField(max_length=20, choices=VEHICLE_TYPE_CHOICES, blank=True, default="")
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
        db_index=True,  # Add this temporarily
    )

    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default="walk_in")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="waiting")

    position = models.PositiveIntegerField(default=0)

    queued_at          = models.DateTimeField(default=timezone.now)
    service_started_at = models.DateTimeField(null=True, blank=True)
    completed_at       = models.DateTimeField(null=True, blank=True)
    service_base_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price          = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_status = models.CharField(
        max_length=20,
        choices=[("unpaid", "Unpaid"), ("paid", "Paid")],
        default="unpaid",
    )
    payment_method = models.CharField(max_length=20, blank=True, default="")
    rating_score = models.PositiveSmallIntegerField(null=True, blank=True)
    rating_comment = models.TextField(blank=True, default="")
    rated_at = models.DateTimeField(null=True, blank=True)

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
    name        = models.CharField(max_length=100)
    category    = models.CharField(max_length=100)
    description = models.TextField(blank=True, default="")
    image       = models.ImageField(upload_to="service_images/", blank=True, null=True)
    duration    = models.CharField(max_length=50, blank=True, default="")
    price       = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    price_list  = models.JSONField(blank=True, default=dict)
    is_active   = models.BooleanField(default=True)
    branches    = models.ManyToManyField(Branch, related_name="services", blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "services"

    def __str__(self):
        return self.name


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "service_categories"
        ordering = ["name"]

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
    is_active    = models.BooleanField(default=True)
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


class RestockRequest(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("received", "Received"),
        ("rejected", "Rejected"),
    ]

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.CASCADE,
        related_name="restock_requests",
    )
    branch = models.ForeignKey(
        Branch,
        on_delete=models.CASCADE,
        related_name="restock_requests",
    )
    requested_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="restock_requests_created",
    )
    quantity_requested = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    reviewed_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="restock_requests_reviewed",
    )
    reviewer_note = models.TextField(blank=True, default="")
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "restock_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.inventory_item.name} ({self.branch.name}) - {self.status}"


class InventoryTransaction(models.Model):
    ACTION_CHOICES = [
        ("create", "Create"),
        ("update", "Update"),
        ("archive", "Archive"),
        ("restore", "Restore"),
        ("transfer_out", "Transfer Out"),
        ("transfer_in", "Transfer In"),
        ("restock_request", "Restock Request"),
        ("restock_approved", "Restock Approved"),
        ("restock_received", "Restock Received"),
        ("restock_rejected", "Restock Rejected"),
    ]

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    action_type = models.CharField(max_length=30, choices=ACTION_CHOICES)
    quantity_before = models.IntegerField(null=True, blank=True)
    quantity_after = models.IntegerField(null=True, blank=True)
    quantity_changed = models.IntegerField(default=0)
    branch_name = models.CharField(max_length=100, blank=True, default="")
    target_branch_name = models.CharField(max_length=100, blank=True, default="")
    performed_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="inventory_transactions",
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "inventory_transactions"
        ordering = ["-created_at"]

    def __str__(self):
        item_name = self.inventory_item.name if self.inventory_item else "Unknown Item"
        return f"{item_name} - {self.action_type}"

class Notification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    notification_type = models.CharField(max_length=50, default="general")
    target_path = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.user.email}"

# ── ForecastingRun ─────────────────────────────────────────
class ForecastingRun(models.Model):
    forecast_type = models.CharField(max_length=50)
    scope_type = models.CharField(max_length=30)

    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.SET_NULL, null=True, blank=True)

    model_used = models.CharField(max_length=100)
    period_type = models.CharField(max_length=20)

    prediction_start_date = models.DateField(null=True, blank=True)
    prediction_end_date = models.DateField(null=True, blank=True)

    generated_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='success')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.forecast_type} - {self.period_type}"


# ── Inventory Demand Forecast ───────────────────────────────
class InventoryDemandForecast(models.Model):
    forecasting_run = models.ForeignKey(ForecastingRun, on_delete=models.CASCADE)

    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    inventory_item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE)

    forecast_period_label = models.CharField(max_length=50)

    predicted_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    historical_average_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    current_quantity = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    minimum_qty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    recommended_restock_qty = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    stock_risk_level = models.CharField(max_length=30, default='normal')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.inventory_item.name} - {self.forecast_period_label}"


# ── Service Demand Forecast ────────────────────────────────
class ServiceDemandForecast(models.Model):
    forecasting_run = models.ForeignKey(ForecastingRun, on_delete=models.CASCADE)

    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)

    forecast_period_label = models.CharField(max_length=50)

    predicted_booking_count = models.IntegerField()
    historical_average_count = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    predicted_queue_count = models.IntegerField(null=True, blank=True)

    peak_load_flag = models.BooleanField(default=False)
    staffing_suggestion = models.CharField(max_length=150, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service.name} - {self.forecast_period_label}"


# ── Service Duration Prediction ────────────────────────────
class ServiceDurationPrediction(models.Model):
    forecasting_run = models.ForeignKey(ForecastingRun, on_delete=models.CASCADE)

    branch = models.ForeignKey(
        Branch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    employee = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)

    based_on_queue_volume = models.IntegerField(null=True, blank=True)
    based_on_booking_volume = models.IntegerField(null=True, blank=True)
    based_on_avg_duration_minutes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    estimated_duration_minutes = models.DecimalField(max_digits=10, decimal_places=2)
    estimated_wait_minutes = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.service.name} - {self.estimated_duration_minutes} mins"

# ── LandingContent ─────────────────────────────────────────────────────────────
class LandingContent(models.Model):
    """
    Singleton-style table — only one row is ever active (key='default').
    The super admin CMS writes here; the public landing page reads from here.
    """
    key        = models.CharField(max_length=50, unique=True, default="default")
    content    = models.JSONField(default=dict)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="landing_content_updates",
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "landing_content"

    def __str__(self):
        return f"LandingContent [{self.key}] — {self.updated_at}"


class MediaAsset(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "image", "Image"
        DOCUMENT = "document", "Document"
        OTHER = "other", "Other"

    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="media_assets/")
    media_type = models.CharField(
        max_length=20,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_media_assets",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "media_asset"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"MediaAsset [{self.name}]"

# ── Plugin / Extension ─────────────────────────────────────────────────────────
class Plugin(models.Model):
    """
    Manage system plugins and extensions that can be enabled/disabled.
    """
    PLUGIN_CATEGORIES = [
        ("analytics", "Analytics & Tracking"),
        ("notifications", "Notifications & Alerts"),
        ("integrations", "Third-party Integrations"),
        ("automation", "Automation"),
        ("reporting", "Reporting & Analytics"),
        ("payment", "Payment Gateways"),
        ("marketing", "Marketing Tools"),
        ("other", "Other"),
    ]
    
    STATUS_CHOICES = [
        ("active", "Active"),
        ("inactive", "Inactive"),
        ("installed", "Installed (Disabled)"),
        ("needs_update", "Needs Update"),
        ("error", "Error"),
    ]
    
    # Basic Info
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, help_text="Unique identifier for the plugin")
    description = models.TextField()
    version = models.CharField(max_length=20, default="1.0.0")
    author = models.CharField(max_length=100, blank=True, default="")
    website = models.URLField(blank=True, default="")
    category = models.CharField(max_length=50, choices=PLUGIN_CATEGORIES, default="other")
    
    # Status & Configuration
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="inactive")
    is_system = models.BooleanField(default=False, help_text="System plugins cannot be uninstalled")
    settings = models.JSONField(default=dict, blank=True, help_text="Plugin-specific settings")
    
    # Installation Tracking
    installed_at = models.DateTimeField(auto_now_add=True)
    installed_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="installed_plugins",
    )
    updated_at = models.DateTimeField(auto_now=True)
    last_checked_at = models.DateTimeField(null=True, blank=True)
    
    # Dependencies
    dependencies = models.JSONField(default=list, blank=True, help_text="List of plugin slugs required")
    conflicts = models.JSONField(default=list, blank=True, help_text="List of plugin slugs that conflict")
    
    # Permissions (which roles can access/modify this plugin)
    accessible_by_roles = models.JSONField(default=list, blank=True, help_text="List of staff roles that can manage this plugin")
    
    class Meta:
        db_table = "plugins"
        ordering = ["category", "name"]
    
    def __str__(self):
        return f"{self.name} ({self.get_status_display()})"
    
    @property
    def is_active(self):
        return self.status == "active"
    
    def activate(self):
        """Activate the plugin"""
        # Check dependencies first
        if self.dependencies:
            missing = []
            for dep_slug in self.dependencies:
                if not Plugin.objects.filter(slug=dep_slug, status="active").exists():
                    missing.append(dep_slug)
            if missing:
                raise ValueError(f"Cannot activate: Missing dependencies: {', '.join(missing)}")
        
        # Check conflicts
        if self.conflicts:
            conflicting = []
            for conf_slug in self.conflicts:
                if Plugin.objects.filter(slug=conf_slug, status="active").exists():
                    conflicting.append(conf_slug)
            if conflicting:
                raise ValueError(f"Cannot activate: Conflicting plugins active: {', '.join(conflicting)}")
        
        self.status = "active"
        self.save()
    
    def deactivate(self):
        """Deactivate the plugin"""
        if self.is_system:
            raise ValueError("System plugins cannot be deactivated")
        self.status = "inactive"
        self.save()
    
    def update_settings(self, new_settings):
        """Update plugin settings (merges with existing)"""
        self.settings.update(new_settings)
        self.save()


# ── Plugin Log / Activity ─────────────────────────────────────────────────────
class PluginLog(models.Model):
    """
    Track plugin installation, activation, deactivation, and errors.
    """
    ACTION_CHOICES = [
        ("install", "Installed"),
        ("uninstall", "Uninstalled"),
        ("activate", "Activated"),
        ("deactivate", "Deactivated"),
        ("update", "Updated"),
        ("error", "Error"),
        ("config_change", "Configuration Changed"),
    ]
    
    plugin = models.ForeignKey(Plugin, on_delete=models.CASCADE, related_name="logs")
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    message = models.TextField(blank=True, default="")
    performed_by = models.ForeignKey(
        Staff,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="plugin_actions",
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "plugin_logs"
        ordering = ["-created_at"]
    
    def __str__(self):
        return f"{self.plugin.name} - {self.action} at {self.created_at}"
# ── ServiceMessage ────────────────────────────────────────────────────────────
class ServiceMessage(models.Model):
    queue_entry = models.ForeignKey(QueueEntry, on_delete=models.CASCADE, related_name="messages")
    sender_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    sender_type = models.CharField(max_length=20, choices=[("employee", "Employee"), ("customer", "Customer")])
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "service_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.sender_type} - {self.queue_entry.id}: {self.message[:20]}"


# ── DirectMessage ────────────────────────────────────────────────────────────
class DirectMessage(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name="direct_messages")
    employee = models.ForeignKey(Staff, on_delete=models.CASCADE, related_name="direct_messages")
    sender_type = models.CharField(max_length=20, choices=[("employee", "Employee"), ("customer", "Customer")])
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "direct_messages"
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.customer.first_name} & {self.employee.first_name} ({self.sender_type}): {self.message[:20]}"


class SystemSettings(models.Model):
    """
    Singleton table — only one row ever exists (fetched with .first() or
    get_or_create). Stores all super-admin configurable settings split into
    three JSON sections: general, email, security.
    """
 
    general = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Keys: siteName, siteTagline, siteMode ('live'|'maintenance'), "
            "maintenanceMessage, defaultLanguage, defaultTimezone, supportUrl"
        ),
    )
    email = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Keys: mailHost, mailPort, mailFrom, supportEmail, "
            "emailVerificationRequired, welcomeEmailEnabled"
        ),
    )
    security = models.JSONField(
        default=dict,
        blank=True,
        help_text=(
            "Keys: requireStrongPasswords, sessionTimeoutMinutes, "
            "maxLoginAttempts, lockoutDurationMinutes, "
            "allowTwoFactor, allowGoogleOAuth, allowFacebookOAuth"
        ),
    )
 
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="system_settings_updates",
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        db_table = "system_settings"
 
    def __str__(self):
        mode = self.general.get("siteMode", "live")
        return f"SystemSettings — mode={mode} — updated {self.updated_at:%Y-%m-%d %H:%M}"
 
    # ── Defaults ───────────────────────────────────────────────────────────────
    # Ensures a fresh row always has sensible values.
    GENERAL_DEFAULTS = {
        "siteName": "Otokwikk",
        "siteTagline": "Your Trusted Auto Service Partner",
        "siteMode": "live",
        "maintenanceMessage": "We're currently performing scheduled maintenance. We'll be back shortly!",
        "defaultLanguage": "en",
        "defaultTimezone": "Asia/Manila",
        "supportUrl": "https://support.otokwikk.com",
    }
 
    EMAIL_DEFAULTS = {
        "mailHost": "",
        "mailPort": 587,
        "mailFrom": "no-reply@otokwikk.com",
        "supportEmail": "support@otokwikk.com",
        "emailVerificationRequired": True,
        "welcomeEmailEnabled": True,
    }
 
    SECURITY_DEFAULTS = {
        "requireStrongPasswords": True,
        "sessionTimeoutMinutes": 60,
        "maxLoginAttempts": 5,
        "lockoutDurationMinutes": 15,
        "allowTwoFactor": False,
        "allowGoogleOAuth": False,
        "allowFacebookOAuth": False,
    }
 
    @classmethod
    def get_singleton(cls):
        """
        Always returns the one-and-only SystemSettings row, creating it
        with defaults if it doesn't exist yet.
        """
        obj, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                "general": cls.GENERAL_DEFAULTS.copy(),
                "email": cls.EMAIL_DEFAULTS.copy(),
                "security": cls.SECURITY_DEFAULTS.copy(),
            },
        )
        if not created:
            # Back-fill any keys that were added after the row was first created
            changed = False
            for key, val in cls.GENERAL_DEFAULTS.items():
                if key not in obj.general:
                    obj.general[key] = val
                    changed = True
            for key, val in cls.EMAIL_DEFAULTS.items():
                if key not in obj.email:
                    obj.email[key] = val
                    changed = True
            for key, val in cls.SECURITY_DEFAULTS.items():
                if key not in obj.security:
                    obj.security[key] = val
                    changed = True
            if changed:
                obj.save(update_fields=["general", "email", "security"])
        return obj
 
    @property
    def is_maintenance(self):
        return self.general.get("siteMode") == "maintenance"