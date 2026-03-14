from rest_framework import serializers
from .models import Quiz, Question, Assignment, AssignmentAttachment

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = '__all__'

class AssignmentAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssignmentAttachment
        fields = '__all__'

class AssignmentSerializer(serializers.ModelSerializer):
    attachments = AssignmentAttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Assignment
        fields = '__all__'
