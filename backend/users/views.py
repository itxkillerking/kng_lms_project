from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView as BaseTokenObtainPairView
from .serializers import UserSerializer, RegisterSerializer, UserActivityLogSerializer
from .models import User, UserActivityLog, UserOTP
from .permissions import IsSuperAdmin
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
    permission_classes = [IsSuperAdmin]

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
        user.role = new_role
        user.save()
        return Response({'status': f'Role changed to {new_role}'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        user = self.get_object()
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
        logs = UserActivityLog.objects.all()[:200]
        serializer = UserActivityLogSerializer(logs, many=True)
        return Response(serializer.data)


class CustomTokenObtainPairView(BaseTokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            try:
                user = User.objects.get(username=request.data.get('username'))
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
