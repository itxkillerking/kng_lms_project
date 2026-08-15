from django.utils.deprecation import MiddlewareMixin

class CSPMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https://res.cloudinary.com; "
            "media-src 'self' blob: https://res.cloudinary.com; "
            "font-src 'self' data: https://fonts.gstatic.com https://fonts.googleapis.com; "
            "connect-src 'self' https://jawadahmed.pythonanywhere.com ws: wss:; "
            "frame-src 'self' https://www.youtube.com;"
        )
        response['Content-Security-Policy'] = csp
        return response
