import json
from pywebpush import webpush, WebPushException
from django.conf import settings
from .models import PushSubscription

def send_push_notification(user, message):
    if not getattr(settings, 'VAPID_PRIVATE_KEY', None):
        return

    subs = PushSubscription.objects.filter(user=user)
    
    if not subs.exists():
        return
        
    data = json.dumps({
        "title": f"New message from {message.sender.username}",
        "body": message.content[:50] if message.content else "Attachment sent",
        "url": f"/chat"
    })
    
    for sub in subs:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
                },
                data=data,
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": settings.VAPID_ADMIN_EMAIL},
                timeout=5
            )
        except Exception:
            sub.delete()
