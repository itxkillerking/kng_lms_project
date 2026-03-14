from rest_framework import serializers
from .models import Course, Module, Lesson, Announcement, Category, Review
from django.db.models import Avg

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class AnnouncementSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    
    class Meta:
        model = Announcement
        fields = '__all__'
        read_only_fields = ('teacher',)

class ReviewSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('student',)

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'

class ModuleSerializer(serializers.ModelSerializer):
    lessons = LessonSerializer(many=True, read_only=True)
    quizzes = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()

    class Meta:
        model = Module
        fields = '__all__'

    def get_quizzes(self, obj):
        from assessments.serializers import QuizSerializer
        return QuizSerializer(obj.quizzes.all(), many=True).data

    def get_assignments(self, obj):
        from assessments.serializers import AssignmentSerializer
        return AssignmentSerializer(obj.assignments.all(), many=True).data

class CourseSerializer(serializers.ModelSerializer):
    modules = ModuleSerializer(many=True, read_only=True)
    announcements = AnnouncementSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    instructor_name = serializers.CharField(source='instructor.username', read_only=True)
    instructor_title = serializers.CharField(source='instructor.instructor_title', read_only=True)
    instructor_bio = serializers.CharField(source='instructor.bio', read_only=True)
    instructor_experience = serializers.CharField(source='instructor.experience', read_only=True)
    instructor_picture = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    
    # Metadata
    total_lessons = serializers.ReadOnlyField()
    total_quizzes = serializers.ReadOnlyField()
    total_assignments = serializers.ReadOnlyField()
    total_duration_mins = serializers.ReadOnlyField()

    def get_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import CourseEnrollment
            enrollment = CourseEnrollment.objects.filter(student=request.user, course=obj).first()
            if enrollment:
                return enrollment.progress_percentage
        return 0

    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 4.9 # Default high for brand new courses

    def get_review_count(self, obj):
        return obj.reviews.count()

    def get_student_count(self, obj):
        return obj.enrollments.count()

    def get_instructor_picture(self, obj):
        if obj.instructor and obj.instructor.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.instructor.profile_picture.url)
            return f"http://localhost:8000{obj.instructor.profile_picture.url}"
        return None

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description', 'thumbnail', 'price', 
            'moderation_status', 'created_at', 'updated_at', 'category', 'instructor',
            'modules', 'announcements', 'reviews', 'instructor_name', 
            'instructor_title', 'instructor_bio', 'instructor_experience', 'instructor_picture', 
            'category_name', 'average_rating', 'review_count', 'student_count', 'progress',
            'total_lessons', 'total_quizzes', 'total_assignments', 'total_duration_mins'
        ]
        read_only_fields = () # Allow instructor to be set manually by admin
