import os
import django
import sys
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kng_lms.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.filter(is_superuser=True).first()

from rest_framework_simplejwt.tokens import RefreshToken
refresh = RefreshToken.for_user(admin)
token = str(refresh.access_token)

import urllib.request
import urllib.error
import re

url = 'http://localhost:8000/api/enrollment-requests/1/accept/'
req = urllib.request.Request(url, method='POST')
req.add_header('Authorization', f'Bearer {token}')

try:
    with urllib.request.urlopen(req) as response:
        pass
except urllib.error.HTTPError as e:
    html = e.read().decode('utf-8')
    match = re.search(r'<title>(.*?)</title>', html)
    if match:
        print('EXCEPTION TITLE:', match.group(1))
    
    start = html.find('Traceback (most recent call last):')
    if start != -1:
        end = html.find('</pre>', start)
        print('TRACEBACK:')
        print(html[start:end].replace('&quot;', '\"').replace('&lt;', '<').replace('&gt;', '>'))
