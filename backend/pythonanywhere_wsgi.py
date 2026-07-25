# +-----------------------------------------------------------------------+
# | PythonAnywhere WSGI Configuration for KNG LMS (jawadahmed)            |
# +-----------------------------------------------------------------------+
# Copy and paste this file content into your PythonAnywhere WSGI file at:
# /var/www/jawadahmed_pythonanywhere_com_wsgi.py

import os
import sys

# Path to backend directory where manage.py is located
path = '/home/jawadahmed/kng_lms_project/backend'
if path not in sys.path:
    sys.path.insert(0, path)

# Alternative path fallback in case repo was cloned directly into home
alt_path = '/home/jawadahmed/backend'
if alt_path not in sys.path:
    sys.path.insert(0, alt_path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'kng_lms.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
