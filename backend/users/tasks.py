from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils.html import strip_tags
from django.contrib.auth import get_user_model
from courses.models import Course

User = get_user_model()

@shared_task(name="users.tasks.send_registration_email")
def send_registration_email_task(user_id):
    """Background task to send a welcome email."""
    try:
        user = User.objects.get(id=user_id)
        subject = '🎉 Welcome to KNG Logics LMS!'
        html_message = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f8fafc; padding: 40px; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #0A84FF, #BF5AF2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">KNG Logics LMS</h1>
            </div>
            <h2 style="color: #f8fafc; font-size: 22px;">Welcome, {user.first_name or user.username}! 🚀</h2>
            <p style="color: #94a3b8; line-height: 1.7; font-size: 16px;">
                Your account has been successfully created. You now have full access to our learning platform.
            </p>
            <div style="background: rgba(10, 132, 255, 0.1); border: 1px solid rgba(10, 132, 255, 0.2); border-radius: 12px; padding: 20px; margin: 24px 0;">
                <p style="color: #0A84FF; font-weight: 600; margin-bottom: 8px;">Your Account Details</p>
                <p style="color: #94a3b8; margin: 4px 0;"><strong style="color: #f8fafc;">Username:</strong> {user.username}</p>
                <p style="color: #94a3b8; margin: 4px 0;"><strong style="color: #f8fafc;">Email:</strong> {user.email}</p>
            </div>
            <div style="text-align: center; margin-top: 32px;">
                <a href="{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/catalog" 
                   style="display: inline-block; background: linear-gradient(135deg, #0A84FF, #BF5AF2); color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Browse Courses
                </a>
            </div>
        </div>
        """
        plain_message = strip_tags(html_message)
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass
    except Exception as e:
        print(f"[CELERY ERROR] Registration email failed: {e}")

@shared_task(name="users.tasks.send_enrollment_email")
def send_enrollment_email_task(user_id, course_id):
    """Background task to send an enrollment confirmation email."""
    try:
        user = User.objects.get(id=user_id)
        course = Course.objects.select_related('instructor').get(id=course_id)
        
        subject = f'✅ Enrolled: {course.title}'
        html_message = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f8fafc; padding: 40px; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #0A84FF, #BF5AF2); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">KNG Logics LMS</h1>
            </div>
            <h2 style="color: #f8fafc; font-size: 22px;">Enrollment Confirmed! 📚</h2>
            <p style="color: #94a3b8; line-height: 1.7; font-size: 16px;">
                Hi {user.first_name or user.username}, you have been successfully enrolled in: {course.title}
            </p>
            <div style="text-align: center; margin-top: 32px;">
                <a href="{getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')}/course/{course.id}" 
                   style="display: inline-block; background: linear-gradient(135deg, #0A84FF, #BF5AF2); color: white; text-decoration: none; padding: 14px 36px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                    Go to Course
                </a>
            </div>
        </div>
        """
        plain_message = strip_tags(html_message)
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except (User.DoesNotExist, Course.DoesNotExist):
        pass
    except Exception as e:
        print(f"[CELERY ERROR] Enrollment email failed: {e}")

@shared_task(name="users.tasks.send_otp_email")
def send_otp_email_task(user_id, otp_code):
    """Background task to send an OTP code email."""
    try:
        user = User.objects.get(id=user_id)
        subject = '🔐 Your Verification Code - KNG Logics LMS'
        html_message = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0f; color: #f8fafc; padding: 40px; border-radius: 20px;">
            <h2 style="color: #f8fafc; font-size: 22px; text-align: center;">Your Verification Code</h2>
            <div style="text-align: center; margin: 32px 0;">
                <div style="display: inline-block; background: rgba(10, 132, 255, 0.15); border: 2px solid rgba(10, 132, 255, 0.3); border-radius: 16px; padding: 24px 48px;">
                    <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #0A84FF;">{otp_code}</span>
                </div>
            </div>
        </div>
        """
        plain_message = f"Your KNG Logics LMS verification code is: {otp_code}."
        send_mail(
            subject=subject,
            message=plain_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
    except User.DoesNotExist:
        pass
    except Exception as e:
        print(f"[CELERY ERROR] OTP email failed: {e}")
