from django.db.models import Count
from .models import Course, CourseEnrollment, Category

def get_suggested_courses(user, limit=4):
    """
    Suggests courses based on the user's enrolled categories.
    If no enrollments, suggests the most recent approved courses.
    """
    # 1. Get categories of courses the user is already enrolled in
    enrolled_course_ids = CourseEnrollment.objects.filter(student=user).values_list('course_id', flat=True)
    enrolled_categories = Category.objects.filter(courses__id__in=enrolled_course_ids).distinct()
    
    # 2. Find approved courses in these categories that the user is NOT enrolled in
    suggestions = Course.objects.filter(
        moderation_status='approved',
        category__in=enrolled_categories
    ).exclude(id__in=enrolled_course_ids).distinct()[:limit]
    
    suggested_count = suggestions.count()
    
    # 3. Fallback: If suggestions are fewer than the limit, fill with newest approved courses
    if suggested_count < limit:
        remaining_slots = limit - suggested_count
        additional_courses = Course.objects.filter(
            moderation_status='approved'
        ).exclude(
            id__in=enrolled_course_ids
        ).exclude(
            id__in=suggestions.values_list('id', flat=True)
        ).order_by('-created_at')[:remaining_slots]
        
        # Combine querysets (convert to list to avoid union issues with different orderings)
        suggestions = list(suggestions) + list(additional_courses)
    
    return suggestions
