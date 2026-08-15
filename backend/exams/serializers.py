from rest_framework import serializers
from .models import (
    Exam, ExamSettings, ExamQuestion, ExamAttempt, ExamAnswer,
    ExamViolation, ExamSnapshot, ExamResult
)

class ExamSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSettings
        exclude = ('id', 'exam')

class ExamQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamQuestion
        fields = [
            'id', 'exam', 'question_text', 'question_type', 'marks', 
            'time_limit_seconds', 'order_number',
            'programming_language', 'starter_code', 'max_words',
            'transcript_enabled', 'max_recording_seconds'
        ]

class ExamSerializer(serializers.ModelSerializer):
    settings = ExamSettingsSerializer(required=False)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    # Phase 7 Dashboard Statistics
    assigned_count = serializers.SerializerMethodField()
    not_started_count = serializers.SerializerMethodField()
    in_progress_count = serializers.SerializerMethodField()
    submitted_count = serializers.SerializerMethodField()
    evaluated_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = '__all__'
        read_only_fields = ('created_by', 'status') # Status should be updated via specific actions

    def get_question_count(self, obj):
        return obj.questions.count()

    def get_assigned_count(self, obj):
        if obj.assign_to_all_enrolled:
            return obj.course.enrollments.count()
        return obj.assignments.filter(status='active').count()

    def get_not_started_count(self, obj):
        assigned = self.get_assigned_count(obj)
        attempted = obj.attempts.count()
        return max(0, assigned - attempted)

    def get_in_progress_count(self, obj):
        return obj.attempts.filter(status__in=['started', 'paused']).count()

    def get_submitted_count(self, obj):
        return obj.attempts.filter(status='submitted').count()

    def get_evaluated_count(self, obj):
        return obj.attempts.filter(status='evaluated').count()

    def get_average_score(self, obj):
        from django.db.models import Avg
        avg = obj.attempts.filter(status='evaluated').aggregate(Avg('total_score'))['total_score__avg']
        return round(avg, 2) if avg else 0

    def create(self, validated_data):
        settings_data = validated_data.pop('settings', None)
        exam = Exam.objects.create(**validated_data)
        
        if settings_data:
            ExamSettings.objects.create(exam=exam, **settings_data)
        else:
            # Create default settings if none provided
            ExamSettings.objects.create(exam=exam)
            
        return exam

    def update(self, instance, validated_data):
        settings_data = validated_data.pop('settings', None)
        
        # Update Exam fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update ExamSettings
        if settings_data is not None:
            try:
                settings_instance = instance.settings
            except ExamSettings.DoesNotExist:
                settings_instance = ExamSettings.objects.create(exam=instance)
                
            for attr, value in settings_data.items():
                setattr(settings_instance, attr, value)
            settings_instance.save()
            
        return instance



class ExamAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamAnswer
        fields = [
            'id', 'attempt', 'question', 'answer_text', 
            'is_flagged', 'created_at', 'updated_at',
            'audio_file', 'transcript_text', 'transcript_status',
            'code_language', 'marks_obtained', 'instructor_feedback'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_flagged']

    def validate_audio_file(self, value):
        if not value:
            return value
            
        if value.size > 15 * 1024 * 1024:
            raise serializers.ValidationError("Audio file is too large. Maximum size is 15MB.")
            
        value.seek(0)
        header = value.read(12)
        is_valid_audio = False
        
        # Check magic bytes for supported audio formats (WebM, OGG, MP3, WAV)
        if header.startswith(b'\x1aE\xdf\xa3'): # WebM/MKV
            is_valid_audio = True
        elif header.startswith(b'OggS'): # OGG
            is_valid_audio = True
        elif header.startswith(b'ID3') or header.startswith(b'\xff\xfb') or header.startswith(b'\xff\xf3') or header.startswith(b'\xff\xf2'): # MP3
            is_valid_audio = True
        elif header[0:4] == b'RIFF' and header[8:12] == b'WAVE': # WAV
            is_valid_audio = True
            
        if not is_valid_audio:
            raise serializers.ValidationError("Invalid audio format. Allowed: WebM, OGG, MP3, WAV.")
            
        value.seek(0)
        return value


class ExamAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    
    # We only include answers when specifically requested or needed
    answers = ExamAnswerSerializer(many=True, read_only=True)

    class Meta:
        model = ExamAttempt
        fields = '__all__'
        read_only_fields = ('student', 'started_at', 'last_activity', 'submitted_at', 'status', 'total_score', 'total_violations', 'warning_count')


class ExamViolationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamViolation
        fields = [
            'id', 'attempt', 'question', 'violation_type', 
            'severity', 'timestamp', 'details'
        ]
        read_only_fields = ('timestamp',)


class ExamSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamSnapshot
        fields = '__all__'
        read_only_fields = ('captured_at',)


class ExamResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamResult
        fields = '__all__'
