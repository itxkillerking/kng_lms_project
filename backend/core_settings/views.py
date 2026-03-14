from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsSuperAdmin
from .models import GlobalSetting
from .serializers import GlobalSettingSerializer
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

class GlobalSettingViewSet(viewsets.ModelViewSet):
    queryset = GlobalSetting.objects.all()
    serializer_class = GlobalSettingSerializer
    permission_classes = [IsSuperAdmin]
    lookup_field = 'key'

    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdmin])
    def stats(self, request):
        """
        Optimized analytics endpoint. Returns aggregate counts
        from the database in a single response for the admin dashboard.
        No heavy object loading — just COUNT queries.
        """
        from users.models import User
        from courses.models import Course, CourseEnrollment, Lesson
        from submissions.models import QuizAttempt, AssignmentSubmission
        from certificates.models import Certificate

        # User stats
        user_counts = User.objects.aggregate(
            total_users=Count('id'),
            total_students=Count('id', filter=Q(role='student')),
            total_instructors=Count('id', filter=Q(role='instructor')),
            active_users=Count('id', filter=Q(account_status='active')),
            suspended_users=Count('id', filter=Q(account_status='suspended')),
        )

        # Course stats
        course_counts = Course.objects.aggregate(
            total_courses=Count('id'),
            approved_courses=Count('id', filter=Q(moderation_status='approved')),
            pending_courses=Count('id', filter=Q(moderation_status='pending')),
            rejected_courses=Count('id', filter=Q(moderation_status='rejected')),
        )

        # Enrollment stats
        enrollment_count = CourseEnrollment.objects.count()
        lesson_count = Lesson.objects.count()

        # Submission stats
        quiz_attempts = QuizAttempt.objects.count()
        assignment_submissions = AssignmentSubmission.objects.count()

        # Certificate stats
        certificates_issued = Certificate.objects.count()

        # Enrollment trends (last 6 months)
        six_months_ago = timezone.now() - timedelta(days=180)
        from django.db.models.functions import TruncMonth
        enrollment_trends = (
            CourseEnrollment.objects
            .filter(enrolled_at__gte=six_months_ago)
            .annotate(month=TruncMonth('enrolled_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        # New users trend (last 6 months)
        user_trends = (
            User.objects
            .filter(joined_at__gte=six_months_ago)
            .annotate(month=TruncMonth('joined_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )

        return Response({
            'users': user_counts,
            'courses': course_counts,
            'total_enrollments': enrollment_count,
            'total_lessons': lesson_count,
            'total_quiz_attempts': quiz_attempts,
            'total_assignment_submissions': assignment_submissions,
            'total_certificates': certificates_issued,
            'enrollment_trends': list(enrollment_trends),
            'user_trends': list(user_trends),
        })
