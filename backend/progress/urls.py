from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserLessonProgressViewSet

router = DefaultRouter()
router.register(r'', UserLessonProgressViewSet, basename='lesson-progress')

urlpatterns = [
    path('', include(router.urls)),
]
