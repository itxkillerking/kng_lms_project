from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from users.permissions import IsSuperAdmin
from .models import Course, Module, Lesson, Announcement, Category, Review, LessonComment, CourseEnrollment
from .serializers import (
    CourseSerializer, ModuleSerializer, LessonSerializer, 
    AnnouncementSerializer, CategorySerializer, ReviewSerializer,
    LessonCommentSerializer, EnrollmentRequestSerializer
)
from .recommendations import get_suggested_courses
from .permissions import IsCourseInstructorOrReadOnly
from rest_framework.exceptions import PermissionDenied

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
                Q(category__name__icontains=search_query)
            )

        if instructor_filter:
            if instructor_filter == 'me' and user.is_authenticated:
                qs = qs.filter(instructor=user)
            else:
                try:
                    qs = qs.filter(instructor_id=int(instructor_filter))
                except ValueError:
                    pass
        elif user.is_authenticated and user.role == 'instructor':
             # Default for instructors if no filter applied: Only show their courses
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
        if self.request.user.role == 'admin':
            # Admin can assign any instructor. Courses created by admin are automatically approved.
            if instructor_id:
                serializer.save(instructor_id=instructor_id, moderation_status='approved')
            else:
                serializer.save(instructor=self.request.user, moderation_status='approved')
        else:
            # Teachers assign themselves, status defaults to 'pending'
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
        """Request enrollment in the course."""
        from django.db import connection
        import logging
        logger = logging.getLogger(__name__)
        logger.error("DB PATH: %s", connection.settings_dict["NAME"])
        logger.error("TABLES: %s", connection.introspection.table_names())
        
        course = self.get_object()
        from .models import CourseEnrollment, EnrollmentRequest
        
        # 1. Check if already enrolled
        if CourseEnrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'status': 'enrolled', 'message': 'Already enrolled'}, status=status.HTTP_200_OK)
            
        # 2. Check for existing request
        req = EnrollmentRequest.objects.filter(student=request.user, course=course).first()
        if req:
            if req.status == 'pending':
                return Response({'status': 'pending', 'message': 'Request already pending'}, status=status.HTTP_400_BAD_REQUEST)
            elif req.status == 'locked':
                return Response({'status': 'locked', 'message': 'Course is locked'}, status=status.HTTP_403_FORBIDDEN)
            elif req.status == 'rejected':
                # If rejected, they can try again by updating the existing request
                req.status = 'pending'
                req.save()
                return Response({'status': 'pending', 'message': 'Enrollment request re-submitted!'}, status=status.HTTP_200_OK)
            
        # 3. Create new pending request (Change this to CourseEnrollment.objects.create to bypass approval in the future)
        EnrollmentRequest.objects.create(student=request.user, course=course, status='pending')
        return Response({'status': 'pending', 'message': 'Enrollment request sent!'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def enrollment_status(self, request, pk=None):
        """Check the user's enrollment status for this course."""
        course = self.get_object()
        from .models import CourseEnrollment, EnrollmentRequest
        
        if CourseEnrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'status': 'enrolled'})
            
        req = EnrollmentRequest.objects.filter(student=request.user, course=course).first()
        if req:
            return Response({'status': req.status})
            
        return Response({'status': 'none'})

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def students(self, request, pk=None):
        """Get students enrolled in this course (Instructor only)"""
        course = self.get_object()
        
        if request.user.role not in ['admin'] and course.instructor != request.user:
            return Response({'detail': 'Not authorized to view students.'}, status=status.HTTP_403_FORBIDDEN)
            
        enrollments = course.enrollments.select_related('student')
        
        page = self.paginate_queryset(enrollments)
        if page is not None:
            data = [{'id': e.student.id, 'username': e.student.username, 'email': e.student.email} for e in page]
            return self.get_paginated_response(data)
            
        data = [{'id': e.student.id, 'username': e.student.username, 'email': e.student.email} for e in enrollments]
        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_courses(self, request):
        """Get courses the student is enrolled in."""
        enrollments = request.user.enrollments.all()
        courses = [e.course for e in enrollments]
        serializer = self.get_serializer(courses, many=True)
        return Response(serializer.data)

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
    permission_classes = [IsAuthenticatedOrReadOnly, IsCourseInstructorOrReadOnly]

    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        if course.instructor != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You do not have permission to add modules to this course.")
        serializer.save()

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCourseInstructorOrReadOnly]

    def perform_create(self, serializer):
        module = serializer.validated_data.get('module')
        if module.course.instructor != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You do not have permission to add lessons to this module.")
        serializer.save()

class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.select_related('teacher', 'course')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCourseInstructorOrReadOnly]

    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        if course.instructor != self.request.user and self.request.user.role != 'admin':
            raise PermissionDenied("You do not have permission to add announcements to this course.")
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

from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from .models import EnrollmentRequest, CourseEnrollment
from .serializers import EnrollmentRequestSerializer

class EnrollmentRequestViewSet(viewsets.ModelViewSet):
    queryset = EnrollmentRequest.objects.all().order_by('-created_at')
    serializer_class = EnrollmentRequestSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        req = self.get_object()
        
        # 1. Check if they are already enrolled to prevent duplicates
        if CourseEnrollment.objects.filter(student=req.student, course=req.course).exists():
            req.status = 'accepted'
            req.reviewed_at = timezone.now()
            req.reviewed_by = request.user
            req.save()
            return Response({'status': 'Already enrolled. Request marked accepted.'})
            
        # 2. Automatically enroll the student
        CourseEnrollment.objects.create(student=req.student, course=req.course)
        
        # 3. Automatically delete or mark as Accepted
        req.status = 'accepted'
        req.reviewed_at = timezone.now()
        req.reviewed_by = request.user
        req.save()
        
        return Response({'status': 'Accepted and enrolled successfully.'})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = 'rejected'
        req.reviewed_at = timezone.now()
        req.reviewed_by = request.user
        req.save()
        return Response({'status': 'Rejected successfully.'})

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        req = self.get_object()
        req.status = 'locked'
        req.reviewed_at = timezone.now()
        req.reviewed_by = request.user
        req.save()
        return Response({'status': 'Locked successfully.'})

    @action(detail=True, methods=['post'])
    def unlock(self, request, pk=None):
        req = self.get_object()
        req.status = 'rejected'  # Let them try again
        req.reviewed_at = timezone.now()
        req.reviewed_by = request.user
        req.save()
        return Response({'status': 'Unlocked successfully.'})
