from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from datetime import timedelta

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('instructor', 'Instructor'),
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
        return self.role == 'instructor'
        
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
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.user.username} - {self.action} at {self.timestamp}"
