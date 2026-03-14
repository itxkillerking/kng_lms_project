from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuizViewSet, QuestionViewSet, AssignmentViewSet, AssignmentAttachmentViewSet

router = DefaultRouter()
router.register(r'quizzes', QuizViewSet)
router.register(r'questions', QuestionViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'assignment-attachments', AssignmentAttachmentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
