from rest_framework.throttling import SimpleRateThrottle, UserRateThrottle, AnonRateThrottle

class TargetedIPRateThrottle(SimpleRateThrottle):
    """
    Throttles by both IP and an identifier (like email or username) if present in the request.
    This prevents distributed brute-force attacks against a single account, while also
    preventing a single IP from brute-forcing multiple accounts.
    """
    def get_cache_key(self, request, view):
        ident = request.data.get('email') or request.data.get('username')
        ip = self.get_ident(request)
        
        if ident:
            # Throttle this specific user target
            return self.cache_format % {'scope': self.scope, 'ident': ident}
        # Fallback to IP
        return self.cache_format % {'scope': self.scope, 'ident': ip}

class LoginRateThrottle(TargetedIPRateThrottle):
    scope = 'login'

class OTPRequestRateThrottle(TargetedIPRateThrottle):
    scope = 'otp_request'

class OTPVerifyRateThrottle(TargetedIPRateThrottle):
    scope = 'otp_verify'

class ExamStartThrottle(UserRateThrottle):
    scope = 'exam_start'

class PdfUploadThrottle(UserRateThrottle):
    scope = 'pdf_upload'
