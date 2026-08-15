from django.db import models
from django.conf import settings
from django.utils import timezone
from courses.models import Course

class Exam(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_exams')
    start_time = models.DateTimeField(blank=True, null=True)
    end_time = models.DateTimeField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(help_text="Duration in minutes")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)
    assign_to_all_enrolled = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.course.title})"

class ExamSettings(models.Model):
    SNAPSHOT_MODES = (
        ('every_question', 'Every Question'),
        ('every_n_questions', 'Every N Questions'),
        ('random', 'Random'),
        ('custom', 'Custom'),
    )

    exam = models.OneToOneField(Exam, on_delete=models.CASCADE, related_name='settings')
    camera_required = models.BooleanField(default=False)
    microphone_required = models.BooleanField(default=False)
    fullscreen_required = models.BooleanField(default=False)
    copy_protection = models.BooleanField(default=False)
    allow_resume = models.BooleanField(default=True)
    allow_back_navigation = models.BooleanField(default=True)
    show_result_after_publish = models.BooleanField(default=True)
    
    snapshot_mode = models.CharField(max_length=20, choices=SNAPSHOT_MODES, default='every_question')
    snapshot_interval = models.PositiveIntegerField(blank=True, null=True, help_text="Interval parameter depending on mode")
    snapshot_custom_questions = models.CharField(max_length=255, blank=True, null=True, help_text="Comma-separated question numbers for custom mode")
    
    # Phase 6 Proctoring Controls
    max_warnings = models.PositiveIntegerField(default=5)
    auto_terminate_threshold = models.PositiveIntegerField(null=True, blank=True)


    def __str__(self):
        return f"Settings for {self.exam.title}"

class ExamAssignment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('active', 'Active'),
        ('expired', 'Expired'),
    )

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='assignments')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_assignments')
    assigned_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    available_from = models.DateTimeField(blank=True, null=True)
    due_date = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        unique_together = ('exam', 'student')
        ordering = ['-assigned_at']

    def __str__(self):
        return f"{self.student.username} assigned to {self.exam.title}"

class ExamQuestion(models.Model):
    QUESTION_TYPES = (
        ('text', 'Text'),
        ('audio', 'Audio'),
        ('code', 'Code'),
    )

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=50, default='text')
    marks = models.PositiveIntegerField(default=1)
    time_limit_seconds = models.PositiveIntegerField(null=True, blank=True)
    order_number = models.PositiveIntegerField(default=1)
    
    # Advanced Phase 5 Fields
    programming_language = models.CharField(max_length=50, null=True, blank=True)
    starter_code = models.TextField(null=True, blank=True)
    max_words = models.PositiveIntegerField(null=True, blank=True)
    transcript_enabled = models.BooleanField(default=True)
    max_recording_seconds = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order_number']

    def __str__(self):
        return f"Q{self.order_number}: {self.question_text[:50]}"

class ExamAttempt(models.Model):
    STATUS_CHOICES = (
        ('started', 'Started'),
        ('paused', 'Paused'),
        ('submitted', 'Submitted'),
        ('evaluated', 'Evaluated'),
        ('terminated', 'Terminated'),
    )

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='started', db_index=True)
    total_score = models.PositiveIntegerField(blank=True, null=True)
    total_violations = models.PositiveIntegerField(default=0)
    warning_count = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('exam', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.exam.title} ({self.status})"

class ExamAnswer(models.Model):
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(ExamQuestion, on_delete=models.CASCADE, related_name='answers')
    
    answer_text = models.TextField(blank=True)
    is_flagged = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Advanced Phase 5 Fields
    audio_file = models.FileField(upload_to='exam_audio/', null=True, blank=True)
    transcript_text = models.TextField(null=True, blank=True)
    transcript_status = models.CharField(max_length=20, default='waiting') # waiting, processing, ready
    code_language = models.CharField(max_length=50, null=True, blank=True)
    
    marks_obtained = models.PositiveIntegerField(blank=True, null=True)
    instructor_feedback = models.TextField(blank=True, null=True)
    
    submitted_at = models.DateTimeField(blank=True, null=True)
    auto_saved = models.BooleanField(default=False)

    class Meta:
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Answer to {self.question.id} by {self.attempt.student.username}"

class ExamViolation(models.Model):
    VIOLATION_TYPES = (
        ('TAB_HIDDEN', 'Tab Hidden'),
        ('TAB_RETURNED', 'Tab Returned'),
        ('WINDOW_BLUR', 'Window Blur'),
        ('WINDOW_FOCUS', 'Window Focus'),
        ('TAB_SWITCH', 'Tab Switch (Legacy)'),
        ('COPY_ATTEMPT', 'Copy Attempt'),
        ('PASTE_ATTEMPT', 'Paste Attempt'),
        ('RIGHT_CLICK', 'Right Click'),
        ('CAMERA_OFF', 'Camera Off'),
        ('MICROPHONE_OFF', 'Microphone Off'),
        ('FULLSCREEN_EXIT', 'Fullscreen Exit'),
    )

    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='violations')
    question = models.ForeignKey(ExamQuestion, on_delete=models.SET_NULL, null=True, blank=True, related_name='violations')
    violation_type = models.CharField(max_length=20, choices=VIOLATION_TYPES)
    severity = models.CharField(max_length=20, default='Low')
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.violation_type} at {self.timestamp} for {self.attempt}"

class ExamSnapshot(models.Model):
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='snapshots')
    question = models.ForeignKey(ExamQuestion, on_delete=models.SET_NULL, null=True, blank=True, related_name='snapshots')
    image_url = models.URLField()
    captured_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['captured_at']

    def __str__(self):
        return f"Snapshot at {self.captured_at} for {self.attempt}"

class ExamResult(models.Model):
    attempt = models.OneToOneField(ExamAttempt, on_delete=models.CASCADE, related_name='result')
    percentage = models.FloatField()
    grade = models.CharField(max_length=10, blank=True, null=True)
    published = models.BooleanField(default=False)
    published_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Result for {self.attempt}: {self.percentage}%"

class ExamImportMetadata(models.Model):
    exam = models.OneToOneField(Exam, on_delete=models.CASCADE, related_name='import_metadata')
    original_filename = models.CharField(max_length=255)
    import_date = models.DateTimeField(auto_now_add=True)
    imported_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='imported_exams')
    import_source = models.CharField(max_length=50, default='PDF')
    extraction_version = models.CharField(max_length=20, default='1.0')
    file_url = models.URLField(blank=True, null=True)
    public_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Import Metadata for {self.exam.title}"
