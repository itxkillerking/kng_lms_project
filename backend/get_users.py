import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kng_lms.settings')
django.setup()

from users.models import User

users = User.objects.all()
print("Username | Password (Hashed)")
print("-" * 30)
for user in users:
    print(f"{user.username} | {user.password}")
