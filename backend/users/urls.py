from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, CurrentUserView, AdminUserViewSet,
    CustomTokenObtainPairView, LogoutView,
    RequestOTPView, VerifyOTPView,
)

router = DefaultRouter()
router.register('admin', AdminUserViewSet, basename='admin-users')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('otp/request/', RequestOTPView.as_view(), name='request_otp'),
    path('otp/verify/', VerifyOTPView.as_view(), name='verify_otp'),
    path('', include(router.urls)),
]
