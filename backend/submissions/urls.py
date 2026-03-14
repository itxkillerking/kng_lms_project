from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizAttemptViewSet, AssignmentSubmissionViewSet

router = DefaultRouter()
router.register(r'quiz-attempts', QuizAttemptViewSet)
router.register(r'assignment-submissions', AssignmentSubmissionViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
