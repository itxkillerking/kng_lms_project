from django.test import TestCase
from rest_framework.test import APIClient
from users.models import User
from courses.models import Course, Category
from exams.models import Exam, ExamQuestion, ExamAttempt, ExamAnswer
from django.core import cache
from django.core.files.uploadedfile import SimpleUploadedFile

class ExamAbuseTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.student = User.objects.create_user(username='student', password='password123', role='student')
        self.instructor = User.objects.create_user(username='instructor', password='password123', role='instructor')
        
        self.category = Category.objects.create(name='Test', slug='test')
        self.course = Course.objects.create(title='Course', instructor=self.instructor, category=self.category, moderation_status='approved')
        self.exam = Exam.objects.create(title='Exam', course=self.course, created_by=self.instructor, status='active', duration_minutes=60)
        self.question = ExamQuestion.objects.create(exam=self.exam, question_text='Q1', marks=10, order_number=1)
        
        cache.cache.clear()

    def test_exam_start_rate_limiting(self):
        self.client.force_authenticate(user=self.student)
        
        # 5 legitimate requests should pass
        for _ in range(5):
            response = self.client.post('/api/exam-attempts/start_exam/', {'exam_id': self.exam.id})
            # It will return 201 for first, and 200 for subsequent (since attempt already exists and is not submitted)
            self.assertIn(response.status_code, [200, 201])

        # 6th request should fail with 429 Too Many Requests
        response = self.client.post('/api/exam-attempts/start_exam/', {'exam_id': self.exam.id})
        self.assertEqual(response.status_code, 429)

    def test_snapshot_invalid_image_validation(self):
        self.client.force_authenticate(user=self.student)
        attempt = ExamAttempt.objects.create(exam=self.exam, student=self.student, status='started')
        
        # Create a fake file with invalid magic bytes (e.g., a text file masked as png)
        invalid_image = SimpleUploadedFile("fake.png", b"This is not a real image.", content_type="image/png")
        
        response = self.client.post('/api/exam-snapshots/', {
            'attempt': attempt.id,
            'image': invalid_image
        })
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid image format', str(response.data))

    def test_snapshot_valid_image_validation(self):
        self.client.force_authenticate(user=self.student)
        attempt = ExamAttempt.objects.create(exam=self.exam, student=self.student, status='started')
        
        # A valid PNG magic bytes header
        valid_png = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR'
        valid_image = SimpleUploadedFile("real.png", valid_png, content_type="image/png")
        
        response = self.client.post('/api/exam-snapshots/', {
            'attempt': attempt.id,
            'image': valid_image
        })
        # This will attempt to upload to Cloudinary and might fail or succeed depending on mock,
        # but it shouldn't fail with our custom 400 validation error
        self.assertNotEqual(response.status_code, 400)
        
    def test_audio_invalid_validation(self):
        self.client.force_authenticate(user=self.student)
        attempt = ExamAttempt.objects.create(exam=self.exam, student=self.student, status='started')
        answer = ExamAnswer.objects.create(attempt=attempt, question=self.question)
        
        invalid_audio = SimpleUploadedFile("fake.mp3", b"This is a fake audio file.", content_type="audio/mp3")
        
        response = self.client.patch(f'/api/exam-answers/{answer.id}/', {
            'audio_file': invalid_audio
        }, format='multipart')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid audio format', str(response.data))

    def test_pdf_extract_invalid_pdf(self):
        self.client.force_authenticate(user=self.instructor)
        
        invalid_pdf = SimpleUploadedFile("fake.pdf", b"This is a fake PDF.", content_type="application/pdf")
        
        response = self.client.post('/api/pdf-extract/', {
            'file': invalid_pdf
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid PDF file content', str(response.data))

    def test_pdf_upload_rate_limiting(self):
        self.client.force_authenticate(user=self.instructor)
        
        # valid pdf magic bytes
        valid_pdf = SimpleUploadedFile("real.pdf", b"%PDF-1.4\n1 0 obj", content_type="application/pdf")
        
        # 10 legitimate requests should pass
        for _ in range(10):
            valid_pdf.seek(0)
            response = self.client.post('/api/pdf-extract/', {'file': valid_pdf})
            self.assertNotEqual(response.status_code, 429)

        # 11th request should fail with 429
        valid_pdf.seek(0)
        response = self.client.post('/api/pdf-extract/', {'file': valid_pdf})
        self.assertEqual(response.status_code, 429)
