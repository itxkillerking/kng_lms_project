from django.db import models
from django.conf import settings
from django.utils.text import slugify

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)
    icon_name = models.CharField(max_length=50, default='Book', help_text="Lucide icon name")

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Course(models.Model):
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses')
    title = models.CharField(max_length=255)
    description = models.TextField()
    thumbnail = models.ImageField(upload_to='courses/thumbnails/', blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='courses')
    moderation_status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('draft', 'Draft')
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def total_lessons(self):
        return Lesson.objects.filter(module__course=self).count()

    @property
    def total_quizzes(self):
        from assessments.models import Quiz
        return Quiz.objects.filter(module__course=self).count()

    @property
    def total_assignments(self):
        from assessments.models import Assignment
        return Assignment.objects.filter(module__course=self).count()

    @property
    def total_duration_mins(self):
        import math
        seconds = Lesson.objects.filter(module__course=self).aggregate(models.Sum('duration'))['duration__sum'] or 0
        return math.ceil(seconds / 60)

    def __str__(self):
        return self.title

class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"{self.course.title} - {self.title}"

class Lesson(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    video_type = models.CharField(max_length=20, choices=[
        ('file', 'File Upload'),
        ('link', 'External Link'),
        ('drive', 'Google Drive'),
        ('youtube', 'YouTube'),
        ('vimeo', 'Vimeo')
    ], default='link')
    video_url = models.URLField(blank=True, null=True)
    video_file = models.FileField(upload_to='lessons/videos/', blank=True, null=True)
    attachment_file = models.FileField(upload_to='lessons/attachments/', blank=True, null=True)
    duration = models.PositiveIntegerField(help_text="Duration in seconds", default=0)
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"{self.module.title} - {self.title}"

class CourseEnrollment(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'course')

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"

    @property
    def progress_percentage(self):
        from progress.models import UserLessonProgress
        from submissions.models import QuizAttempt, AssignmentSubmission
        
        total_items = self.course.total_lessons + self.course.total_quizzes + self.course.total_assignments
        if total_items == 0:
            return 100
        
        # 1. Lessons completed
        completed_lessons = UserLessonProgress.objects.filter(
            user=self.student, 
            lesson__module__course=self.course, 
            is_complete=True
        ).count()
        
        # 2. Quizzes passed
        passed_quizzes = QuizAttempt.objects.filter(
            user=self.student,
            quiz__module__course=self.course,
            passed=True
        ).values('quiz').distinct().count()
        
        # 3. Assignments submitted
        submitted_assignments = AssignmentSubmission.objects.filter(
            user=self.student,
            assignment__module__course=self.course
        ).values('assignment').distinct().count()
        
        total_completed = completed_lessons + passed_quizzes + submitted_assignments
        percentage = (total_completed / total_items) * 100
        # Only return 100 if EVERYTHING is truly completed
        if total_completed == total_items:
            return 100
        return int(percentage) # Floor to avoid misleading 100%

class Announcement(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='announcements')
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_announcements')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Announcement: {self.title} ({self.course.title})"

class Review(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='reviews')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('course', 'student')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.username}'s {self.rating}-star review for {self.course.title}"
