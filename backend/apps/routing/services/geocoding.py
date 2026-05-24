import requests
from dataclasses import dataclass
from django.conf import settings

from apps.routing.exceptions import RoutingError
from apps.routing.services.types import Coordinate


@dataclass(frozen=True)
class LocationSuggestion:
    label: str
    display_name: str
    latitude: float
    longitude: float

    def as_dict(self) -> dict:
        return {
            'label': self.label,
            'display_name': self.display_name,
            'latitude': self.latitude,
            'longitude': self.longitude,
        }


class NominatimGeocoder:
    def __init__(self, base_url: str | None = None, user_agent: str | None = None, timeout: int | None = None):
        self.base_url = (base_url or settings.NOMINATIM_BASE_URL).rstrip('/')
        self.user_agent = user_agent or settings.NOMINATIM_USER_AGENT
        self.timeout = timeout or settings.ROUTING_TIMEOUT_SECONDS

    def geocode(self, query: str) -> Coordinate:
        response = requests.get(
            f'{self.base_url}/search',
            params={'q': query, 'format': 'json', 'limit': 1},
            headers={'User-Agent': self.user_agent},
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            raise RoutingError(
                f'Geocoding provider failed for "{query}"',
                code='GEOCODING_PROVIDER_FAILED',
                details={'query': query},
            )

        results = response.json()
        if not results:
            raise RoutingError(
                f'Location not found: {query}',
                code='LOCATION_NOT_FOUND',
                details={'query': query},
            )

        first = results[0]
        return Coordinate(
            label=first.get('display_name') or query,
            latitude=float(first['lat']),
            longitude=float(first['lon']),
        )

    def search(self, query: str, limit: int = 5) -> list[LocationSuggestion]:
        response = requests.get(
            f'{self.base_url}/search',
            params={
                'q': query,
                'format': 'json',
                'limit': limit,
                'addressdetails': 1,
                'countrycodes': 'us',
            },
            headers={'User-Agent': self.user_agent},
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            raise RoutingError(
                f'Location search failed for "{query}"',
                code='LOCATION_SEARCH_FAILED',
                details={'query': query},
            )

        results = response.json()
        return [_format_location_suggestion(result) for result in results]


def _format_location_suggestion(result: dict) -> LocationSuggestion:
    address = result.get('address') or {}
    city = (
        address.get('city')
        or address.get('town')
        or address.get('village')
        or address.get('hamlet')
        or address.get('municipality')
    )
    state = address.get('state')
    display_name = result.get('display_name') or ''

    if city and state:
        label = f'{city}, {state}'
    elif city:
        label = city
    else:
        label = display_name.split(',')[0] if display_name else 'Unknown location'

    return LocationSuggestion(
        label=label,
        display_name=display_name,
        latitude=float(result['lat']),
        longitude=float(result['lon']),
    )
