from django.test import TestCase
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from courses.models import Course, CourseEnrollment, Category
from exams.models import Exam, ExamSettings
from django.urls import reverse
from rest_framework import status

User = get_user_model()

class Phase10IntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create users
        self.instructor_a = User.objects.create_user(username='instructor_a', password='password123', role='instructor')
        self.instructor_b = User.objects.create_user(username='instructor_b', password='password123', role='instructor')
        self.student_a = User.objects.create_user(username='student_a', password='password123', role='student')
        self.student_b = User.objects.create_user(username='student_b', password='password123', role='student')
        
        self.category = Category.objects.create(name='Technology')
        
        # Create courses
        self.course_a = Course.objects.create(
            title='Course A', 
            instructor=self.instructor_a, 
            category=self.category,
            moderation_status='approved'
        )
        self.course_b = Course.objects.create(
            title='Course B', 
            instructor=self.instructor_b, 
            category=self.category,
            moderation_status='approved'
        )
        
        # Create enrollments
        CourseEnrollment.objects.create(student=self.student_a, course=self.course_a)
        CourseEnrollment.objects.create(student=self.student_b, course=self.course_b)
        
        # Create exams
        self.exam_a = Exam.objects.create(
            course=self.course_a,
            title='Exam A',
            created_by=self.instructor_a,
            duration_minutes=60,
            status='active',
            assign_to_all_enrolled=True
        )
        ExamSettings.objects.create(exam=self.exam_a)
        
        self.exam_b = Exam.objects.create(
            course=self.course_b,
            title='Exam B',
            created_by=self.instructor_b,
            duration_minutes=60,
            status='active',
            assign_to_all_enrolled=True
        )
        ExamSettings.objects.create(exam=self.exam_b)

    def test_student_a_sees_only_course_a(self):
        """Student A should only see Course A in my_courses"""
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get('/api/courses/my_courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        course_ids = [c['id'] for c in response.data]
        self.assertIn(self.course_a.id, course_ids)
        self.assertNotIn(self.course_b.id, course_ids)

    def test_student_b_sees_only_course_b(self):
        """Student B should only see Course B in my_courses"""
        self.client.force_authenticate(user=self.student_b)
        response = self.client.get('/api/courses/my_courses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        course_ids = [c['id'] for c in response.data]
        self.assertIn(self.course_b.id, course_ids)
        self.assertNotIn(self.course_a.id, course_ids)

    def test_instructor_a_sees_only_course_a_with_filter(self):
        """Instructor A fetching with ?instructor=me should only see their courses"""
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.get('/api/courses/?instructor=me')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Assuming pagination or raw list
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        course_ids = [c['id'] for c in data]
        self.assertIn(self.course_a.id, course_ids)
        self.assertNotIn(self.course_b.id, course_ids)

    def test_instructor_a_sees_only_course_a_students(self):
        """Instructor A can access students for Course A but not Course B"""
        self.client.force_authenticate(user=self.instructor_a)
        
        # Valid access
        response_valid = self.client.get(f'/api/courses/{self.course_a.id}/students/')
        self.assertEqual(response_valid.status_code, status.HTTP_200_OK)
        data = response_valid.data.get('results', response_valid.data) if isinstance(response_valid.data, dict) else response_valid.data
        student_ids = [s['id'] for s in data]
        self.assertIn(self.student_a.id, student_ids)
        
        # Invalid access
        response_invalid = self.client.get(f'/api/courses/{self.course_b.id}/students/')
        self.assertEqual(response_invalid.status_code, status.HTTP_404_NOT_FOUND)

    def test_student_a_sees_only_exam_a(self):
        """Student A should only see Exam A due to enrollment"""
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get('/api/exams/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        exam_ids = [e['id'] for e in data]
        self.assertIn(self.exam_a.id, exam_ids)
        self.assertNotIn(self.exam_b.id, exam_ids)

    def test_profile_returns_real_authenticated_data(self):
        """Profile endpoint /api/users/me/ returns authenticated user data"""
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get('/api/users/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.student_a.id)
        self.assertEqual(response.data['username'], self.student_a.username)
