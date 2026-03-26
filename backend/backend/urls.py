# backend/urls.py
from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView
from rest_framework_simplejwt.views import TokenRefreshView

from api.views.auth_views import (
    SignupView, LogoutView, MeView, LoginView,
    GoogleLoginView, VerifyEmailView, ForgotPasswordView, ResetPasswordView
)
from api.views.staff_views import StaffView, StaffDetailView, VerifyPasswordView
from api.views.vehicle_views import AnalyzeVehicleView
from api.views.chatbot_views import chat_with_groq
from api.views.customer_dashboard import CustomerDashboardAPIView
from api.views.branch_views import BranchListCreateView, BranchDetailView
from api.views.dashboard_views import AdminDashboardView
from api.views.service_views import ServiceListCreateView, ServiceDetailView
from api.views.customer_views import AdminCustomerListView
from api.views.inventory_views import (
    InventoryListCreateView,
    InventoryDetailView,
    RestockRequestListCreateView,
    RestockRequestActionView,
    DirectStockTransferView,
    InventoryTransactionHistoryView,
)
from api.views.customer_views import AdminCustomerListView, CurrentCustomerProfileView
from api.views.inventory_views import InventoryListCreateView, InventoryDetailView
from api.views.appointment_views import AdminAppointmentListView, AdminAppointmentDetailView
from api.views.bookings_views import (
    BookingListCreateView,
    BookingDetailView,
    StaffBookingListView,
    StaffBookingActionView,
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
    queue_mark_paid
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
    OwnerStaffListView
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # ── Authentication ────────────────────────────────────────────────────────
    path('signup/',          SignupView.as_view(),        name='signup'),
    path('verify-email/',    VerifyEmailView.as_view(),   name='verify_email_api'),
    path('login/',           LoginView.as_view(),         name='login'),
    path('google-login/',    GoogleLoginView.as_view(),   name='google_login'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/',  ResetPasswordView.as_view(), name='reset_password'),
    path('token/refresh/',   TokenRefreshView.as_view(),  name='token_refresh'),
    path('logout/',          LogoutView.as_view(),        name='logout'),
    path('me/',              MeView.as_view(),            name='me'),

    # ── Staff management ──────────────────────────────────────────────────────
    path('staff/', StaffView.as_view(), name='staff'),
    path('staff/<int:pk>/', StaffDetailView.as_view(), name='staff-detail'),
    path('staff/verify-password/', VerifyPasswordView.as_view(), name='staff-verify-password'),

    # ── Vehicle AI ────────────────────────────────────────────────────────────
    path('api/analyze-vehicle/', AnalyzeVehicleView.as_view(), name='analyze_vehicle'),

    # ── Chatbot ───────────────────────────────────────────────────────────────
    path('api/chat/', chat_with_groq, name='chat_with_groq'),

    # ── Branches ──────────────────────────────────────────────────────────────
    path('branches/',          BranchListCreateView.as_view(), name='branch-list'),
    path('branches/<int:pk>/', BranchDetailView.as_view(),     name='branch-detail'),

    # ── Customer booking endpoints ────────────────────────────────────────────
    path('api/bookings/',          BookingListCreateView.as_view(), name='booking-list-create'),
    path('api/bookings/<int:pk>/', BookingDetailView.as_view(),     name='booking-detail'),
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
    path('customers/',             AdminCustomerListView.as_view(),     name='admin-customers'),
    path('inventory/',             InventoryListCreateView.as_view(),   name='inventory-list'),
    path('inventory/<int:pk>/',    InventoryDetailView.as_view(),       name='inventory-detail'),
    path('inventory/restock-requests/', RestockRequestListCreateView.as_view(), name='restock-request-list'),
    path('inventory/restock-requests/<int:pk>/action/', RestockRequestActionView.as_view(), name='restock-request-action'),
    path('inventory/transfer/', DirectStockTransferView.as_view(), name='inventory-transfer'),
    path('inventory/transactions/', InventoryTransactionHistoryView.as_view(), name='inventory-transactions'),
    path('appointments/',          AdminAppointmentListView.as_view(),  name='admin-appointments'),
    path('dashboard/',             AdminDashboardView.as_view(),         name='admin-dashboard'),
    path('services/',              ServiceListCreateView.as_view(),      name='service-list'),
    path('services/<int:pk>/',     ServiceDetailView.as_view(),          name='service-detail'),
    path('customers/',             AdminCustomerListView.as_view(),      name='admin-customers'),
    path('inventory/',             InventoryListCreateView.as_view(),    name='inventory-list'),
    path('inventory/<int:pk>/',    InventoryDetailView.as_view(),        name='inventory-detail'),
    path('appointments/',          AdminAppointmentListView.as_view(),   name='admin-appointments'),
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

    # ── Redirect root ─────────────────────────────────────────────────────────
    path('', RedirectView.as_view(url='/signup/', permanent=False)),
]
