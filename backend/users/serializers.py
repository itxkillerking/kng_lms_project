from rest_framework import serializers
from .models import User, UserActivityLog, SuspensionRequest, InstructorRevokeRequest

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'bio', 'profile_picture', 'phone_number', 'instructor_title', 'experience', 'joined_at', 'is_verified_teacher', 'account_status', 'email_verified', 'website_url', 'linkedin_url')
        read_only_fields = ('joined_at', 'role', 'is_verified_teacher', 'account_status', 'email_verified') # role is now manageable via admin actions

    def to_internal_value(self, data):
        # Log privilege escalation attempts before DRF strips read_only_fields
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            restricted_fields = ['role', 'is_verified_teacher', 'account_status']
            attempted = [f for f in restricted_fields if f in data]
            if attempted:
                # Log it
                x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
                ip = x_forwarded_for.split(',')[0] if x_forwarded_for else request.META.get('REMOTE_ADDR')
                UserActivityLog.objects.create(
                    user=request.user,
                    action='PRIVILEGE_ESCALATION_ATTEMPT',
                    status='failure',
                    ip_address=ip,
                    target_type='User',
                    target_id=str(request.user.id),
                    metadata={'attempted_fields': attempted}
                )
        return super().to_internal_value(data)

class UserActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserActivityLog
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='student' # Default role
        )
        return user

class SuspensionRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)

    class Meta:
        model = SuspensionRequest
        fields = '__all__'
        read_only_fields = ('instructor', 'status', 'created_at', 'resolved_at')

class InstructorRevokeRequestSerializer(serializers.ModelSerializer):
    staff_name = serializers.CharField(source='staff_member.get_full_name', read_only=True)
    staff_username = serializers.CharField(source='staff_member.username', read_only=True)
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    instructor_username = serializers.CharField(source='instructor.username', read_only=True)

    class Meta:
        model = InstructorRevokeRequest
        fields = '__all__'
        read_only_fields = ('staff_member', 'status', 'created_at', 'resolved_at')

class PublicProfileSerializer(serializers.ModelSerializer):
    """Serializer for public instructor profile viewing."""
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'role', 'bio', 'profile_picture', 'instructor_title', 'experience', 'website_url', 'linkedin_url')
        read_only_fields = ('id', 'username')
