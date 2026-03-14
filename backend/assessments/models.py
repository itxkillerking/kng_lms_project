from django.db import models
from courses.models import Module

class Quiz(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='quizzes')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    passing_score = models.PositiveIntegerField(default=70, help_text="Percentage required to pass")
    time_limit_mins = models.PositiveIntegerField(default=30, help_text="Duration in minutes")
    max_retakes = models.PositiveIntegerField(default=3, help_text="Max number of allowed retakes")
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"Quiz: {self.title}"

class Question(models.Model):
    QUESTION_TYPES = (
        ('mcq', 'Multiple Choice'),
        ('tf', 'True/False'),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=10, choices=QUESTION_TYPES, default='mcq')
    options_data = models.JSONField(help_text="List of option strings or True/False strings")
    correct_answer = models.CharField(max_length=255, help_text="Exact string matching one of the options")
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"Q: {self.text[:50]}"

class Assignment(models.Model):
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    instructions_text = models.TextField()
    max_score = models.PositiveIntegerField(default=100)
    deadline = models.DateTimeField(blank=True, null=True)
    allowed_file_types = models.CharField(max_length=255, default=".pdf,.zip,.doc,.docx", help_text="Comma-separated extensions")
    order_index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order_index']

    def __str__(self):
        return f"Assignment: {self.title}"

class AssignmentAttachment(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='assignments/attachments/')
    filename = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return self.filename or f"Attachment for {self.assignment.title}"

