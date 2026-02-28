from django.urls import path
from .views import SignupView, LoginView, LogoutView, StaffView, CarRecognitionView

urlpatterns = [
    path('signup/', SignupView.as_view()),
    path('login/', LoginView.as_view()),
    path("logout/", LogoutView.as_view()),
    path("staff/", StaffView.as_view()),
    path("car-recognition/", CarRecognitionView.as_view()),
]
