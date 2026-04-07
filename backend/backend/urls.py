# backend/urls.py
from django import views
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenRefreshView

from api.views.auth_views import (
    SignupView, LogoutView, MeView, LoginView,
    GoogleLoginView, VerifyEmailView, ForgotPasswordView, ResetPasswordView, DeleteAccountView, CheckEmailView
)
from api.views.forecast_views import (
    generate_all_forecasts,
    get_latest_all_forecasts,
    get_latest_system_forecasts,
    generate_system_forecasts
)

from api.views.staff_views import StaffView, StaffDetailView, VerifyPasswordView
from api.views.vehicle_views import AnalyzeVehicleView
from api.views.chatbot_views import chat_with_groq
from api.views.customer_dashboard import CustomerDashboardAPIView
from api.views.branch_views import BranchListCreateView, BranchDetailView
from api.views.dashboard_views import AdminDashboardView, ManagerDashboardView, ManagerScheduleConfigView, StaffDashboardView
from api.views.service_views import ServiceListCreateView, ServiceDetailView, ServiceCategoryListCreateView
from api.views.customer_views import AdminCustomerListView, CurrentCustomerProfileView, ManagerCustomerHistoryView
from api.views.appointment_views import AdminAppointmentListView, AdminAppointmentDetailView
from api.views.inventory_views import (
    InventoryListCreateView,
    InventoryDetailView,
    RestockRequestListCreateView,
    RestockRequestActionView,
    DirectStockTransferView,
    InventoryTransactionHistoryView,
    InventoryDemandForecastView,
)
from api.views.bookings_views import (
    BookingListCreateView,
    BookingDetailView,
    StaffBookingListView,
    StaffBookingActionView,
    BookingRescheduleResponseView,
    BookingRescheduleRequestView,
    AvailableSlotsView
)
from api.views.queue_views import (
    queue_list,
    queue_walk_in,
    queue_from_booking,
    queue_action,
    queue_assign,
    queue_employees,
    queue_remove,
    queue_history,
    queue_mark_paid,
    queue_available_products,
    queue_add_products,
    queue_edit_service_details,
    queue_messages,
)
from api.views.customer_history import CustomerHistoryAPIView
from api.views.ratings_views import RatingCreateView
from api.views.business_owner_views import (
    OwnerDashboardStatsView,
    OwnerRevenueTrendView,
    OwnerBranchRevenueView,
    OwnerBranchListView,
    OwnerAppointmentListView,
    OwnerAppointmentCalendarView,
    OwnerServiceListView,
    OwnerInventoryView,
    OwnerStaffListView,
    OwnerStaffDetailView,
)
from api.views.notification_views import (
    NotificationListView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
)
from api.views.damage_views import AnalyzeDamageView
from api.views.super_admin_views import (
    SuperAdminDashboardView,
    SuperAdminUserListView,
    SuperAdminUserDetailView,
    SuperAdminRoleListView,
    SuperAdminReportsView,
    SuperAdminActivityLogView,
    SuperAdminBranchOverviewView,
    SuperAdminBroadcastView,
    SuperAdminCreateView,
    SuperAdminSystemSettingsView,
    SuperAdminPluginView,
    SuperAdminPluginDetailView,
)
from api.views.landing_content_views import (
    LandingContentPublicView,
    LandingContentAdminView,
    MediaAssetListView,
    MediaAssetDetailView,
)

from api.views.direct_message_views import direct_message_contacts_view, direct_messages_view
from api.views.payment_views import CreatePayMongoLinkView

urlpatterns = [
    # ── Super Admin endpoints ─────────────────────────────────────────────────────
    path("super-admin/dashboard/",           SuperAdminDashboardView.as_view()),
    path("super-admin/users/",               SuperAdminUserListView.as_view()),
    path("super-admin/users/<int:pk>/",      SuperAdminUserDetailView.as_view()),
    path("super-admin/roles/",               SuperAdminRoleListView.as_view()),
    path("super-admin/reports/",             SuperAdminReportsView.as_view()),
    path("super-admin/activity-log/",        SuperAdminActivityLogView.as_view()),
    path("super-admin/branches/",            SuperAdminBranchOverviewView.as_view()),
    path("super-admin/broadcast/",           SuperAdminBroadcastView.as_view()),
    path("super-admin/create/",              SuperAdminCreateView.as_view()),
    path("super-admin/settings/", SuperAdminSystemSettingsView.as_view()),
    path('super-admin/plugins/', SuperAdminPluginView.as_view(), name='super-admin-plugins'),
    path('super-admin/plugins/<int:pk>/', SuperAdminPluginDetailView.as_view(), name='super-admin-plugin-detail'),

    path('admin/', admin.site.urls),

    # ── Authentication ────────────────────────────────────────────────────────
    path('signup/',          SignupView.as_view(),        name='signup'),
    path('verify-email/',    VerifyEmailView.as_view(),   name='verify_email_api'),
    path('login/',           LoginView.as_view(),         name='login'),
    path('google-login/',    GoogleLoginView.as_view(),   name='google_login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/',  ResetPasswordView.as_view(), name='reset_password'),
    path('delete-account/',  DeleteAccountView.as_view(), name='delete_account'),
    path('token/refresh/',   TokenRefreshView.as_view(),  name='token_refresh'),
    path('logout/',          LogoutView.as_view(),        name='logout'),
    path('me/',              MeView.as_view(),            name='me'),
    path('check-email/',     CheckEmailView.as_view(),    name='check_email'),

    # ── Staff management ──────────────────────────────────────────────────────
    path('staff/', StaffView.as_view(), name='staff'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('staff/verify-password/', VerifyPasswordView.as_view(), name='staff-verify-password'),

    # ── Vehicle AI ────────────────────────────────────────────────────────────
    path('api/analyze-vehicle/', AnalyzeVehicleView.as_view(), name='analyze_vehicle'),
    path('api/analyze-damage/', AnalyzeDamageView.as_view(), name='analyze_damage'),

    # ── Chatbot ───────────────────────────────────────────────────────────────
    path('api/chat/', chat_with_groq, name='chat_with_groq'),

    # ── Branches ──────────────────────────────────────────────────────────────
    path('branches/',          BranchListCreateView.as_view(), name='branch-list'),
    path('branches/<int:pk>/', BranchDetailView.as_view(),     name='branch-detail'),

    # ── Customer booking endpoints ────────────────────────────────────────────
    path('api/bookings/',          BookingListCreateView.as_view(), name='booking-list-create'),
    path('api/bookings/<int:pk>/', BookingDetailView.as_view(),     name='booking-detail'),
    path('api/bookings/<int:pk>/reschedule-response/', BookingRescheduleResponseView.as_view(), name='booking-reschedule-response'),
    path('api/bookings/<int:pk>/request-reschedule/', BookingRescheduleRequestView.as_view(), name='booking-request-reschedule'),
    path('api/bookings/available-slots/', AvailableSlotsView.as_view(), name='available-slots'),

    # ── Staff / Manager booking endpoints ─────────────────────────────────────
    path('api/staff/bookings/',                 StaffBookingListView.as_view(),   name='staff-booking-list'),
    path('api/staff/bookings/<int:pk>/action/', StaffBookingActionView.as_view(), name='staff-booking-action'),

    # ── Queue endpoints ───────────────────────────────────────────────────────
    path('api/queue/',                    queue_list,         name='queue-list'),
    path('api/queue/walk-in/',            queue_walk_in,      name='queue-walk-in'),
    path('api/queue/from-booking/',       queue_from_booking, name='queue-from-booking'),
    path('api/queue/history/',            queue_history,      name='queue-history'),
    path('api/queue/employees/',          queue_employees,    name='queue-employees'),
    path('api/queue/<int:pk>/action/',    queue_action,       name='queue-action'),
    path('api/queue/<int:pk>/assign/',    queue_assign,       name='queue-assign'),
    path('api/queue/<int:pk>/',           queue_remove,       name='queue-remove'),
    path('api/queue/<int:pk>/mark-paid/', queue_mark_paid,    name='queue-mark-paid'),
    path('api/queue/<int:pk>/products/', queue_available_products, name='queue-products'),
    path('api/queue/<int:pk>/add-products/', queue_add_products, name='queue-add-products'),
    path('api/queue/<int:pk>/service-details/', queue_edit_service_details, name='queue-service-details'),
    path('api/queue/<int:pk>/messages/', queue_messages, name='queue-messages'),

    # ── Direct Messaging ──────────────────────────────────────────────────────
    path('api/direct-messages/contacts/', direct_message_contacts_view, name='direct-message-contacts'),
    path('api/direct-messages/<int:partner_id>/', direct_messages_view, name='direct-messages'),

    # ── Payments ──────────────────────────────────────────────────────────────
    path('api/paymongo/create-link/', CreatePayMongoLinkView.as_view(), name='paymongo-link'),

    # ── Customer dashboard & history ──────────────────────────────────────────
    path('api/customer/dashboard/', CustomerDashboardAPIView.as_view(), name='customer-dashboard'),
    path('api/customer/history/',   CustomerHistoryAPIView.as_view(),   name='customer-history'),
    path('api/customers/me/', CurrentCustomerProfileView.as_view(), name='current-customer-profile'),


    # ── Ratings ───────────────────────────────────────────────────────────────
    path('api/ratings/', RatingCreateView.as_view(), name='rating-create'),

    # ── Admin endpoints ───────────────────────────────────────────────────────
    path('dashboard/',             AdminDashboardView.as_view(),        name='admin-dashboard'),
    path('services/',              ServiceListCreateView.as_view(),     name='service-list'),
    path('services/<int:pk>/',     ServiceDetailView.as_view(),         name='service-detail'),
    path('services/categories/',   ServiceCategoryListCreateView.as_view(), name='service-categories'),
    path('customers/',             AdminCustomerListView.as_view(),     name='admin-customers'),
    path('api/manager/customers/<int:customer_id>/history/', ManagerCustomerHistoryView.as_view(), name='manager-customer-history'),
    path('api/admin/customers/<int:customer_id>/history/', ManagerCustomerHistoryView.as_view(), name='admin-customer-history'),
    path('inventory/',             InventoryListCreateView.as_view(),   name='inventory-list'),
    path('inventory/<int:pk>/',    InventoryDetailView.as_view(),       name='inventory-detail'),
    path('inventory/restock-requests/', RestockRequestListCreateView.as_view(), name='restock-request-list'),
    path('inventory/restock-requests/<int:pk>/action/', RestockRequestActionView.as_view(), name='restock-request-action'),
    path('inventory/transfer/', DirectStockTransferView.as_view(), name='inventory-transfer'),
    path('inventory/transactions/', InventoryTransactionHistoryView.as_view(), name='inventory-transactions'),
    path('inventory/demand-forecast/', InventoryDemandForecastView.as_view(), name='inventory-demand-forecast'),
    path('appointments/',          AdminAppointmentListView.as_view(),  name='admin-appointments'),
    path('appointments/<int:pk>/', AdminAppointmentDetailView.as_view(), name='admin-appointment-detail'),

    # ── Business Owner endpoints ──────────────────────────────────────────────────
    path("owner/dashboard/stats/",        OwnerDashboardStatsView.as_view()),
    path("owner/dashboard/trend/",        OwnerRevenueTrendView.as_view()),
    path("owner/dashboard/branch-revenue/", OwnerBranchRevenueView.as_view()),
    path("owner/branches/",               OwnerBranchListView.as_view()),
    path("owner/appointments/",           OwnerAppointmentListView.as_view()),
    path("owner/appointments/calendar/",  OwnerAppointmentCalendarView.as_view()),
    path("owner/services/",               OwnerServiceListView.as_view()),
    path("owner/inventory/",              OwnerInventoryView.as_view()),
    path("owner/staff/",                  OwnerStaffListView.as_view()),
    path("owner/staff/<int:pk>/",         OwnerStaffDetailView.as_view()),

    # ── Manager endpoints ─────────────────────────────────────────────────────
    path("api/manager/dashboard/",        ManagerDashboardView.as_view()),
    path("api/manager/schedule-config/",  ManagerScheduleConfigView.as_view()),

    # ── Staff endpoints ───────────────────────────────────────────────────────
    path("api/staff/dashboard/", StaffDashboardView.as_view()),

    # ── Notification endpoints ───────────────────────────────────────────────
    path("api/notifications/",                NotificationListView.as_view(), name="notification-list"),
    path("api/notifications/<int:pk>/read/", NotificationMarkReadView.as_view(), name="notification-mark-read"),
    path("api/notifications/mark-all-read/", NotificationMarkAllReadView.as_view(), name="notification-mark-all-read"),

    # ── Landing content ───────────────────────────────────────────────────────────
    path("api/landing-content/",              LandingContentPublicView.as_view()),   # public
    path("super-admin/landing-content/",      LandingContentAdminView.as_view()), # admin-only
    path("super-admin/media-assets/",         MediaAssetListView.as_view()),
    path("super-admin/media-assets/<int:pk>/", MediaAssetDetailView.as_view()),

    # ── Redirect root ─────────────────────────────────────────────────────────
    path('', RedirectView.as_view(url='/signup/', permanent=False)),
    path("forecast/all/<int:branch_id>/", generate_all_forecasts, name="generate_all_forecasts"),
    path("forecast/all/<int:branch_id>/latest/", get_latest_all_forecasts, name="get_latest_all_forecasts"),
    path("api/forecast/system/", get_latest_system_forecasts, name="system-forecast"),
    path("api/forecast/system/generate/", generate_system_forecasts, name="generate_system_forecasts"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
