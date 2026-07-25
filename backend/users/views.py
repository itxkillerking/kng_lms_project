from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from .serializers import UserSerializer, RegisterSerializer, UserActivityLogSerializer, SuspensionRequestSerializer, InstructorRevokeRequestSerializer
from .models import User, UserActivityLog, UserOTP, SuspensionRequest, InstructorRevokeRequest
from .permissions import IsSuperAdmin, IsStaffOrAdmin
from .communication import (
    send_registration_email,
    send_otp_email,
    generate_otp,
)
from django.utils import timezone


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        # Send welcome email on registration
        if user.email:
            send_registration_email(user)


class CurrentUserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [IsStaffOrAdmin]

    def destroy(self, request, *args, **kwargs):
        target_user = self.get_object()
        if request.user.role == 'staff':
            if target_user.role == 'admin':
                return Response({'error': 'Staff cannot delete an admin.'}, status=status.HTTP_403_FORBIDDEN)
            if target_user.role == 'instructor':
                return Response({'error': 'Staff cannot delete an instructor. Submit a revocation request.'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def approve_teacher(self, request, pk=None):
        user = self.get_object()
        user.is_verified_teacher = True
        user.save()
        return Response({'status': 'Teacher approved'})

    @action(detail=True, methods=['post'])
    def disapprove_teacher(self, request, pk=None):
        user = self.get_object()
        user.is_verified_teacher = False
        user.save()
        return Response({'status': 'Teacher disapproved'})

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        user = self.get_object()
        new_role = request.data.get('role')
        if new_role not in dict(User.ROLE_CHOICES):
            return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            
        if request.user.role == 'staff':
            if user.role == 'admin' or new_role == 'admin':
                return Response({'error': 'Staff cannot assign or modify admin roles.'}, status=status.HTTP_403_FORBIDDEN)
            if user.role == 'instructor' or new_role == 'instructor':
                return Response({'error': 'Staff cannot modify instructor roles.'}, status=status.HTTP_403_FORBIDDEN)

        user.role = new_role
        user.save()
        return Response({'status': f'Role changed to {new_role}'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        user = self.get_object()
        if request.user.role == 'staff':
            if user.role == 'admin':
                return Response({'error': 'Staff cannot suspend an admin.'}, status=status.HTTP_403_FORBIDDEN)
            if user.role == 'instructor':
                return Response({'error': 'Staff cannot suspend an instructor directly. Submit a request.'}, status=status.HTTP_403_FORBIDDEN)
                
        user.account_status = 'suspended'
        user.save()
        return Response({'status': 'user suspended'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.account_status = 'active'
        user.save()
        return Response({'status': 'user activated'})

    @action(detail=False, methods=['get'])
    def activity_logs(self, request):
        if request.user.role == 'staff':
            return Response({'error': 'Staff cannot view activity logs.'}, status=status.HTTP_403_FORBIDDEN)
        logs = UserActivityLog.objects.all()[:200]
        serializer = UserActivityLogSerializer(logs, many=True)
        return Response(serializer.data)

class InstructorRevokeRequestViewSet(viewsets.ModelViewSet):
    queryset = InstructorRevokeRequest.objects.all()
    serializer_class = InstructorRevokeRequestSerializer
    permission_classes = [IsStaffOrAdmin]

    def perform_create(self, serializer):
        serializer.save(staff_member=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        revoke_req = self.get_object()
        if revoke_req.status != 'pending':
            return Response({'error': 'Request already processed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Revoke the instructor
        instructor = revoke_req.instructor
        instructor.role = 'student'
        instructor.is_verified_teacher = False
        instructor.save()
        
        revoke_req.status = 'approved'
        revoke_req.resolved_at = timezone.now()
        revoke_req.save()
        return Response({'status': 'Instructor revoked successfully'})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reject(self, request, pk=None):
        revoke_req = self.get_object()
        if revoke_req.status != 'pending':
            return Response({'error': 'Request already processed'}, status=status.HTTP_400_BAD_REQUEST)
            
        revoke_req.status = 'rejected'
        revoke_req.resolved_at = timezone.now()
        revoke_req.save()
        return Response({'status': 'Revocation request rejected'})


class CustomTokenObtainPairView(BaseTokenObtainPairView):
    permission_classes = (AllowAny,)

    def options(self, request, *args, **kwargs):
        return Response(status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = User.objects.get(username=request.data.get('username'))
                
                # Check for Suspended Account
                if user.account_status == 'suspended':
                    return Response(
                        {'detail': 'Your account is suspended cannot login', 'code': 'account_suspended'},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                UserActivityLog.objects.create(user=user, action='login')
            except User.DoesNotExist:
                pass
        return response


class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        UserActivityLog.objects.create(user=request.user, action='logout')
        return Response({"status": "Successfully logged out"}, status=status.HTTP_200_OK)


# ── OTP Endpoints ──────────────────────────────────────────────

class RequestOTPView(generics.GenericAPIView):
    """Request an OTP code for password reset."""
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        purpose = request.data.get('purpose', 'password_reset')
        
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Don't reveal whether user exists for security
            return Response({'status': 'If an account with that email exists, an OTP has been sent.'})

        # Invalidate previously unused OTPs for this user/purpose
        UserOTP.objects.filter(user=user, purpose=purpose, is_used=False).update(is_used=True)

        # Generate and save new OTP
        code = generate_otp()
        UserOTP.objects.create(
            user=user,
            code=code,
            purpose=purpose,
            expires_at=timezone.now() + timezone.timedelta(minutes=10),
        )

        # Send OTP via email
        send_otp_email(user, code)

        return Response({'status': 'If an account with that email exists, an OTP has been sent.'})


class VerifyOTPView(generics.GenericAPIView):
    """Verify an OTP code and allow password reset."""
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('code')
        new_password = request.data.get('new_password')
        purpose = request.data.get('purpose', 'password_reset')
        
        if not all([email, code]):
            return Response({'error': 'Email and code are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # Find matching unexpired, unused OTP
        otp = UserOTP.objects.filter(
            user=user,
            code=code,
            purpose=purpose,
            is_used=False,
            expires_at__gt=timezone.now(),
        ).first()

        if not otp:
            return Response({'error': 'Invalid or expired OTP code'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark OTP as used
        otp.is_used = True
        otp.save()

        if purpose == 'password_reset':
            if not new_password:
                return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({'status': 'Password has been reset successfully'})

        elif purpose == 'email_verify':
            user.email_verified = True
            user.save()
            return Response({'status': 'Email verified successfully'})

        return Response({'status': 'OTP verified successfully'})

# ── Instructor Students and Suspension Requests Endpoint ──────────────────

from courses.models import CourseEnrollment

class InstructorStudentsView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'instructor':
            return Response([])
        
        # Get all enrollments for courses taught by this instructor
        enrollments = CourseEnrollment.objects.filter(
            course__instructor=request.user
        ).select_related('student', 'course')
        
        data = []
        for e in enrollments:
            data.append({
                'enrollment_id': e.id,
                'student_id': e.student.id,
                'student_name': f"{e.student.first_name} {e.student.last_name}".strip() or e.student.username,
                'student_username': e.student.username,
                'student_email': e.student.email,
                'course_title': e.course.title,
                'course_id': e.course.id,
                'progress': e.progress_percentage,
                'enrolled_at': e.enrolled_at,
                'account_status': e.student.account_status,
            })
        return Response(data)

from .serializers import UserSerializer, RegisterSerializer, UserActivityLogSerializer, SuspensionRequestSerializer, PublicProfileSerializer

class PublicProfileView(generics.RetrieveAPIView):
    """Retrieve basic biographical details about any user."""
    queryset = User.objects.all()
    serializer_class = PublicProfileSerializer
    permission_classes = [AllowAny]

class SuspensionRequestViewSet(viewsets.ModelViewSet):
    serializer_class = SuspensionRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return SuspensionRequest.objects.none()
        if self.request.user.role == 'admin':
            return SuspensionRequest.objects.all().order_by('-created_at')
        return SuspensionRequest.objects.filter(instructor=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def approve(self, request, pk=None):
        req = self.get_object()
        req.status = 'approved'
        req.resolved_at = timezone.now()
        req.save()
        
        # Automatically suspend student account
        student = req.student
        student.account_status = 'suspended'
        student.save()
        
        return Response({'status': 'Approved and User Suspended'})

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdmin])
    def reject(self, request, pk=None):
        req = self.get_object()
        req.status = 'rejected'
        req.resolved_at = timezone.now()
        req.save()
        
        return Response({'status': 'Rejected'})
