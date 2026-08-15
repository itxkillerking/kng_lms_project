from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamViewSet, ExamQuestionViewSet, ExamAttemptViewSet, 
    ExamAnswerViewSet, ExamViolationViewSet, ExamSnapshotViewSet, 
    ExamResultViewSet, PdfExtractView, ExamImportView, ResultPDFView
)

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'exam-questions', ExamQuestionViewSet, basename='examquestion')
router.register(r'exam-attempts', ExamAttemptViewSet, basename='examattempt')
router.register(r'exam-answers', ExamAnswerViewSet, basename='examanswer')
router.register(r'exam-violations', ExamViolationViewSet, basename='examviolation')
router.register(r'exam-snapshots', ExamSnapshotViewSet, basename='examsnapshot')
router.register(r'exam-results', ExamResultViewSet, basename='examresult')

urlpatterns = [
    path('pdf-extract/', PdfExtractView.as_view(), name='pdf-extract'),
    path('import/', ExamImportView.as_view(), name='exam-import'),
    path('exam-attempts/<int:pk>/result-pdf/', ResultPDFView.as_view(), name='exam-attempt-result-pdf'),
    path('', include(router.urls)),
]

