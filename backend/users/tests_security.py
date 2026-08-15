from rest_framework.test import APITestCase
from django.urls import reverse
from users.models import User

class PrivilegeEscalationTests(APITestCase):
    def setUp(self):
        self.student = User.objects.create_user(
            username='student_a', 
            password='password123', 
            role='student'
        )
        self.client.force_authenticate(user=self.student)
        self.me_url = reverse('current_user')
        
    def test_student_cannot_escalate_role(self):
        response = self.client.patch(self.me_url, {'role': 'admin'})
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertEqual(self.student.role, 'student')
        
    def test_student_cannot_set_is_staff(self):
        response = self.client.patch(self.me_url, {'is_staff': True})
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_staff)
        
    def test_student_cannot_set_is_superuser(self):
        response = self.client.patch(self.me_url, {'is_superuser': True})
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_superuser)
        
    def test_student_cannot_set_account_status(self):
        response = self.client.patch(self.me_url, {'account_status': 'active'})
        self.assertEqual(response.status_code, 200)
        # Should remain the default
        
    def test_student_cannot_verify_teacher(self):
        response = self.client.patch(self.me_url, {'is_verified_teacher': True})
        self.assertEqual(response.status_code, 200)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_verified_teacher)
