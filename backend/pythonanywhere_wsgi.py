# +-----------------------------------------------------------------------+
# | PythonAnywhere WSGI Configuration for KNG LMS (jawadahmed)            |
# +-----------------------------------------------------------------------+
# Copy and paste this exact code into your PythonAnywhere WSGI file at:
# /var/www/jawadahmed_pythonanywhere_com_wsgi.py

import os
import sys

# 1. Project Directory Path
path = '/home/jawadahmed/kng_lms_project/backend'
if path not in sys.path:
    sys.path.insert(0, path)

alt_path = '/home/jawadahmed/backend'
if alt_path not in sys.path:
    sys.path.insert(0, alt_path)

# 2. Environment Variables
os.environ['DATABASE_URL'] = 'postgresql://neondb_owner:npg_NlIBkSDxL29u@ep-old-bonus-aeffkwhk-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
os.environ['CLOUDINARY_URL'] = 'cloudinary://378464985918565:8es5BIGhN_WCha9AbBbm7qefYRI@dooted3th'
os.environ['SECRET_KEY'] = 'kls-tech-campus-super-secret-key-2026'
os.environ['DEBUG'] = 'False'
os.environ['ALLOWED_HOSTS'] = 'jawadahmed.pythonanywhere.com klstechcampus.netlify.app localhost 127.0.0.1 *'

# 3. Settings Module
os.environ['DJANGO_SETTINGS_MODULE'] = 'kng_lms.settings'

# 4. Initialize WSGI Application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
