from rest_framework import serializers
from .models import GlobalSetting

class GlobalSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalSetting
        fields = '__all__'
