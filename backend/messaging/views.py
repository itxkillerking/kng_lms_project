from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Max, Count
from .models import Message
from .serializers import MessageSerializer, ConversationSerializer
from django.contrib.auth import get_user_model

User = get_user_model()

class MessagingViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(
            Q(sender=self.request.user) | Q(recipient=self.request.user)
        ).order_by('timestamp')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    @action(detail=False, methods=['get'])
    def conversations(self, request):
        """Get a list of all users the current user has chatted with, plus contextual contacts."""
        user = request.user
        # 1. Get real conversation partners (anyone they've already chatted with)
        sent_to = Message.objects.filter(sender=user).values_list('recipient', flat=True)
        received_from = Message.objects.filter(recipient=user).values_list('sender', flat=True)
        all_contact_ids = set(list(sent_to) + list(received_from))
        
        # 2. Role-based contact discovery
        from courses.models import CourseEnrollment
        
        if user.role == 'admin':
            # Admins can see all active users
            all_users = User.objects.filter(account_status='active').exclude(id=user.id).values_list('id', flat=True)
            all_contact_ids.update(all_users)
        elif user.role == 'instructor':
            # Instructors see students in their courses
            my_students = CourseEnrollment.objects.filter(course__instructor=user).values_list('student', flat=True)
            all_contact_ids.update(my_students)
            # Instructors also see all admins
            admins = User.objects.filter(role='admin').exclude(id=user.id).values_list('id', flat=True)
            all_contact_ids.update(admins)
        elif user.role == 'student':
            # Students see instructors of enrolled courses
            enrolled_instructors = CourseEnrollment.objects.filter(student=user).values_list('course__instructor', flat=True)
            all_contact_ids.update(enrolled_instructors)
            # Students also see all admins
            admins = User.objects.filter(role='admin').exclude(id=user.id).values_list('id', flat=True)
            all_contact_ids.update(admins)

        results = []
        for contact_id in all_contact_ids:
            if contact_id == user.id: continue # Don't chat with self
            
            try:
                contact = User.objects.get(id=contact_id)
            except User.DoesNotExist:
                continue

            last_msg = Message.objects.filter(
                Q(sender=user, recipient=contact) | Q(sender=contact, recipient=user)
            ).last()
            
            unread = Message.objects.filter(sender=contact, recipient=user, is_read=False).count()
            
            results.append({
                'other_user_id': contact.id,
                'other_user_name': f"{contact.first_name} {contact.last_name}".strip() or contact.username,
                'other_user_picture': request.build_absolute_uri(contact.profile_picture.url) if contact.profile_picture else None,
                'other_user_role': contact.role,
                'last_message': last_msg.content[:50] if last_msg and last_msg.content else ("File attachment" if last_msg else "Start a new conversation..."),
                'last_timestamp': last_msg.timestamp if last_msg else None,
                'unread_count': unread
            })
        
        # Sort: Active conversations first, then suggested ones
        results.sort(key=lambda x: (x['last_timestamp'] is None, x['last_timestamp'] if x['last_timestamp'] else 0), reverse=True)
        # Note: reverse=True with None logic might need care. 
        # Actually x['last_timestamp'] is None will be True (1) or False (0).
        # Better:
        results.sort(key=lambda x: x['last_timestamp'].timestamp() if x['last_timestamp'] else 0, reverse=True)
        
        return Response(results)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """Get chat history with a specific user."""
        other_user_id = request.query_params.get('user_id')
        if not other_user_id:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        messages = Message.objects.filter(
            Q(sender=request.user, recipient_id=other_user_id) | 
            Q(sender_id=other_user_id, recipient=request.user)
        ).order_by('timestamp')
        
        # Mark as read
        messages.filter(recipient=request.user, is_read=False).update(is_read=True)
        
        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Global unread count for notifications."""
        count = Message.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": count})
