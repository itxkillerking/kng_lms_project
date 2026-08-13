from rest_framework import permissions

class IsExamInstructor(permissions.BasePermission):
    """
    Custom permission to only allow the instructor who created the exam (or an admin) to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request for published exams (handled in views),
        # but for write permissions, we check the instructor.
        
        # If it's a safe method (GET, HEAD, OPTIONS), the view's get_queryset will handle filtering.
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to the instructor who created the exam or admin.
        is_instructor = hasattr(obj, 'created_by') and obj.created_by == request.user
        is_admin = request.user and request.user.is_authenticated and request.user.role == 'admin'
        
        return is_instructor or is_admin

class IsExamInstructorOrReadOnly(permissions.BasePermission):
    """
    Allows read-only access for anyone (subject to view filtering),
    but restricts write access to the exam's instructor or admin.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # To find the exam instructor, we need to traverse from the current object.
        # This will be overridden or specifically used depending on the model (Exam vs ExamQuestion).
        if hasattr(obj, 'created_by'):
            return obj.created_by == request.user or request.user.role == 'admin'
        elif hasattr(obj, 'exam'):
            return obj.exam.created_by == request.user or request.user.role == 'admin'
            
        return False
