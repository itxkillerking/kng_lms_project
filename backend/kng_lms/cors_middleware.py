from django.http import HttpResponse

class CustomCorsResponseMiddleware:
    """
    Guarantees that CORS headers (Access-Control-Allow-Origin, Methods, Headers)
    are unconditionally present on ALL responses, including preflight OPTIONS,
    error responses (4xx, 5xx), and static/media requests.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse(status=200, content_type="text/plain")
        else:
            response = self.get_response(request)

        origin = request.META.get('HTTP_ORIGIN') or getattr(request, 'headers', {}).get('Origin')
        
        if origin:
            response['Access-Control-Allow-Origin'] = origin
        else:
            response['Access-Control-Allow-Origin'] = '*'

        req_headers = request.META.get('HTTP_ACCESS_CONTROL_REQUEST_HEADERS', '*')
        
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = req_headers if req_headers != '*' else 'Content-Type, Authorization, X-CSRFToken, X-Requested-With, Accept, Origin, User-Agent, DNT'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
        return response
