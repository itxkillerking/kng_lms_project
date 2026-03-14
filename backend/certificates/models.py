from django.db import models
from django.conf import settings
from courses.models import Course
import uuid

class Certificate(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='certificates')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='certificates')
    certificate_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    issue_date = models.DateTimeField(auto_now_add=True)
    pdf_url = models.URLField(blank=True, null=True, help_text="Link to generated PDF")

    class Meta:
        unique_together = ('user', 'course')

    def __str__(self):
        return f"{self.user.username} - {self.course.title} Certificate"
