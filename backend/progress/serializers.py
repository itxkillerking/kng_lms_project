from rest_framework import serializers
from .models import UserLessonProgress

class UserLessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserLessonProgress
        fields = ['id', 'user', 'lesson', 'is_complete', 'completed_at']
        read_only_fields = ('user',)
