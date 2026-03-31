from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import UserLessonProgress
from .serializers import UserLessonProgressSerializer
from courses.models import Lesson, CourseEnrollment
from certificates.models import Certificate
from django.utils import timezone

class UserLessonProgressViewSet(viewsets.ModelViewSet):
    queryset = UserLessonProgress.objects.all()
    serializer_class = UserLessonProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle_complete(self, request):
        lesson_id = request.data.get('lesson_id')
        if not lesson_id:
            return Response({'error': 'lesson_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            lesson = Lesson.objects.get(id=lesson_id)
        except Lesson.DoesNotExist:
            return Response({'error': 'Lesson not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if student is enrolled in the course this lesson belongs to
        course = lesson.module.course
        if not CourseEnrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'error': 'You must be enrolled in the course to track progress'}, status=status.HTTP_403_FORBIDDEN)

        progress, created = UserLessonProgress.objects.get_or_create(
            user=request.user,
            lesson=lesson
        )
        
        # Toggle completion
        progress.is_complete = not progress.is_complete
        progress.save()

        # Graduation Logic
        from courses.utils import check_and_trigger_graduation
        current_progress, certificate_created = check_and_trigger_graduation(request.user, course)

        return Response({
            'is_complete': progress.is_complete,
            'progress_percentage': current_progress,
            'certificate_generated': certificate_created
        })
