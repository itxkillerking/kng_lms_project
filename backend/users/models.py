from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('staff', 'Staff'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    is_verified_teacher = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)
    account_status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('under_review', 'Under Review')
    ], default='active')
    bio = models.TextField(max_length=500, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    instructor_title = models.CharField(max_length=100, blank=True, help_text="e.g. Senior Software Architect")
    experience = models.TextField(blank=True, help_text="Professional experience and history")
    phone_number = models.CharField(max_length=15, blank=True)
    joined_at = models.DateTimeField(default=timezone.now)
    website_url = models.URLField(max_length=255, blank=True)
    linkedin_url = models.URLField(max_length=255, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['role']),
            models.Index(fields=['account_status']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    @property
    def is_student(self):
        return self.role == 'student'
        
    @property
    def is_instructor(self):
        return self.role in ['instructor', 'admin']
        
    @property
    def is_admin(self):
        return self.role == 'admin'


class UserOTP(models.Model):
    """Stores temporary OTP codes for password reset and email verification."""
    PURPOSE_CHOICES = [
        ('password_reset', 'Password Reset'),
        ('email_verify', 'Email Verification'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_codes')
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=20, choices=PURPOSE_CHOICES)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'purpose', 'is_used']),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"OTP for {self.user.username} ({self.purpose})"


class UserActivityLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs', null=True, blank=True)
    action = models.CharField(max_length=100)
    status = models.CharField(max_length=20, default='success')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    target_type = models.CharField(max_length=50, null=True, blank=True)
    target_id = models.CharField(max_length=255, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        actor = self.user.username if self.user else "Anonymous"
        return f"{actor} - {self.action} at {self.timestamp}"

class SuspensionRequest(models.Model):
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_suspension_requests')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suspension_requests')
    reason = models.TextField()
    proof = models.FileField(upload_to='suspension_proofs/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Suspension Request: {self.student.username} by {self.instructor.username} ({self.status})"

class InstructorRevokeRequest(models.Model):
    staff_member = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_revoke_requests')
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='revoke_requests')
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Revoke Request: {self.instructor.username} by {self.staff_member.username} ({self.status})"

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['token_hash']),
            models.Index(fields=['user', 'is_used']),
        ]

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Reset Token for {self.user.username}"
