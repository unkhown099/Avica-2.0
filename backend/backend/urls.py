"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView

# Import views from their respective modules
from api.views.auth_views import SignupView, LoginView, LogoutView
from api.views.staff_views import StaffView
from api.views.vehicle_views import AnalyzeVehicleView  # class-based version of analyze_vehicle

urlpatterns = [
    path('admin/', admin.site.urls),

    # Authentication
    path('signup/', SignupView.as_view(), name='signup'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # Staff management
    path('staff/', StaffView.as_view(), name='staff'),

    # Vehicle AI analysis
    path('api/analyze-vehicle/', AnalyzeVehicleView.as_view(), name='analyze_vehicle'),

    # Redirect root to signup page
    path('', RedirectView.as_view(url='/signup/', permanent=False)),
]