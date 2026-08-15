from rest_framework import viewsets, status, serializers
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db import transaction
from .models import (
    Exam, ExamQuestion, ExamAttempt, ExamAnswer,
    ExamViolation, ExamSnapshot, ExamResult, ExamSettings, ExamImportMetadata
)
from .serializers import (
    ExamSerializer, ExamQuestionSerializer, ExamAttemptSerializer, 
    ExamAnswerSerializer, ExamViolationSerializer, ExamSnapshotSerializer, 
    ExamResultSerializer
)
from .permissions import IsExamInstructorOrReadOnly, IsExamInstructor
from kng_lms.throttles import ExamStartThrottle, PdfUploadThrottle
from .ai.services import PdfExtractionService
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import Http404, HttpResponse
from users.models import UserActivityLog
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')

class IDORLoggingMixin:
    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            if lookup_url_kwarg in self.kwargs:
                target_id = self.kwargs[lookup_url_kwarg]
                if self.queryset.model.objects.filter(**{self.lookup_field: target_id}).exists():
                    UserActivityLog.objects.create(
                        user=self.request.user if self.request.user.is_authenticated else None,
                        action=f'UNAUTHORIZED_{self.queryset.model.__name__.upper()}_ACCESS',
                        status='failure',
                        ip_address=get_client_ip(self.request),
                        target_type=self.queryset.model.__name__,
                        target_id=str(target_id)
                    )
            raise

class ExamViewSet(viewsets.ModelViewSet):
    queryset = Exam.objects.select_related('course', 'created_by', 'settings').prefetch_related('questions')
    serializer_class = ExamSerializer
    permission_classes = [IsAuthenticated, IsExamInstructorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        # Admin sees all
        if user.role == 'admin':
            return qs
            
        # Instructors see ONLY their own exams
        if user.role == 'instructor':
            return qs.filter(created_by=user)
            
        # Students only see published exams that are assigned to them
        from django.db.models import Q
        return qs.filter(
            Q(status__in=['scheduled', 'active', 'completed', 'archived']),
            Q(assign_to_all_enrolled=True, course__enrollments__student=user) | Q(assignments__student=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsExamInstructor])
    def publish(self, request, pk=None):
        exam = self.get_object()
        if exam.status != 'draft':
            return Response({'detail': 'Only draft exams can be published (set to active or scheduled).'}, status=status.HTTP_400_BAD_REQUEST)
            
        exam.status = 'active'
        exam.save()
        return Response({'status': 'Exam published and is now active.'})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsExamInstructor])
    def assign(self, request, pk=None):
        exam = self.get_object()
        
        assign_all = request.data.get('assign_all', False)
        if assign_all:
            exam.assign_to_all_enrolled = True
            exam.save()
            # Clear manual assignments when assigning to all
            from .models import ExamAssignment
            ExamAssignment.objects.filter(exam=exam).delete()
            return Response({'status': 'Exam assigned to all currently and future enrolled students.'})
            
        student_ids = request.data.get('student_ids', [])
        
        # Verify students are enrolled in the course
        from courses.models import CourseEnrollment
        enrolled_student_ids = CourseEnrollment.objects.filter(course=exam.course, student_id__in=student_ids).values_list('student_id', flat=True)
        
        if len(enrolled_student_ids) != len(student_ids):
            return Response({'error': 'Some students are not enrolled in the course.'}, status=status.HTTP_400_BAD_REQUEST)
            
        exam.assign_to_all_enrolled = False
        exam.save()
        
        from .models import ExamAssignment
        current_assignments = ExamAssignment.objects.filter(exam=exam)
        current_student_ids = set(current_assignments.values_list('student_id', flat=True))
        new_student_ids = set(student_ids)
        
        to_remove = current_student_ids - new_student_ids
        to_add = new_student_ids - current_student_ids
        
        if to_remove:
            ExamAssignment.objects.filter(exam=exam, student_id__in=to_remove).delete()
            
        for sid in to_add:
            ExamAssignment.objects.create(
                exam=exam,
                student_id=sid,
                assigned_by=request.user
            )
            
        return Response({'status': 'Assignments updated successfully.'})

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsExamInstructor])
    def attempts(self, request, pk=None):
        exam = self.get_object()
        attempts = exam.attempts.all()
        serializer = ExamAttemptSerializer(attempts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated, IsExamInstructor])
    def status_overview(self, request, pk=None):
        exam = self.get_object()
        
        assignments = exam.assignments.select_related('student').all()
        attempts = exam.attempts.select_related('student').all()
        
        attempts_dict = {a.student_id: a for a in attempts}
        
        results = []
        for assign in assignments:
            student = assign.student
            attempt = attempts_dict.get(student.id)
            
            if not attempt:
                status_str = 'NOT STARTED'
                started_at = None
                submitted_at = None
                score = None
                attempt_id = None
            else:
                attempt_id = attempt.id
                started_at = attempt.started_at
                submitted_at = attempt.submitted_at
                score = attempt.total_score if attempt.status == 'evaluated' else None
                
                if attempt.status in ['started', 'paused']:
                    status_str = 'IN PROGRESS'
                elif attempt.status == 'submitted':
                    status_str = 'SUBMITTED'
                elif attempt.status == 'evaluated':
                    status_str = 'EVALUATED'
                else:
                    status_str = attempt.status.upper()
                    
            results.append({
                'student_id': student.id,
                'student_name': f"{student.first_name} {student.last_name}".strip() or student.username,
                'status': status_str,
                'started_at': started_at,
                'submitted_at': submitted_at,
                'score': score,
                'attempt_id': attempt_id
            })
            
        summary = {
            'total_assigned': len(assignments),
            'not_started': sum(1 for r in results if r['status'] == 'NOT STARTED'),
            'in_progress': sum(1 for r in results if r['status'] == 'IN PROGRESS'),
            'submitted': sum(1 for r in results if r['status'] == 'SUBMITTED'),
            'evaluated': sum(1 for r in results if r['status'] == 'EVALUATED'),
        }
        
        return Response({
            'summary': summary,
            'students': results
        })


class ExamQuestionViewSet(viewsets.ModelViewSet):
    queryset = ExamQuestion.objects.all()
    serializer_class = ExamQuestionSerializer
    permission_classes = [IsAuthenticated, IsExamInstructorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            pass  # Admin sees all
        elif user.role == 'instructor':
            qs = qs.filter(exam__created_by=user)
        else:
            # Students only see questions of active exams
            qs = qs.filter(exam__status='active')
            
        # Manual filter for ?exam=ID
        exam_id = self.request.query_params.get('exam')
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
            
        return qs

    def perform_create(self, serializer):
        # Ensure only the instructor who owns the exam (or an admin) can create questions
        exam = serializer.validated_data.get('exam')
        if exam.created_by != self.request.user and self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to add questions to this exam.")
        serializer.save()


class ExamAttemptViewSet(viewsets.ModelViewSet):
    queryset = ExamAttempt.objects.select_related('exam', 'student')
    serializer_class = ExamAttemptSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # Disable direct POST creation. Attempts must be created via start_exam.
        return Response(
            {'detail': 'Method "POST" not allowed. Use /start_exam/ instead.'}, 
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            return qs
        elif user.role == 'instructor':
            # Instructors see attempts for their own exams
            return qs.filter(exam__created_by=user)
        else:
            # Students see their own attempts
            return qs.filter(student=user)

    @action(detail=False, methods=['post'], throttle_classes=[ExamStartThrottle])
    def start_exam(self, request):
        exam_id = request.data.get('exam_id')
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'detail': f'Exam not found (ID: {exam_id}).'}, status=status.HTTP_400_BAD_REQUEST)
            
        if exam.status != 'active':
            return Response({'detail': f'Exam is not active. Current status is {exam.status}.'}, status=status.HTTP_400_BAD_REQUEST)
            
        UserActivityLog.objects.create(
            user=request.user, action='exam_started', status='success', 
            ip_address=get_client_ip(request), target_type='Exam', target_id=str(exam.id)
        )
            
        # Check if attempt already exists
        attempt, created = ExamAttempt.objects.get_or_create(
            exam=exam,
            student=request.user,
            defaults={'status': 'started'}
        )
        
        if not created and attempt.status in ['submitted', 'evaluated', 'terminated']:
            return Response({'detail': 'You have already completed this exam.'}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = self.get_serializer(attempt)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        attempt = self.get_object()
        
        # Ensure only the student can submit their own attempt
        if attempt.student != request.user and request.user.role != 'admin':
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        if attempt.status in ['submitted', 'evaluated', 'terminated']:
            return Response({'detail': 'Attempt already submitted or terminated.'}, status=status.HTTP_400_BAD_REQUEST)
            
        attempt.status = 'submitted'
        attempt.submitted_at = timezone.now()
        attempt.save()
        
        UserActivityLog.objects.create(
            user=request.user, action='exam_submitted', status='success', 
            ip_address=get_client_ip(request), target_type='ExamAttempt', target_id=str(attempt.id)
        )
        
        return Response({'status': 'Exam submitted successfully.'})

    @action(detail=True, methods=['post'])
    def evaluate(self, request, pk=None):
        attempt = self.get_object()
        
        # Verify instructor authorization
        if attempt.exam.created_by != request.user and request.user.role != 'admin':
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        if attempt.status not in ['submitted', 'evaluated', 'terminated']:
            return Response({'detail': 'Attempt is not in a submittable state.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Verify all required questions have grading decisions
        # An answer must have marks_obtained set (explicit 0 is fine)
        questions = attempt.exam.questions.all()
        answers = attempt.answers.all()
        answers_dict = {a.question_id: a for a in answers}
        
        for q in questions:
            ans = answers_dict.get(q.id)
            if not ans or ans.marks_obtained is None:
                return Response({'detail': f'Question {q.order_number} is ungraded. Please grade all questions.'}, status=status.HTTP_400_BAD_REQUEST)
                
        total_score = sum(a.marks_obtained for a in answers if a.marks_obtained is not None)
        total_possible = sum(q.marks for q in questions)
        
        attempt.total_score = total_score
        attempt.status = 'evaluated'
        attempt.save()
        
        percentage = (total_score / total_possible * 100) if total_possible > 0 else 0
        
        ExamResult.objects.update_or_create(
            attempt=attempt,
            defaults={'percentage': percentage}
        )
        
        return Response({
            'status': 'Attempt evaluated successfully.',
            'total_score': total_score,
            'percentage': round(percentage, 2)
        })

    @action(detail=True, methods=['get'])
    def security_summary(self, request, pk=None):
        attempt = self.get_object()
        
        if request.user.role not in ['instructor', 'admin'] and request.user != attempt.student:
             return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
             
        violations = attempt.violations.all()
        snapshots = attempt.snapshots.all()
        
        counts = {}
        highest_severity = 'Low'
        severity_order = {'Low': 1, 'Medium': 2, 'High': 3}
        
        for v in violations:
            counts[v.violation_type] = counts.get(v.violation_type, 0) + 1
            if severity_order.get(v.severity, 0) > severity_order.get(highest_severity, 0):
                highest_severity = v.severity
                
        latest_snapshot = snapshots.last().image_url if snapshots.exists() else None
        
        return Response({
            'total_violations': violations.count(),
            'total_snapshots': snapshots.count(),
            'latest_snapshot': latest_snapshot,
            'highest_severity': highest_severity if violations.exists() else None,
            'counts_by_type': counts,
            'warning_count': attempt.warning_count,
            'violations': ExamViolationSerializer(violations, many=True).data,
            'snapshots': ExamSnapshotSerializer(snapshots, many=True).data,
        })



class ExamAnswerViewSet(IDORLoggingMixin, viewsets.ModelViewSet):
    queryset = ExamAnswer.objects.all()
    serializer_class = ExamAnswerSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        
        if user.role == 'admin':
            pass
        elif user.role == 'instructor':
            qs = qs.filter(attempt__exam__created_by=user)
        else:
            qs = qs.filter(attempt__student=user)
            
        # Manual filter for ?attempt=ID
        attempt_id = self.request.query_params.get('attempt')
        if attempt_id:
            qs = qs.filter(attempt_id=attempt_id)
            
        return qs

    def perform_create(self, serializer):
        # A student can only create answers for their own active attempt
        attempt = serializer.validated_data.get('attempt')
        if attempt.student != self.request.user and self.request.user.role not in ['admin', 'instructor']:
            raise serializers.ValidationError("You can only submit answers for your own attempt.")
        serializer.save()

    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        # Instructors can grade (update marks_obtained/feedback), students can only update answer text
        if self.request.user.role == 'instructor' or self.request.user.role == 'admin':
            if self.request.user.role == 'instructor' and self.get_object().attempt.exam.created_by != self.request.user:
                UserActivityLog.objects.create(
                    user=self.request.user, action='UNAUTHORIZED_GRADING_ATTEMPT', status='failure', 
                    ip_address=get_client_ip(self.request), target_type='ExamAnswer', target_id=str(self.get_object().id)
                )
                raise PermissionDenied("You do not have permission to grade this attempt.")
                
            marks = serializer.validated_data.get('marks_obtained', self.get_object().marks_obtained)
            if marks is not None:
                if marks < 0:
                    raise serializers.ValidationError({"marks_obtained": "Marks cannot be negative."})
                if marks > self.get_object().question.marks:
                    raise serializers.ValidationError({"marks_obtained": f"Marks cannot exceed {self.get_object().question.marks}."})
            
            serializer.save()
            UserActivityLog.objects.create(
                user=self.request.user, action='exam_graded', status='success', 
                ip_address=get_client_ip(self.request), target_type='ExamAnswer', target_id=str(self.get_object().id),
                metadata={'marks': marks}
            )
        else:
            # Student update: do not allow modifying marks
            serializer.save(marks_obtained=self.get_object().marks_obtained, instructor_feedback=self.get_object().instructor_feedback)


class ExamViolationViewSet(viewsets.ModelViewSet):
    queryset = ExamViolation.objects.all()
    serializer_class = ExamViolationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'admin':
            return qs
        if user.role == 'instructor':
            return qs.filter(attempt__exam__created_by=user)
        return qs.filter(attempt__student=user)
        
    def perform_update(self, serializer):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can modify violations.")
        serializer.save()
        
    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete violations.")
        instance.delete()
    
    def create(self, request, *args, **kwargs):
        attempt_id = request.data.get('attempt')
        try:
            attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        except ExamAttempt.DoesNotExist:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        severity = request.data.get('severity', 'Low')
        
        if severity in ['Medium', 'High']:
            attempt.warning_count += 1
            
        attempt.total_violations += 1
        attempt.save()
            
        # Check auto terminate
        threshold = attempt.exam.settings.auto_terminate_threshold
        if threshold and attempt.total_violations >= threshold:
            attempt.status = 'terminated'
            attempt.submitted_at = timezone.now()
            attempt.save()
                
        return super().create(request, *args, **kwargs)

import cloudinary.uploader

class ExamSnapshotViewSet(IDORLoggingMixin, viewsets.ModelViewSet):
    queryset = ExamSnapshot.objects.all()
    serializer_class = ExamSnapshotSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'admin':
            return qs
        if user.role == 'instructor':
            return qs.filter(attempt__exam__created_by=user)
        return qs.filter(attempt__student=user)
        
    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Snapshots cannot be modified.")
        
    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete snapshots.")
        instance.delete()
    
    def create(self, request, *args, **kwargs):
        attempt_id = request.data.get('attempt')
        try:
            attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        except ExamAttempt.DoesNotExist:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if file_obj.size > 5 * 1024 * 1024:
            return Response({'error': 'File is too large. Maximum size is 5MB.'}, status=status.HTTP_400_BAD_REQUEST)
            
        file_obj.seek(0)
        header = file_obj.read(12)
        is_valid_image = False
        if header.startswith(b'\xff\xd8\xff'): # JPEG
            is_valid_image = True
        elif header.startswith(b'\x89PNG\r\n\x1a\n'): # PNG
            is_valid_image = True
        elif header[0:4] == b'RIFF' and header[8:12] == b'WEBP': # WEBP
            is_valid_image = True
        
        if not is_valid_image:
            return Response({'error': 'Invalid image format. Allowed: JPEG, PNG, WEBP.'}, status=status.HTTP_400_BAD_REQUEST)
        file_obj.seek(0)
            
        try:
            upload_data = cloudinary.uploader.upload(file_obj, folder="exam_snapshots")
            image_url = upload_data.get('secure_url')
            
            snapshot = ExamSnapshot.objects.create(
                attempt=attempt,
                question_id=request.data.get('question'),
                image_url=image_url
            )
            return Response(ExamSnapshotSerializer(snapshot).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExamResultViewSet(IDORLoggingMixin, viewsets.ModelViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.role == 'admin':
            return qs
        if user.role == 'instructor':
            return qs.filter(attempt__exam__created_by=user)
        return qs.filter(attempt__student=user)
        
    def perform_create(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Results cannot be manually created via this endpoint.")
        
    def perform_update(self, serializer):
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Results cannot be modified.")
        
    def perform_destroy(self, instance):
        if self.request.user.role != 'admin':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admins can delete results.")
        instance.delete()

class PdfExtractView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    throttle_classes = [PdfUploadThrottle]

    def post(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'instructor']:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if not file_obj.name.lower().endswith('.pdf'):
            return Response({'error': 'Invalid file format. Only PDF is supported.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if file_obj.size > 10 * 1024 * 1024:  # 10MB limit
            return Response({'error': 'File is too large. Maximum size is 10MB.'}, status=status.HTTP_400_BAD_REQUEST)
            
        file_obj.seek(0)
        header = file_obj.read(5)
        if header != b'%PDF-':
            return Response({'error': 'Invalid PDF file content.'}, status=status.HTTP_400_BAD_REQUEST)
        file_obj.seek(0)
            
        try:
            result = PdfExtractionService.process_pdf(file_obj)
            
            exam_id = request.data.get('exam_id')
            if exam_id:
                try:
                    exam = Exam.objects.get(id=exam_id)
                    # Upload to Cloudinary
                    file_obj.seek(0)
                    upload_data = cloudinary.uploader.upload(file_obj, folder="exam_pdfs", resource_type="raw")
                    
                    ExamImportMetadata.objects.update_or_create(
                        exam=exam,
                        defaults={
                            'original_filename': file_obj.name,
                            'imported_by': request.user,
                            'file_url': upload_data.get('secure_url'),
                            'public_id': upload_data.get('public_id')
                        }
                    )
                except Exception as e:
                    # Append warning but don't fail extraction
                    result.setdefault('warnings', []).append(f"Cloudinary upload failed: {str(e)}")
                    
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ExamImportView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, *args, **kwargs):
        if request.user.role not in ['admin', 'instructor']:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        data = request.data
        course_id = data.get('course_id')
        title = data.get('title')
        duration_minutes = data.get('duration_minutes', 60)
        questions = data.get('questions', [])
        metadata = data.get('metadata', {})
        force_import = data.get('force_import', False)

        errors = []
        if not course_id: errors.append("course_id is required.")
        if not title: errors.append("Exam title is required.")
        if not questions: errors.append("At least one question is required.")

        from courses.models import Course
        try:
            if course_id:
                course = Course.objects.get(id=course_id)
                if request.user.role == 'instructor' and course.instructor != request.user:
                    errors.append("You do not have permission to add exams to this course.")
        except Course.DoesNotExist:
            errors.append("Selected course does not exist.")

        seen_numbers = set()
        seen_texts = {}
        for i, q in enumerate(questions):
            q_num = q.get('question_number')
            q_text = q.get('question_text', '').strip()
            marks = q.get('marks', 0)
            time_limit = q.get('time_limit')

            if not q_num: errors.append(f"Question at index {i} is missing a question number.")
            elif q_num in seen_numbers: errors.append(f"Duplicate question number detected: {q_num}")
            else: seen_numbers.add(q_num)

            if not q_text: 
                errors.append(f"Question {q_num} is missing text.")
            else:
                text_lower = q_text.lower()
                if text_lower in seen_texts:
                    seen_texts[text_lower].append(q_num)
                else:
                    seen_texts[text_lower] = [q_num]

            if marks <= 0: errors.append(f"Question {q_num} must have marks > 0.")
            if time_limit is not None and str(time_limit).strip() != '' and int(time_limit) < 0: 
                errors.append(f"Question {q_num} has an invalid time limit.")
                
        for text, q_nums in seen_texts.items():
            if len(q_nums) > 1:
                errors.append(f"Duplicate question text detected in questions: {', '.join(map(str, q_nums))}.")
        
        if not force_import and course_id and title:
            if Exam.objects.filter(course_id=course_id, title__iexact=title).exists():
                return Response({
                    'detail': 'Duplicate Detected',
                    'warnings': ['An exam with this exact title already exists in this course.']
                }, status=status.HTTP_409_CONFLICT)
                
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
            
        exam = Exam.objects.create(
            course=course,
            title=title,
            description=data.get('description', ''),
            duration_minutes=duration_minutes,
            created_by=request.user,
            status='draft'
        )
        
        ExamSettings.objects.create(exam=exam)
        
        ExamImportMetadata.objects.create(
            exam=exam,
            original_filename=metadata.get('original_filename', 'Unknown'),
            imported_by=request.user,
            import_source='PDF',
            extraction_version='1.0'
        )
        
        question_objects = []
        for q in questions:
            t_limit = q.get('time_limit')
            if str(t_limit).strip() == '': t_limit = None
            
            question_objects.append(ExamQuestion(
                exam=exam,
                question_text=q['question_text'],
                question_type=q.get('question_type', 'text'),
                marks=int(q['marks']),
                time_limit_seconds=t_limit,
                order_number=int(q['question_number'])
            ))
            
        ExamQuestion.objects.bulk_create(question_objects)
        
        return Response({'status': 'success', 'exam_id': exam.id}, status=status.HTTP_201_CREATED)

class ResultPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, *args, **kwargs):
        user = request.user
        try:
            attempt = ExamAttempt.objects.select_related('exam', 'student', 'result', 'exam__course').get(pk=pk)
        except ExamAttempt.DoesNotExist:
            return Response({'detail': 'Attempt not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Authorization check
        if user.role == 'student':
            if attempt.student != user:
                UserActivityLog.objects.create(
                    user=user,
                    action='UNAUTHORIZED_RESULT_PDF_ACCESS',
                    status='failure',
                    ip_address=get_client_ip(request),
                    target_type='ExamAttempt',
                    target_id=str(pk)
                )
                return Response({'detail': 'You are not authorized to access this result.'}, status=status.HTTP_403_FORBIDDEN)
        elif user.role == 'instructor':
            if attempt.exam.created_by != user:
                UserActivityLog.objects.create(
                    user=user,
                    action='UNAUTHORIZED_RESULT_PDF_ACCESS',
                    status='failure',
                    ip_address=get_client_ip(request),
                    target_type='ExamAttempt',
                    target_id=str(pk)
                )
                return Response({'detail': 'You are not authorized to access this result.'}, status=status.HTTP_403_FORBIDDEN)

        # Verify attempt is submitted or evaluated
        if attempt.status not in ['submitted', 'evaluated']:
            return Response({'detail': 'Result PDF is only available for submitted or evaluated attempts.'}, status=status.HTTP_400_BAD_REQUEST)

        # Build PDF using ReportLab
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=50
        )

        def add_footer(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            canvas.setFillColor(colors.HexColor('#64748b'))
            footer_text = f"KLS Tech Campus Examination Portal | A project of KNG Logics Solution | Page {doc.page}"
            canvas.drawCentredString(doc.pagesize[0]/2.0, 20, footer_text)
            canvas.restoreState()

        styles = getSampleStyleSheet()
        
        # Typography
        title_style = ParagraphStyle('DocTitle', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=colors.HexColor('#0f172a'), spaceAfter=4, alignment=1)
        subtitle_style = ParagraphStyle('DocSubTitle', parent=styles['Normal'], fontName='Helvetica', fontSize=12, leading=16, textColor=colors.HexColor('#475569'), spaceAfter=20, alignment=1)
        h2_style = ParagraphStyle('SectionHeading', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=14, leading=18, textColor=colors.HexColor('#0f172a'), spaceBefore=15, spaceAfter=8)
        body_style = ParagraphStyle('Body', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor('#334155'))
        body_bold = ParagraphStyle('BodyBold', parent=body_style, fontName='Helvetica-Bold', textColor=colors.HexColor('#0f172a'))
        
        code_style = ParagraphStyle('CodeText', parent=styles['Normal'], fontName='Courier', fontSize=9, leading=12, textColor=colors.HexColor('#1e293b'), backColor=colors.HexColor('#f8fafc'), borderPadding=8, spaceBefore=6, spaceAfter=6, borderColor=colors.HexColor('#e2e8f0'), borderWidth=0.5, borderRadius=4)
        feedback_style = ParagraphStyle('Feedback', parent=body_style, fontName='Helvetica-Oblique', textColor=colors.HexColor('#0284c7'), backColor=colors.HexColor('#f0f9ff'), borderPadding=8, spaceBefore=4, spaceAfter=10, borderColor=colors.HexColor('#bae6fd'), borderWidth=0.5, borderRadius=4)

        story = []

        # Logo
        import os
        from django.conf import settings
        logo_path = os.path.join(settings.BASE_DIR, '..', 'exam_frontend', 'public', 'logo.png')
        if os.path.exists(logo_path):
            img = Image(logo_path, width=80, height=80)
            story.append(img)
            story.append(Spacer(1, 10))

        # Header
        story.append(Paragraph("KLS TECH CAMPUS", title_style))
        story.append(Paragraph("EXAMINATION RESULT REPORT", ParagraphStyle('ReportTitle', parent=title_style, fontSize=16, textColor=colors.HexColor('#334155'))))
        story.append(Paragraph("A project of KNG Logics Solution", subtitle_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=20))

        # Data preparation
        course_name = attempt.exam.course.title if (attempt.exam and attempt.exam.course) else 'N/A'
        result_obj = getattr(attempt, 'result', None)
        percentage_str = f"{result_obj.percentage:.1f}%" if result_obj else "N/A"
        from django.db.models import Sum
        obtained_marks_val = attempt.answers.aggregate(Sum('marks_obtained'))['marks_obtained__sum'] or 0
        exam_questions = attempt.exam.questions.all()
        total_possible_marks = sum(q.marks for q in exam_questions)

        student_name = attempt.student.get_full_name() or attempt.student.username
        started_str = attempt.started_at.strftime("%Y-%m-%d %H:%M") if attempt.started_at else "N/A"
        submitted_str = attempt.submitted_at.strftime("%Y-%m-%d %H:%M") if attempt.submitted_at else "In Progress"

        # Glass-inspired Summary Card
        summary_data = [
            [Paragraph("<b>Student:</b>", body_style), Paragraph(student_name, body_style),
             Paragraph("<b>Status:</b>", body_style), Paragraph(attempt.status.title(), body_bold)],
            [Paragraph("<b>Course:</b>", body_style), Paragraph(course_name, body_style),
             Paragraph("<b>Started:</b>", body_style), Paragraph(started_str, body_style)],
            [Paragraph("<b>Exam:</b>", body_style), Paragraph(attempt.exam.title, body_style),
             Paragraph("<b>Submitted:</b>", body_style), Paragraph(submitted_str, body_style)]
        ]
        
        summary_table = Table(summary_data, colWidths=[60, 200, 60, 195])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.transparent),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 20))

        # Hero Score Section
        score_data = [
            [Paragraph("<b>FINAL SCORE</b>", ParagraphStyle('ScoreHead', parent=body_style, fontSize=12, alignment=1, textColor=colors.HexColor('#64748b')))],
            [Paragraph(f"{obtained_marks_val} / {total_possible_marks}", ParagraphStyle('ScoreVal', parent=title_style, fontSize=28, textColor=colors.HexColor('#0f172a')))],
            [Paragraph(f"{percentage_str}", ParagraphStyle('ScorePerc', parent=title_style, fontSize=20, textColor=colors.HexColor('#3b82f6')))]
        ]
        score_table = Table(score_data, colWidths=[515])
        score_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
            ('PADDING', (0,0), (-1,-1), 12),
            ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6)
        ]))
        story.append(score_table)
        story.append(Spacer(1, 25))

        # Proctoring Summary
        story.append(Paragraph("PROCTORING SUMMARY", h2_style))
        snapshots_count = attempt.snapshots.count()
        violations_count = attempt.violations.count()
        v_types = list(attempt.violations.values_list('violation_type', flat=True))
        v_summary_str = ", ".join([f"{v}: {v_types.count(v)}" for v in set(v_types)]) if v_types else "None recorded"

        proctor_data = [
            [Paragraph("<b>Snapshots:</b>", body_style), Paragraph(str(snapshots_count), body_style),
             Paragraph("<b>Warnings:</b>", body_style), Paragraph(str(attempt.warning_count), body_style)],
            [Paragraph("<b>Violations:</b>", body_style), Paragraph(str(violations_count), body_style),
             Paragraph("<b>Details:</b>", body_style), Paragraph(v_summary_str, body_style)]
        ]
        proctor_table = Table(proctor_data, colWidths=[70, 187, 70, 188])
        proctor_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ffffff')),
            ('PADDING', (0,0), (-1,-1), 6),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ]))
        story.append(proctor_table)
        story.append(Spacer(1, 25))

        # Question by Question Section
        story.append(Paragraph("DETAILED RESPONSES", h2_style))

        questions_list = list(exam_questions.order_by('order_number'))
        answers_map = {ans.question_id: ans for ans in attempt.answers.all()}

        for idx, q in enumerate(questions_list, 1):
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#e2e8f0'), spaceBefore=10, spaceAfter=10))
            
            ans = answers_map.get(q.id)
            marks_got = ans.marks_obtained if (ans and ans.marks_obtained is not None) else "Not Graded"
            feedback = ans.instructor_feedback if (ans and ans.instructor_feedback) else None

            # Q Header
            q_head = Table([
                [Paragraph(f"<b>QUESTION {idx}</b> &nbsp;&nbsp;|&nbsp;&nbsp; {q.question_type.upper()}", body_bold),
                 Paragraph(f"<b>Marks:</b> {marks_got} / {q.marks}", ParagraphStyle('QMarks', parent=body_style, alignment=2))]
            ], colWidths=[315, 200])
            q_head.setStyle(TableStyle([('PADDING', (0,0), (-1,-1), 0)]))
            story.append(q_head)
            story.append(Spacer(1, 8))
            
            # Prompt
            clean_q_text = q.question_text.replace('\n', '<br/>')
            story.append(Paragraph(f"<b>Question:</b><br/>{clean_q_text}", body_style))
            story.append(Spacer(1, 8))

            # Answer
            if q.question_type == 'code':
                code_content = (ans.answer_text if ans else '').replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br/>')
                code_text = code_content if code_content.strip() else "<i>No code submitted.</i>"
                story.append(Paragraph("<b>Student Answer:</b>", body_style))
                story.append(Paragraph(code_text, code_style))
            elif q.question_type == 'audio':
                transcript = ans.transcript_text if (ans and ans.transcript_text) else (ans.answer_text if ans and not ans.answer_text.startswith('http') else '')
                audio_note = "<i>[Audio Recording Available in Portal]</i>" if (ans and ans.answer_text and ans.answer_text.startswith('http')) else ""
                story.append(Paragraph(f"<b>Student Answer (Transcript):</b> {audio_note}", body_style))
                story.append(Paragraph(transcript or '<i>Transcript not available.</i>', body_style))
                story.append(Spacer(1, 4))
            else:
                text_ans = (ans.answer_text if ans else '') or '<i>No answer submitted.</i>'
                formatted_ans = text_ans.replace('\n', '<br/>')
                story.append(Paragraph(f"<b>Student Answer:</b><br/>{formatted_ans}", body_style))

            story.append(Spacer(1, 6))
            
            # Feedback
            if feedback:
                story.append(Paragraph(f"<b>Instructor Feedback:</b><br/>{feedback}", feedback_style))

        # Build with page templates for header/footer
        doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
        buffer.seek(0)

        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Exam_Result_Attempt_{attempt.id}.pdf"'
        return response


