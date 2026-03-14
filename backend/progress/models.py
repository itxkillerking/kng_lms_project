from django.db import models
from django.conf import settings
from courses.models import Lesson

class UserLessonProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='user_progress')
    is_complete = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'lesson')
        verbose_name_plural = "User Lesson Progress"

    def __str__(self):
        return f"{self.user.username} - {self.lesson.title} ({'Complete' if self.is_complete else 'Incomplete'})"
