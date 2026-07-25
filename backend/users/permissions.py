from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    """
    Allows access only to users with the 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin)

class IsStaffOrAdmin(permissions.BasePermission):
    """
    Allows access to users with the 'staff' or 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ['staff', 'admin'])

class IsInstructorOrAdmin(permissions.BasePermission):
    """
    Allows access to users with the 'instructor' or 'admin' role.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_instructor)
