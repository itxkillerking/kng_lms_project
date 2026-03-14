from django.utils import timezone
from .models import CourseEnrollment
from certificates.models import Certificate

def check_and_trigger_graduation(user, course):
    """
    Checks if a student has met all completion criteria for a course.
    If 100% is reached and no certificate exists, one is generated.
    Returns: (progress_percentage, certificate_generated_boolean)
    """
    enrollment = CourseEnrollment.objects.filter(student=user, course=course).first()
    if not enrollment:
        return 0, False
    
    progress = enrollment.progress_percentage
    certificate_generated = False
    
    if progress == 100:
        if not Certificate.objects.filter(user=user, course=course).exists():
            Certificate.objects.create(
                user=user,
                course=course,
                issue_date=timezone.now().date()
            )
            certificate_generated = True
            
    return progress, certificate_generated
