from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from django.core import cache

class UserAbuseTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='teststudent', email='student@test.com', password='password123', role='student')
        cache.cache.clear()

    def test_login_rate_limiting(self):
        # 5 legitimate requests should pass
        for _ in range(5):
            response = self.client.post('/api/users/login/', {'username': 'teststudent', 'password': 'password123'})
            self.assertEqual(response.status_code, 200)

        # 6th request should fail with 429 Too Many Requests
        response = self.client.post('/api/users/login/', {'username': 'teststudent', 'password': 'password123'})
        self.assertEqual(response.status_code, 429)

    def test_login_account_lockout(self):
        # Trigger 5 failed logins explicitly avoiding DRF 429 throttle by changing IP slightly or bypassing throttle
        # Since we use same client, we might hit 429 before 5 failures. But DRF rate limiting limits by IP/username.
        # Actually our LoginRateThrottle is 5/minute.
        # If we send 5 wrong passwords, they will hit the 401 Unauthorized but also trigger our lockout.
        from users.models import UserActivityLog
        UserActivityLog.objects.filter(user=self.user, action='login').delete()
        for _ in range(5):
            response = self.client.post('/api/users/login/', {'username': 'teststudent', 'password': 'wrongpassword'})
            self.assertEqual(response.status_code, 401)
            
        # Clear cache to bypass DRF LoginRateThrottle so our custom lockout logic runs
        cache.cache.clear()
        
        # The 6th attempt should return 403 Forbidden because of account lockout, even with correct password
        response = self.client.post('/api/users/login/', {'username': 'teststudent', 'password': 'password123'})
        self.assertEqual(response.status_code, 403)
        self.assertIn('Too many failed login attempts', response.data['detail'])
        
        # Verify the lockout event is logged
        self.assertTrue(UserActivityLog.objects.filter(user=self.user, action='ACCOUNT_LOGIN_LOCKOUT').exists())

    def test_otp_request_rate_limiting(self):
        # 5 legitimate requests should pass
        for _ in range(5):
            response = self.client.post('/api/users/otp/request/', {'email': 'student@test.com', 'purpose': 'password_reset'})
            self.assertEqual(response.status_code, 200)

        # 6th request should fail with 429
        response = self.client.post('/api/users/otp/request/', {'email': 'student@test.com', 'purpose': 'password_reset'})
        self.assertEqual(response.status_code, 429)

    def test_otp_verify_rate_limiting(self):
        # 5 requests should pass (though they'll return 400 since OTP is invalid, we check that it's not 429)
        for _ in range(5):
            response = self.client.post('/api/users/otp/verify/', {'email': 'student@test.com', 'code': '123456', 'new_password': 'new'})
            self.assertEqual(response.status_code, 400)

        # 6th request should fail with 429
        response = self.client.post('/api/users/otp/verify/', {'email': 'student@test.com', 'code': '123456', 'new_password': 'new'})
        self.assertEqual(response.status_code, 429)
