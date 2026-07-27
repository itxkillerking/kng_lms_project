from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseViewSet, 
    ModuleViewSet, 
    LessonViewSet, 
    AnnouncementViewSet, 
    CategoryViewSet, 
    ReviewViewSet,
    LessonCommentViewSet,
    EnrollmentRequestViewSet
)

router = DefaultRouter()
router.register(r'courses', CourseViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'announcements', AnnouncementViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'lesson-comments', LessonCommentViewSet)
router.register(r'enrollment-requests', EnrollmentRequestViewSet, basename='enrollment-requests')

urlpatterns = [
    path('', include(router.urls)),
]
