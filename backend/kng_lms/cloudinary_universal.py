import os
import uuid
import cloudinary
import cloudinary.uploader
import cloudinary.api
from django.core.files.storage import Storage

# File Limits (in bytes)
LIMIT_IMAGE = 10 * 1024 * 1024       # 10 MB
LIMIT_DOCUMENT = 25 * 1024 * 1024    # 25 MB
LIMIT_VIDEO = 100 * 1024 * 1024      # 100 MB

EXT_IMAGE = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'}
EXT_VIDEO = {'.mp4', '.mkv', '.mov', '.avi', '.webm'}
EXT_DOCUMENT = {'.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.zip', '.rar', '.csv'}

class UniversalCloudinaryStorage(Storage):
    def _validate_file(self, content, ext):
        size = content.size
        
        if ext in EXT_IMAGE:
            if size > LIMIT_IMAGE:
                raise ValueError(f"Image exceeds 10MB limit (Upload size: {size / (1024*1024):.2f}MB).")
            return 'image'
        elif ext in EXT_VIDEO:
            if size > LIMIT_VIDEO:
                raise ValueError(f"Video exceeds 100MB limit (Upload size: {size / (1024*1024):.2f}MB).")
            return 'video'
        elif ext in EXT_DOCUMENT:
            if size > LIMIT_DOCUMENT:
                raise ValueError(f"Document exceeds 25MB limit (Upload size: {size / (1024*1024):.2f}MB).")
            return 'raw'
        else:
            raise ValueError(f"Unsupported file extension: {ext}")

    def _save(self, name, content):
        """
        Validates, renames, and uploads a file to Cloudinary.
        """
        # 1. Validation and Resource Type Detection
        ext = os.path.splitext(name)[1].lower()
        resource_type = self._validate_file(content, ext)

        # 2. Path & UUID Generation (No Overwrites)
        dir_name = os.path.dirname(name).replace('\\', '/')
        new_uuid = str(uuid.uuid4())
        
        # We store the final path exactly as Django expects
        # Cloudinary's public_id will be this path (excluding the extension for images/videos, but including it for raw files is often required, we will let cloudinary handle it or force it).
        # Actually, for raw files, Cloudinary includes the extension in public_id. For images/videos, it doesn't matter as much, but to be consistent, we pass the public_id without extension and add it.
        public_id = f"{dir_name}/{new_uuid}" if dir_name else new_uuid
        final_django_name = f"{public_id}{ext}"

        # 3. Upload to Cloudinary with Hard Error Catching
        try:
            # We use resource_type='auto' to let Cloudinary figure it out natively based on headers/content
            upload_result = cloudinary.uploader.upload(
                content.file,
                public_id=public_id,
                resource_type='auto',
                use_filename=False,
                unique_filename=False, # We already made it unique with UUID
                overwrite=False
            )
            
            # The result from Cloudinary
            # For raw files, Cloudinary appends the extension to the public_id if not present.
            # To ensure the DB path perfectly matches the Cloudinary path, we return final_django_name.
            return final_django_name

        except Exception as e:
            # Prevent silent local fallback by explicitly raising an error
            raise RuntimeError(f"Cloudinary upload failed: {str(e)}")

    def url(self, name):
        """
        Reconstructs the Cloudinary URL based on the file extension.
        Works for both newly uploaded files and legacy files already in DB.
        """
        # Determine if it was an image, video, or raw based on extension
        ext = os.path.splitext(name)[1].lower()
        if ext in EXT_VIDEO:
            res_type = 'video'
        elif ext in EXT_DOCUMENT:
            res_type = 'raw'
        else:
            res_type = 'image' # fallback to image for unknown/legacy

        # Some legacy files might have backslashes if uploaded on Windows
        clean_name = name.replace('\\', '/')
        
        # Strip extension for image/video public_ids (Cloudinary URL generator expects this for images/videos)
        # For raw, Cloudinary URL generator expects the extension in the public_id.
        if res_type in ['image', 'video']:
            public_id = os.path.splitext(clean_name)[0]
            url, _ = cloudinary.utils.cloudinary_url(public_id, resource_type=res_type, format=ext.strip('.'), secure=True)
        else:
            public_id = clean_name
            url, _ = cloudinary.utils.cloudinary_url(public_id, resource_type=res_type, secure=True)
            
        return url

    def exists(self, name):
        """
        Since we generate UUIDs, collisions are mathematically impossible.
        Returning False forces Django to always accept our new filename.
        """
        return False

    def delete(self, name):
        """
        Deletes the file from Cloudinary.
        """
        if not name:
            return
            
        ext = os.path.splitext(name)[1].lower()
        if ext in EXT_VIDEO:
            res_type = 'video'
        elif ext in EXT_DOCUMENT:
            res_type = 'raw'
        else:
            res_type = 'image'

        clean_name = name.replace('\\', '/')
        if res_type in ['image', 'video']:
            public_id = os.path.splitext(clean_name)[0]
        else:
            public_id = clean_name

        try:
            cloudinary.uploader.destroy(public_id, resource_type=res_type)
        except Exception as e:
            print(f"Warning: Failed to delete {public_id} from Cloudinary. {str(e)}")
