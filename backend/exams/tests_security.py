from rest_framework.test import APITestCase
from django.urls import reverse
from users.models import User
from courses.models import Course, Category
from exams.models import Exam, ExamQuestion, ExamAttempt, ExamAnswer, ExamSnapshot, ExamViolation

class ExamSecurityTests(APITestCase):
    def setUp(self):
        self.instructor_a = User.objects.create_user(username='instructor_a', password='password123', role='instructor')
        self.instructor_b = User.objects.create_user(username='instructor_b', password='password123', role='instructor')
        self.student_a = User.objects.create_user(username='student_a', password='password123', role='student')
        self.student_b = User.objects.create_user(username='student_b', password='password123', role='student')
        
        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.course_a = Course.objects.create(title='Course A', instructor=self.instructor_a, category=self.category, moderation_status='approved')
        
        self.exam_a = Exam.objects.create(title='Exam A', course=self.course_a, created_by=self.instructor_a, status='active', duration_minutes=60)
        self.question = ExamQuestion.objects.create(exam=self.exam_a, question_text='Q1', marks=10, order_number=1)
        
        self.attempt_a = ExamAttempt.objects.create(exam=self.exam_a, student=self.student_a, status='started')
        self.attempt_b = ExamAttempt.objects.create(exam=self.exam_a, student=self.student_b, status='started')
        
        self.answer_a = ExamAnswer.objects.create(attempt=self.attempt_a, question=self.question, answer_text='Ans A')
        self.answer_b = ExamAnswer.objects.create(attempt=self.attempt_b, question=self.question, answer_text='Ans B')
        
        self.snapshot_b = ExamSnapshot.objects.create(attempt=self.attempt_b, image_url='http://example.com/snap.jpg')
        self.violation_b = ExamViolation.objects.create(attempt=self.attempt_b, violation_type='face_missing', severity='High')

    def test_student_cannot_read_another_students_snapshot(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.get(f'/api/exam-snapshots/{self.snapshot_b.id}/')
        self.assertEqual(response.status_code, 404)
        
    def test_student_cannot_create_snapshot_for_another_student(self):
        self.client.force_authenticate(user=self.student_a)
        response = self.client.post('/api/exam-snapshots/', {'attempt': self.attempt_b.id, 'image': 'fake'})
        self.assertEqual(response.status_code, 403)
        
    def test_student_cannot_delete_violation(self):
        self.client.force_authenticate(user=self.student_b)
        response = self.client.delete(f'/api/exam-violations/{self.violation_b.id}/')
        self.assertEqual(response.status_code, 403)
        
    def test_instructor_b_cannot_grade_attempt_for_exam_a(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.patch(f'/api/exam-answers/{self.answer_a.id}/', {'marks_obtained': 5})
        self.assertEqual(response.status_code, 404)
        
    def test_instructor_a_can_grade_attempt_for_exam_a(self):
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.patch(f'/api/exam-answers/{self.answer_a.id}/', {'marks_obtained': 5})
        self.assertEqual(response.status_code, 200)
        
    def test_grade_cannot_be_negative(self):
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.patch(f'/api/exam-answers/{self.answer_a.id}/', {'marks_obtained': -1})
        self.assertEqual(response.status_code, 400)
        
    def test_grade_cannot_exceed_max_marks(self):
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.patch(f'/api/exam-answers/{self.answer_a.id}/', {'marks_obtained': 15})
        self.assertEqual(response.status_code, 400)


class InstructorExamIsolationTests(APITestCase):
    """Tests that Instructor B cannot see or manage Instructor A's exams."""
    
    def setUp(self):
        self.instructor_a = User.objects.create_user(username='inst_a', password='password123', role='instructor')
        self.instructor_b = User.objects.create_user(username='inst_b', password='password123', role='instructor')
        self.student = User.objects.create_user(username='stu_iso', password='password123', role='student')
        
        self.category = Category.objects.create(name='Iso Category', slug='iso-category')
        self.course_a = Course.objects.create(title='Course A', instructor=self.instructor_a, category=self.category, moderation_status='approved')
        self.course_b = Course.objects.create(title='Course B', instructor=self.instructor_b, category=self.category, moderation_status='approved')
        
        self.exam_a = Exam.objects.create(title='Exam A', course=self.course_a, created_by=self.instructor_a, status='active', duration_minutes=60)
        self.exam_b = Exam.objects.create(title='Exam B', course=self.course_b, created_by=self.instructor_b, status='active', duration_minutes=60)
        
        self.question_a = ExamQuestion.objects.create(exam=self.exam_a, question_text='Q1 A', marks=10, order_number=1)
        self.question_b = ExamQuestion.objects.create(exam=self.exam_b, question_text='Q1 B', marks=10, order_number=1)
        
        self.attempt_a = ExamAttempt.objects.create(exam=self.exam_a, student=self.student, status='submitted')
        self.answer_a = ExamAnswer.objects.create(attempt=self.attempt_a, question=self.question_a, answer_text='Answer')

    # --- LIST ISOLATION ---
    
    def test_instructor_a_sees_only_exam_a(self):
        self.client.force_authenticate(user=self.instructor_a)
        response = self.client.get('/api/exams/')
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        exam_ids = [e['id'] for e in results]
        self.assertIn(self.exam_a.id, exam_ids)
        self.assertNotIn(self.exam_b.id, exam_ids)

    def test_instructor_b_sees_only_exam_b(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.get('/api/exams/')
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        exam_ids = [e['id'] for e in results]
        self.assertIn(self.exam_b.id, exam_ids)
        self.assertNotIn(self.exam_a.id, exam_ids)

    # --- DETAIL / GET by ID ---
    
    def test_instructor_b_cannot_get_exam_a_by_id(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.get(f'/api/exams/{self.exam_a.id}/')
        self.assertIn(response.status_code, [403, 404])

    # --- PATCH ---
    
    def test_instructor_b_cannot_patch_exam_a(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.patch(f'/api/exams/{self.exam_a.id}/', {'title': 'Hacked'})
        self.assertIn(response.status_code, [403, 404])

    # --- DELETE ---
    
    def test_instructor_b_cannot_delete_exam_a(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.delete(f'/api/exams/{self.exam_a.id}/')
        self.assertIn(response.status_code, [403, 404])

    # --- PUBLISH ---
    
    def test_instructor_b_cannot_publish_exam_a(self):
        # Create a draft exam for A so publish action is valid
        draft_exam = Exam.objects.create(title='Draft A', course=self.course_a, created_by=self.instructor_a, status='draft', duration_minutes=30)
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.post(f'/api/exams/{draft_exam.id}/publish/')
        self.assertIn(response.status_code, [403, 404])

    # --- QUESTIONS ---
    
    def test_instructor_b_cannot_see_exam_a_questions(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.get(f'/api/exam-questions/?exam={self.exam_a.id}')
        self.assertEqual(response.status_code, 200)
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        self.assertEqual(len(results), 0)  # Empty — filtered out

    # --- ATTEMPTS ---
    
    def test_instructor_b_cannot_see_exam_a_attempts(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.get(f'/api/exam-attempts/')
        results = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        attempt_exam_ids = [a['exam'] for a in results]
        self.assertNotIn(self.exam_a.id, attempt_exam_ids)

    # --- GRADING ---
    
    def test_instructor_b_cannot_grade_exam_a_answer(self):
        self.client.force_authenticate(user=self.instructor_b)
        response = self.client.patch(f'/api/exam-answers/{self.answer_a.id}/', {'marks_obtained': 5})
        self.assertIn(response.status_code, [403, 404])
