"""
URL configuration for kng_lms project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# TEMPORARY: Create admin user if not exists
try:
    from users.models import User
    if not User.objects.filter(username='Aqibmunir').exists():
        User.objects.create_superuser('Aqibmunir', 'admin@example.com', 'Aqib134', role='admin')
        print("TEMPORARY: Admin user 'Aqibmunir' created via startup script.")
except Exception as e:
    print(f"TEMPORARY: Error creating admin user: {e}")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/', include('courses.urls')),
    path('api/', include('assessments.urls')),
    path('api/', include('submissions.urls')),
    path('api/certificates/', include('certificates.urls')),
    path('api/progress/', include('progress.urls')),
    path('api/core/', include('core_settings.urls')),
    path('api/chat/', include('messaging.urls')),
]

from django.urls import re_path
from django.views.static import serve

urlpatterns += [
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]
