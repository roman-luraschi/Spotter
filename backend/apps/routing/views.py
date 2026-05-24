from rest_framework.response import Response
from rest_framework.views import APIView

from apps.routing.services.geocoding import NominatimGeocoder


class LocationSearchView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if len(query) < 2:
            return Response([])

        suggestions = NominatimGeocoder().search(query)
        return Response([suggestion.as_dict() for suggestion in suggestions])
