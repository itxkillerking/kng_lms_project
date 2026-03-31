from rest_framework import serializers
from .models import Message
from django.contrib.auth import get_user_model

User = get_user_model()

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    recipient_name = serializers.CharField(source='recipient.username', read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'recipient', 'sender_name', 'recipient_name', 'content', 'file', 'is_read', 'timestamp']
        read_only_fields = ('sender', 'timestamp')

class ConversationSerializer(serializers.Serializer):
    """Used for the chat sidebar list."""
    other_user_id = serializers.IntegerField()
    other_user_name = serializers.CharField()
    other_user_picture = serializers.CharField()
    other_user_role = serializers.CharField()
    last_message = serializers.CharField()
    last_timestamp = serializers.DateTimeField()
    unread_count = serializers.IntegerField()
