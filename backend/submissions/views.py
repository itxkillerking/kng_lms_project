from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import QuizAttempt, AssignmentSubmission
from .serializers import QuizAttemptSerializer, AssignmentSubmissionSerializer

class QuizAttemptViewSet(viewsets.ModelViewSet):
    queryset = QuizAttempt.objects.select_related('user', 'quiz')
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        if getattr(self.request.user, 'role', 'student') == 'admin':
            return qs
        if self.request.user.is_student:
            qs = qs.filter(user=self.request.user)
        elif getattr(self.request.user, 'role', 'student') == 'instructor':
            qs = qs.filter(quiz__module__course__instructor=self.request.user)
            
        quiz_id = self.request.query_params.get('quiz')
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs

    def perform_create(self, serializer):
        # Further enhancement: trigger auto-grading upon submit
        instance = serializer.save(user=self.request.user)
        from courses.utils import check_and_trigger_graduation
        check_and_trigger_graduation(self.request.user, instance.quiz.module.course)

class AssignmentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = AssignmentSubmission.objects.select_related('user', 'assignment')
    serializer_class = AssignmentSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = self.queryset
        if getattr(self.request.user, 'role', 'student') == 'admin':
            return qs
        if self.request.user.is_student:
            qs = qs.filter(user=self.request.user)
        elif getattr(self.request.user, 'role', 'student') == 'instructor':
            qs = qs.filter(assignment__module__course__instructor=self.request.user)

        assignment_id = self.request.query_params.get('assignment')
        if assignment_id:
            qs = qs.filter(assignment_id=assignment_id)
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(user=self.request.user)
        from courses.utils import check_and_trigger_graduation
        check_and_trigger_graduation(self.request.user, instance.assignment.module.course)
