from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MessagingViewSet, push_subscribe

router = DefaultRouter()
router.register('messages', MessagingViewSet, basename='messages')

urlpatterns = [
    path('push/subscribe/', push_subscribe, name='push_subscribe'),
    path('', include(router.urls)),
]
