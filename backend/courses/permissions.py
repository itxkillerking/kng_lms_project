from rest_framework import permissions

class IsCourseInstructorOrReadOnly(permissions.BasePermission):
    """
    Object-level permission to only allow the instructor of the course to edit it.
    Assumes the model instance has an `instructor` attribute or a `course` attribute with an `instructor`.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Instance must have an attribute named `instructor` or `course`
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user or request.user.role == 'admin'
        elif hasattr(obj, 'course'):
            return obj.course.instructor == request.user or request.user.role == 'admin'
        elif hasattr(obj, 'module'):
            return obj.module.course.instructor == request.user or request.user.role == 'admin'
        return False
