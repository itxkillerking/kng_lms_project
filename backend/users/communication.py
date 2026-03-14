"""
Email & OTP Communication Utilities for KNG Logics LMS.
Handles triggering background tasks for email sending and OTP generation.
"""
import random
import string
from .tasks import send_registration_email_task, send_enrollment_email_task, send_otp_email_task


def generate_otp(length=6):
    """Generate a numeric OTP code."""
    return ''.join(random.choices(string.digits, k=length))


def send_registration_email(user):
    """Trigger background task to send a welcome email."""
    if user.email:
        send_registration_email_task.delay(user.id)


def send_enrollment_email(user, course):
    """Trigger background task to send a confirmation email when a student enrolls."""
    if user.email:
        send_enrollment_email_task.delay(user.id, course.id)


def send_otp_email(user, otp_code):
    """Trigger background task to send an OTP code via email."""
    if user.email:
        send_otp_email_task.delay(user.id, otp_code)
