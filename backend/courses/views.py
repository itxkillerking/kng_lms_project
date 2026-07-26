from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from users.permissions import IsSuperAdmin
from .models import Course, Module, Lesson, Announcement, Category, Review, LessonComment, CourseEnrollment
from .serializers import (
    CourseSerializer, ModuleSerializer, LessonSerializer, 
    AnnouncementSerializer, CategorySerializer, ReviewSerializer,
    LessonCommentSerializer
)
from .recommendations import get_suggested_courses

class LessonCommentViewSet(viewsets.ModelViewSet):
    queryset = LessonComment.objects.all().order_by('-created_at')
    serializer_class = LessonCommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        lesson_id = self.request.query_params.get('lesson_id')
        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        return queryset

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.select_related('instructor', 'category').prefetch_related('modules', 'modules__lessons')
    serializer_class = CourseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
             return [IsAuthenticated()]
        return super().get_permissions()

    def get_queryset(self):
        qs = self.queryset
        user = self.request.user
        
        # Base Filtering: Only show approved courses to students and guests
        if not user.is_authenticated or user.role not in ['admin', 'instructor']:
            qs = qs.filter(moderation_status='approved')
        elif user.role == 'instructor':
            # Instructors see all approved courses + their own pending/rejected ones
            from django.db.models import Q
            qs = qs.filter(Q(moderation_status='approved') | Q(instructor=user))
        # Admins see everything (no filter)

        # Apply search and other filters
        search_query = self.request.query_params.get('search', None)
        instructor_filter = self.request.query_params.get('instructor')
        moderation_param = self.request.query_params.get('status')
        
        if search_query:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(instructor__username__icontains=search_query)
            )

        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)

        if instructor_filter == 'me' and user.is_authenticated:
            qs = qs.filter(instructor=user)
        
        if moderation_param:
            qs = qs.filter(moderation_status=moderation_param)
            
        return qs

    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdmin])
    def instructors(self, request):
        """List all available instructors (Admins only)"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        instructors = User.objects.filter(role='instructor')
        data = [{'id': u.id, 'username': u.username, 'email': u.email} for u in instructors]
        return Response(data)

    def perform_create(self, serializer):
        instructor_id = self.request.data.get('instructor')
        if instructor_id and self.request.user.role == 'admin':
            # Admin can assign any instructor
            serializer.save(instructor_id=instructor_id)
        else:
            # Teachers assign themselves
            serializer.save(instructor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        course = self.get_object()
        course.moderation_status = 'approved'
        course.save()
        return Response({'status': 'Course approved'})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reject(self, request, pk=None):
        course = self.get_object()
        course.moderation_status = 'rejected'
        course.save()
        return Response({'status': 'Course rejected'})

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Detailed preview for moderation"""
        course = self.get_object()
        serializer = self.get_serializer(course)
        # We can add more detailed info here if needed
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def recommendations(self, request):
        """Get personalized course suggestions for the authenticated student"""
        from django.core.cache import cache
        cache_key = f"user_{request.user.id}_recommendations"
        data = cache.get(cache_key)
        
        if not data:
            suggestions = get_suggested_courses(request.user)
            serializer = self.get_serializer(suggestions, many=True)
            data = serializer.data
            cache.set(cache_key, data, 60 * 15)  # Cache for 15 minutes
            
        return Response(data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def enroll(self, request, pk=None):
        """Request to enroll in the course."""
        course = self.get_object()
        from .models import CourseEnrollment
        
        enrollment, created = CourseEnrollment.objects.get_or_create(
            student=request.user,
            course=course,
            defaults={'status': 'pending'}
        )
        
        if created:
            return Response({'status': 'pending', 'message': 'Enrollment request sent successfully'}, status=status.HTTP_201_CREATED)
        
        return Response({'status': enrollment.status, 'message': f'Enrollment status: {enrollment.status}'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def enrollment_status(self, request, pk=None):
        """Check the current user's enrollment status for this course."""
        course = self.get_object()
        from .models import CourseEnrollment
        
        try:
            enrollment = CourseEnrollment.objects.get(student=request.user, course=course)
            return Response({'status': enrollment.status, 'rejection_reason': enrollment.rejection_reason})
        except CourseEnrollment.DoesNotExist:
            return Response({'status': 'none'})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_courses(self, request):
        """Get courses the student is enrolled in and approved for."""
        enrollments = request.user.enrollments.filter(status='approved')
        courses = [e.course for e in enrollments]
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

    # --- Admin Enrollment Endpoints ---
    @action(detail=False, methods=['get'], permission_classes=[IsSuperAdmin])
    def pending_enrollments(self, request):
        from .models import CourseEnrollment
        from .serializers import CourseEnrollmentSerializer
        enrollments = CourseEnrollment.objects.filter(status='pending').order_by('-enrolled_at')
        return Response(CourseEnrollmentSerializer(enrollments, many=True).data)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve_enrollment(self, request, pk=None):
        from .models import CourseEnrollment
        from users.communication import send_enrollment_email
        try:
            enrollment = CourseEnrollment.objects.get(pk=pk, status='pending')
            enrollment.status = 'approved'
            enrollment.save()
            
            # Trigger enrollment email
            if enrollment.student.email:
                send_enrollment_email(enrollment.student, enrollment.course)
                
            return Response({'status': 'Enrollment approved'})
        except CourseEnrollment.DoesNotExist:
            return Response({'error': 'Pending enrollment not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reject_enrollment(self, request, pk=None):
        from .models import CourseEnrollment
        from messaging.models import Message
        
        reason = request.data.get('reason', 'No reason provided')
        try:
            enrollment = CourseEnrollment.objects.get(pk=pk, status='pending')
            enrollment.status = 'rejected'
            enrollment.rejection_reason = reason
            enrollment.save()
            
            # Send in-app notification
            Message.objects.create(
                sender=request.user,
                recipient=enrollment.student,
                content=f"Your enrollment request for {enrollment.course.title} was rejected. Reason: {reason}"
            )
            
            return Response({'status': 'Enrollment rejected'})
        except CourseEnrollment.DoesNotExist:
            return Response({'error': 'Pending enrollment not found'}, status=status.HTTP_404_NOT_FOUND)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()]
        return [IsAuthenticatedOrReadOnly()]

class ModuleViewSet(viewsets.ModelViewSet):
    queryset = Module.objects.all()
    serializer_class = ModuleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related('teacher', 'course')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.select_related('course', 'student')
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Ensure student only reviews once per course
        course_id = self.request.data.get('course')
        if Review.objects.filter(course_id=course_id, student=self.request.user).exists():
            raise serializers.ValidationError({"detail": "You have already reviewed this course."})
        serializer.save(student=self.request.user)

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course')
        if course_id:
            qs = qs.filter(course_id=course_id)
        return qs
