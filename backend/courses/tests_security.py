from rest_framework.test import APITestCase
from django.urls import reverse
from users.models import User
from courses.models import Course, Category, Module, Lesson, Announcement

class CourseSecurityTests(APITestCase):
    def setUp(self):
        self.instructor_a = User.objects.create_user(username='instructor_a', password='password123', role='instructor')
        self.instructor_b = User.objects.create_user(username='instructor_b', password='password123', role='instructor')
        self.student_a = User.objects.create_user(username='student_a', password='password123', role='student')
        
        self.category = Category.objects.create(name='Test Category', slug='test-category')
        
        self.course_a = Course.objects.create(title='Course A', instructor=self.instructor_a, category=self.category, moderation_status='approved')
        self.module_a = Module.objects.create(title='Module A', course=self.course_a, order_index=1)
        self.lesson_a = Lesson.objects.create(title='Lesson A', module=self.module_a, order_index=1)
        
    def test_student_cannot_create_module(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.post('/api/modules/', {'title': 'New Module', 'course': self.course_a.id, 'order_index': 2})
        self.assertEqual(response.status_code, 403)
        
    def test_instructor_b_cannot_create_module_for_course_a(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.post('/api/modules/', {'title': 'New Module', 'course': self.course_a.id, 'order_index': 2})
        self.assertEqual(response.status_code, 403)
        
    def test_instructor_a_can_create_module(self):
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.post('/api/modules/', {'title': 'New Module', 'course': self.course_a.id, 'order_index': 2})
        self.assertEqual(response.status_code, 201)
        
    def test_student_cannot_delete_lesson(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.delete(f'/api/lessons/{self.lesson_a.id}/')
        self.assertEqual(response.status_code, 403)
        
    def test_instructor_b_cannot_delete_lesson_a(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.delete(f'/api/lessons/{self.lesson_a.id}/')
        self.assertEqual(response.status_code, 403)
        
    def test_instructor_a_can_delete_lesson_a(self):
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.delete(f'/api/lessons/{self.lesson_a.id}/')
        self.assertEqual(response.status_code, 204)
