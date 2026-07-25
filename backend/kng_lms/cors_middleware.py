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
            response = HttpResponse(status=200)
        else:
            response = self.get_response(request)

        origin = request.headers.get('Origin')
        allowed_origins = [
            'https://klstechcampus.netlify.app',
            'http://localhost:5173',
            'http://localhost:3000',
            'http://127.0.0.1:5173',
            'http://127.0.0.1:3000',
        ]

        if origin:
            if origin in allowed_origins or origin.endswith('.netlify.app') or origin.endswith('.vercel.app'):
                response['Access-Control-Allow-Origin'] = origin
            else:
                response['Access-Control-Allow-Origin'] = '*'
        else:
            response['Access-Control-Allow-Origin'] = '*'

        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-CSRFToken, X-Requested-With, Accept, Origin, User-Agent, DNT'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
        return response
