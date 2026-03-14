from django.db import models

class GlobalSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField(help_text="Flexible value storage (string, number, or object)")
    description = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"
