from rest_framework import serializers
from .models import Certificate

class CertificateSerializer(serializers.ModelSerializer):
    course_title = serializers.CharField(source='course.title', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = Certificate
        fields = '__all__'
        read_only_fields = ('user', 'course', 'certificate_id', 'issue_date', 'pdf_url')
