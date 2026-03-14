from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Quiz, Question, Assignment, AssignmentAttachment
from .serializers import QuizSerializer, QuestionSerializer, AssignmentSerializer, AssignmentAttachmentSerializer

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.select_related('module').prefetch_related('questions')
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related('module').prefetch_related('attachments')
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class AssignmentAttachmentViewSet(viewsets.ModelViewSet):
    queryset = AssignmentAttachment.objects.all()
    serializer_class = AssignmentAttachmentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
