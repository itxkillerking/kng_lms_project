from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GlobalSettingViewSet

router = DefaultRouter()
router.register('settings', GlobalSettingViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
