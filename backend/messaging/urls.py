from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessagingViewSet

router = DefaultRouter()
router.register('messages', MessagingViewSet, basename='messages')

urlpatterns = [
    path('', include(router.urls)),
]
