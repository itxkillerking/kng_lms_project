from rest_framework import serializers
from .models import QuizAttempt, AssignmentSubmission

class QuizAttemptSerializer(serializers.ModelSerializer):
    answers = serializers.JSONField(write_only=True, required=False, help_text="Dict of question_id: answer_value")
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)

    class Meta:
        model = QuizAttempt
        fields = '__all__'
        read_only_fields = ('user', 'score', 'passed')

    def create(self, validated_data):
        answers = validated_data.pop('answers', {})
        quiz = validated_data['quiz']
        
        questions = quiz.questions.all()
        total_questions = questions.count()
        
        if total_questions == 0:
            score = 100
        else:
            correct = 0
            for q in questions:
                user_answer = answers.get(str(q.id))
                if user_answer == q.correct_answer:
                    correct += 1
            score = int((correct / total_questions) * 100)
            
        passed = score >= quiz.passing_score
        validated_data['score'] = score
        validated_data['passed'] = passed
        
        return super().create(validated_data)

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    student_name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = '__all__'
        read_only_fields = ('user',)
