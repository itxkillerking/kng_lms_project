from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from courses.models import Course
from exams.models import Exam, ExamQuestion, ExamAttempt, ExamAnswer, ExamSettings, ExamResult, ExamViolation, ExamSnapshot

User = get_user_model()

class Phase9FeatureTests(TestCase):
    def setUp(self):
        # Create instructors
        self.instructor1 = User.objects.create_user(
            username='phase9_inst1',
            email='inst1@test.com',
            password='password123',
            role='instructor'
        )
        self.instructor2 = User.objects.create_user(
            username='phase9_inst2',
            email='inst2@test.com',
            password='password123',
            role='instructor'
        )

        # Create students
        self.student1 = User.objects.create_user(
            username='phase9_stud1',
            email='stud1@test.com',
            password='password123',
            role='student'
        )
        self.student2 = User.objects.create_user(
            username='phase9_stud2',
            email='stud2@test.com',
            password='password123',
            role='student'
        )

        # Create course
        self.course = Course.objects.create(
            title='Phase 9 Testing Course',
            description='Test Course',
            instructor=self.instructor1
        )

        # Create exam for instructor 1
        self.exam = Exam.objects.create(
            title='Phase 9 Exam',
            description='Testing Phase 9 features',
            course=self.course,
            created_by=self.instructor1,
            duration_minutes=60,
            status='published'
        )

        # Create exam settings
        self.settings = ExamSettings.objects.create(
            exam=self.exam,
            camera_required=True,
            snapshot_mode='custom',
            snapshot_interval=5,
            snapshot_custom_questions='2, 4'
        )

        # Add questions
        self.q1 = ExamQuestion.objects.create(
            exam=self.exam,
            question_text='What is 2 + 2?',
            question_type='text',
            marks=5,
            order_number=1
        )
        self.q2 = ExamQuestion.objects.create(
            exam=self.exam,
            question_text='Write a Python function to add two numbers.',
            question_type='code',
            marks=10,
            order_number=2
        )
        self.q3 = ExamQuestion.objects.create(
            exam=self.exam,
            question_text='Explain recursion in audio.',
            question_type='audio',
            marks=10,
            order_number=3
        )

        # Create attempt for student 1
        self.attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.student1,
            status='evaluated'
        )

        # Answers
        self.a1 = ExamAnswer.objects.create(
            attempt=self.attempt,
            question=self.q1,
            answer_text='4',
            marks_obtained=5,
            instructor_feedback='Great job!'
        )
        self.a2 = ExamAnswer.objects.create(
            attempt=self.attempt,
            question=self.q2,
            answer_text='def add(a, b):\n    return a + b',
            marks_obtained=8,
            instructor_feedback='Good structure.'
        )
        self.a3 = ExamAnswer.objects.create(
            attempt=self.attempt,
            question=self.q3,
            answer_text='http://cloudinary.com/audio.webm',
            transcript_text='Recursion is when a function calls itself.',
            marks_obtained=7,
            instructor_feedback='Clear explanation.'
        )

        # Result
        self.result = ExamResult.objects.create(
            attempt=self.attempt,
            percentage=80.0,
            published=True
        )

        # Violation
        ExamViolation.objects.create(
            attempt=self.attempt,
            violation_type='TAB_HIDDEN',
            details='Tab switched for 5s'
        )

        self.client = APIClient()

    def test_student_can_download_own_result_pdf(self):
        self.client.force_authenticate(user=self.student1)
        res = self.client.get(f'/api/exam-attempts/{self.attempt.id}/result-pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')
        self.assertTrue(len(res.content) > 0)
        self.assertIn(b'PDF', res.content[:10])

    def test_instructor_can_download_authorized_attempt_pdf(self):
        self.client.force_authenticate(user=self.instructor1)
        res = self.client.get(f'/api/exam-attempts/{self.attempt.id}/result-pdf/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res['Content-Type'], 'application/pdf')

    def test_unauthorized_student_cannot_download_other_student_pdf(self):
        self.client.force_authenticate(user=self.student2)
        res = self.client.get(f'/api/exam-attempts/{self.attempt.id}/result-pdf/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_unauthorized_instructor_cannot_download_other_instructor_pdf(self):
        self.client.force_authenticate(user=self.instructor2)
        res = self.client.get(f'/api/exam-attempts/{self.attempt.id}/result-pdf/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_cannot_download_pdf_for_started_attempt(self):
        started_attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.student2,
            status='started'
        )
        self.client.force_authenticate(user=self.student2)
        res = self.client.get(f'/api/exam-attempts/{started_attempt.id}/result-pdf/')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_snapshot_settings_custom_questions_field(self):
        self.client.force_authenticate(user=self.instructor1)
        res = self.client.patch(
            f'/api/exams/{self.exam.id}/',
            {
                'settings': {
                    'snapshot_mode': 'custom',
                    'snapshot_custom_questions': '1, 3, 5'
                }
            },
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.exam.settings.refresh_from_db()
        self.assertEqual(self.exam.settings.snapshot_mode, 'custom')
        self.assertEqual(self.exam.settings.snapshot_custom_questions, '1, 3, 5')
