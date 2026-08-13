from rest_framework import viewsets, status
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
from .ai.services import PdfExtractionService
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

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
            
        # Instructors see their own exams, plus all published exams
        if user.role == 'instructor':
            from django.db.models import Q
            return qs.filter(Q(created_by=user) | Q(status__in=['scheduled', 'active', 'completed', 'archived']))
            
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


class ExamQuestionViewSet(viewsets.ModelViewSet):
    queryset = ExamQuestion.objects.all()
    serializer_class = ExamQuestionSerializer
    permission_classes = [IsAuthenticated, IsExamInstructorOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # Ensure students only see questions of active exams
        user = self.request.user
        if user.role not in ['admin', 'instructor']:
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

    @action(detail=False, methods=['post'])
    def start_exam(self, request):
        exam_id = request.data.get('exam_id')
        try:
            exam = Exam.objects.get(id=exam_id, status='active')
        except Exam.DoesNotExist:
            return Response({'detail': 'Exam not found or not active.'}, status=status.HTTP_404_NOT_FOUND)
            
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
        
        return Response({'status': 'Exam submitted successfully.'})

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



class ExamAnswerViewSet(viewsets.ModelViewSet):
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
        # Instructors can grade (update marks_obtained/feedback), students can only update answer text
        if self.request.user.role == 'instructor' or self.request.user.role == 'admin':
            serializer.save()
        else:
            # Student update: do not allow modifying marks
            serializer.save(marks_obtained=self.get_object().marks_obtained, instructor_feedback=self.get_object().instructor_feedback)


class ExamViolationViewSet(viewsets.ModelViewSet):
    queryset = ExamViolation.objects.all()
    serializer_class = ExamViolationSerializer
    permission_classes = [IsAuthenticated]
    
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

class ExamSnapshotViewSet(viewsets.ModelViewSet):
    queryset = ExamSnapshot.objects.all()
    serializer_class = ExamSnapshotSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    
    def create(self, request, *args, **kwargs):
        attempt_id = request.data.get('attempt')
        try:
            attempt = ExamAttempt.objects.get(id=attempt_id, student=request.user)
        except ExamAttempt.DoesNotExist:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)
            
        file_obj = request.FILES.get('image')
        if not file_obj:
            return Response({'error': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)
            
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

class ExamResultViewSet(viewsets.ModelViewSet):
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]

class PdfExtractView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

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
            
        try:
            result = PdfExtractionService.process_pdf(file_obj)
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
