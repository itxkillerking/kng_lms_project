from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.http import HttpResponse
from .models import Certificate
from .serializers import CertificateSerializer

import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor

class CertificateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Certificate.objects.all()
    serializer_class = CertificateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return self.queryset.none()
        if self.request.user.is_student:
            return self.queryset.filter(user=self.request.user)
        return self.queryset

    @action(detail=False, methods=['post'])
    def claim(self, request):
        """Allows a student to proactively claim their certificate if eligible."""
        course_id = request.data.get('course_id')
        if not course_id:
            return Response({'error': 'course_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        from courses.models import Course
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)
            
        from courses.utils import check_and_trigger_graduation
        progress, created = check_and_trigger_graduation(request.user, course)
        
        certificate = Certificate.objects.filter(user=request.user, course=course).first()
        if certificate:
            return Response({
                'id': certificate.id,
                'progress': progress,
                'created': created
            })
        
        # If no certificate, identify what's missing
        from courses.models import CourseEnrollment
        from progress.models import UserLessonProgress
        from submissions.models import QuizAttempt, AssignmentSubmission
        
        enrollment = CourseEnrollment.objects.get(student=request.user, course=course)
        
        missing_lessons = course.total_lessons - UserLessonProgress.objects.filter(user=request.user, lesson__module__course=course, is_complete=True).count()
        missing_quizzes = course.total_quizzes - QuizAttempt.objects.filter(user=request.user, quiz__module__course=course, passed=True).values('quiz').distinct().count()
        missing_assignments = course.total_assignments - AssignmentSubmission.objects.filter(user=request.user, assignment__module__course=course).values('assignment').distinct().count()

        return Response({
            'error': 'Graduation requirements not met.',
            'progress': progress,
            'missing': {
                'lessons': max(0, missing_lessons),
                'quizzes': max(0, missing_quizzes),
                'assignments': max(0, missing_assignments)
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        certificate = self.get_object()
        
        # Create a file-like buffer to receive PDF data
        buffer = io.BytesIO()
        
        # Create the PDF object, using the buffer as its "file."
        # Using Landscape A4-ish size
        p = canvas.Canvas(buffer, pagesize=landscape(letter))
        width, height = landscape(letter)
        
        # --- Background Layer ---
        # Rich Deep Navy / Charcoal Base
        p.setFillColor(HexColor("#020204"))
        p.rect(0, 0, width, height, stroke=0, fill=1)
        
        # Subtle Gradient-like glow (Circle)
        p.setFillColor(HexColor("#0A84FF"), alpha=0.05)
        p.circle(width/2.0, height/2.0, 300, stroke=0, fill=1)
        
        # --- Border Architecture ---
        # Main Outer Gold Border (Double Line)
        p.setStrokeColor(HexColor("#D4AF37")) # Metallic Gold
        p.setLineWidth(2)
        p.rect(30, 30, width-60, height-60, stroke=1, fill=0)
        
        p.setLineWidth(0.5)
        p.rect(35, 35, width-70, height-70, stroke=1, fill=0)
        
        # Decorative Corners
        p.setLineWidth(4)
        corner_size = 40
        # Top Left
        p.line(30, height-30, 30+corner_size, height-30)
        p.line(30, height-30, 30, height-30-corner_size)
        # Top Right
        p.line(width-30, height-30, width-30-corner_size, height-30)
        p.line(width-30, height-30, width-30, height-30-corner_size)
        # Bottom Left
        p.line(30, 30, 30+corner_size, 30)
        p.line(30, 30, 30, 30+corner_size)
        # Bottom Right
        p.line(width-30, 30, width-30-corner_size, 30)
        p.line(width-30, 30, width-30, 30+corner_size)

        # --- Content Layer ---
        # Header Badge
        p.setFillColor(HexColor("#0A84FF"))
        p.setFont("Helvetica-Bold", 10)
        p.drawCentredString(width/2.0, height - 80, "OFFICIAL KLS TECH CAMPUS GRADUATION")
        
        # Main Title
        p.setFillColor(HexColor("#FFFFFF"))
        p.setFont("Helvetica-Bold", 52)
        p.drawCentredString(width/2.0, height - 160, "CERTIFICATE")
        p.setFont("Helvetica-Bold", 32)
        p.drawCentredString(width/2.0, height - 205, "OF COMPLETION")
        
        # Divider Line
        p.setStrokeColor(HexColor("#FFFFFF"), alpha=0.1)
        p.setLineWidth(1)
        p.line(width/2.0 - 150, height - 235, width/2.0 + 150, height - 235)
        
        # Attestation Text
        p.setFillColor(HexColor("#94A3B8"))
        p.setFont("Helvetica", 16)
        p.drawCentredString(width/2.0, height - 270, "This high-honor document is proudly presented to")
        
        # Student Name (Large and Bright)
        student_name = (certificate.user.get_full_name() or certificate.user.username).upper()
        p.setFillColor(HexColor("#FFFFFF"))
        p.setFont("Helvetica-Bold", 42)
        p.drawCentredString(width/2.0, height - 330, student_name)
        
        # Course Description
        p.setFillColor(HexColor("#94A3B8"))
        p.setFont("Helvetica", 16)
        p.drawCentredString(width/2.0, height - 380, "for the successful mastery and professional completion of")
        
        # Course Title
        p.setFillColor(HexColor("#BF5AF2")) # Accent Purple
        p.setFont("Helvetica-Bold", 28)
        p.drawCentredString(width/2.0, height - 425, certificate.course.title)
        
        # --- Signature and Seal ---
        # Bottom Left: Date
        p.setFillColor(HexColor("#64748B"))
        p.setFont("Helvetica-Bold", 10)
        p.drawString(80, 110, "ISSUE DATE")
        p.setFillColor(HexColor("#FFFFFF"))
        p.setFont("Helvetica", 12)
        p.drawString(80, 90, certificate.issue_date.strftime('%B %d, %Y'))
        
        # Bottom Center: Seal Placeholder (Circle with text)
        p.setStrokeColor(HexColor("#D4AF37"))
        p.setFillColor(HexColor("#D4AF37"), alpha=0.1)
        p.circle(width/2.0, 100, 50, stroke=1, fill=1)
        p.setFillColor(HexColor("#D4AF37"))
        p.setFont("Helvetica-Bold", 12)
        p.drawCentredString(width/2.0, 105, "KLS")
        p.setFont("Helvetica-Bold", 8)
        p.drawCentredString(width/2.0, 90, "VERIFIED")
        
        # Bottom Right: ID
        p.setFillColor(HexColor("#64748B"))
        p.setFont("Helvetica-Bold", 10)
        p.drawRightString(width - 80, 110, "CERTIFICATE ID")
        p.setFillColor(HexColor("#FFFFFF"))
        p.setFont("Helvetica", 12)
        p.drawRightString(width - 80, 90, certificate.certificate_id)
        
        # Bottom Branding
        p.setFillColor(HexColor("#334155"))
        p.setFont("Helvetica-Bold", 9)
        p.drawCentredString(width/2.0, 45, "KLS TECH CAMPUS | A PROJECT OF KNG LOGICS SOLUTIONS")

        # Close the PDF object cleanly, and we're done.
        p.showPage()
        p.save()
        
        # FileResponse sets the Content-Disposition header so that browsers
        # present the option to save the file.
        buffer.seek(0)
        
        response = HttpResponse(buffer, content_type='application/pdf')
        filename = f"KLS_Certificate_{certificate.certificate_id}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response
