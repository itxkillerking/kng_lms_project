from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from users.models import User, UserOTP, PasswordResetToken
from rest_framework.test import APIClient
from django.core.cache import cache
import hashlib
import secrets
from unittest.mock import patch
from users.tasks import send_otp_email_task

class PasswordResetSecurityTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser', email='test@example.com', password='oldpassword123'
        )

    def _generate_valid_otp(self):
        code = '123456'
        UserOTP.objects.create(
            user=self.user,
            code=code,
            purpose='password_reset',
            expires_at=timezone.now() + timezone.timedelta(minutes=3)
        )
        return code

    def _generate_valid_reset_token(self):
        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        self.token_record = PasswordResetToken.objects.create(
            user=self.user,
            token_hash=token_hash,
            expires_at=timezone.now() + timezone.timedelta(minutes=5)
        )
        return raw_token

    def test_a_reset_without_token_reject(self):
        response = self.client.post(reverse('password_reset'), {
            'email': self.user.email,
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, 400)

    def test_b_invalid_token_reject(self):
        response = self.client.post(reverse('password_reset'), {
            'email': self.user.email,
            'reset_token': 'invalid_token_xyz',
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, 400)

    def test_c_expired_token_reject(self):
        raw_token = self._generate_valid_reset_token()
        self.token_record.expires_at = timezone.now() - timezone.timedelta(minutes=1)
        self.token_record.save()
        
        response = self.client.post(reverse('password_reset'), {
            'email': self.user.email,
            'reset_token': raw_token,
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, 400)

    def test_d_already_used_token_reject(self):
        raw_token = self._generate_valid_reset_token()
        self.token_record.is_used = True
        self.token_record.save()
        
        response = self.client.post(reverse('password_reset'), {
            'email': self.user.email,
            'reset_token': raw_token,
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, 400)

    def test_e_token_associated_with_one_user_different_email_reject(self):
        raw_token = self._generate_valid_reset_token()
        User.objects.create_user(username='other', email='other@example.com', password='pwd')
        
        response = self.client.post(reverse('password_reset'), {
            'email': 'other@example.com',
            'reset_token': raw_token,
            'new_password': 'newpassword123'
        })
        self.assertEqual(response.status_code, 400)

    def test_g_new_otp_invalidates_old_otp(self):
        code1 = self._generate_valid_otp()
        response = self.client.post(reverse('request_otp'), {
            'email': self.user.email,
            'purpose': 'password_reset'
        })
        self.assertEqual(response.status_code, 200)
        
        # Check that the first OTP is now invalidated
        otp1 = UserOTP.objects.get(code=code1)
        self.assertTrue(otp1.is_used)

    def test_h_new_successful_otp_invalidates_older_unused_reset_tokens(self):
        raw_token1 = self._generate_valid_reset_token()
        
        code2 = self._generate_valid_otp()
        cache.clear()
        response = self.client.post(reverse('verify_otp'), {
            'email': self.user.email,
            'code': code2,
            'purpose': 'password_reset'
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('reset_token', response.data)
        
        # Original token should now be invalidated
        self.token_record.refresh_from_db()
        self.assertTrue(self.token_record.is_used)

    def test_f_simultaneous_reset_attempts_one_succeeds(self):
        # We simulate this by checking that it sets is_used=True correctly
        # True concurrency testing is hard in Django TestCase without thread loops
        raw_token = self._generate_valid_reset_token()
        
        response1 = self.client.post(reverse('password_reset'), {
            'email': self.user.email,
            'reset_token': raw_token,
            'new_password': 'newpassword123'
        })
        self.assertEqual(response1.status_code, 200)
        
        cache.clear()
        
        response2 = self.client.post(reverse('password_reset'), {
            'email': self.user.email,
            'reset_token': raw_token,
            'new_password': 'newpassword123'
        })
        self.assertEqual(response2.status_code, 400)

    @patch('users.tasks.requests.post')
    @override_settings(BREVO_API_KEY='mock_api_key_123', BREVO_SENDER_NAME='KLS Test', BREVO_SENDER_EMAIL='test@knglogics.com', BREVO_OTP_TEMPLATE_ID='42')
    def test_i_brevo_api_integration(self, mock_post):
        # Setup mock response
        mock_post.return_value.status_code = 201
        
        # Call the task directly
        send_otp_email_task(self.user.id, '123456')
        
        # Verify requests.post was called with correct parameters
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        
        self.assertEqual(args[0], "https://api.brevo.com/v3/smtp/email")
        self.assertEqual(kwargs['headers']['api-key'], 'mock_api_key_123')
        
        payload = kwargs['json']
        self.assertEqual(payload['sender']['name'], 'KLS Test')
        self.assertEqual(payload['sender']['email'], 'test@knglogics.com')
        self.assertEqual(payload['to'][0]['email'], self.user.email)
        self.assertEqual(payload['templateId'], 42)
        self.assertEqual(payload['params']['OTP'], '123456')
