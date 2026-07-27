import os
from django.db.models.signals import pre_save, post_delete
from django.dispatch import receiver
from django.db.models import FileField, ImageField
from django.apps import apps
from django.core.files.storage import default_storage

def _delete_file(path):
    if not path:
        return
    # Only delete if it's managed by our custom storage
    try:
        default_storage.delete(path)
    except Exception as e:
        print(f"Failed to delete file {path}: {e}")

@receiver(post_delete)
def delete_files_on_model_delete(sender, instance, **kwargs):
    """Deletes files from Cloudinary when the model instance is deleted."""
    # Skip models without files to improve performance
    has_files = any(isinstance(field, (FileField, ImageField)) for field in sender._meta.get_fields())
    if not has_files:
        return

    for field in sender._meta.get_fields():
        if isinstance(field, (FileField, ImageField)):
            file_field = getattr(instance, field.name, None)
            if file_field and file_field.name:
                _delete_file(file_field.name)

@receiver(pre_save)
def delete_files_on_model_update(sender, instance, **kwargs):
    """Deletes old files from Cloudinary when a model's file field is updated."""
    if not instance.pk:
        return

    has_files = any(isinstance(field, (FileField, ImageField)) for field in sender._meta.get_fields())
    if not has_files:
        return

    try:
        old_instance = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    for field in sender._meta.get_fields():
        if isinstance(field, (FileField, ImageField)):
            old_file = getattr(old_instance, field.name, None)
            new_file = getattr(instance, field.name, None)
            if old_file and old_file.name and old_file != new_file:
                _delete_file(old_file.name)
