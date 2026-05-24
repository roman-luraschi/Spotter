import requests
from django.conf import settings

from apps.routing.exceptions import RoutingError
from apps.routing.services.types import Coordinate, RouteLeg

METERS_PER_MILE = 1609.344
SECONDS_PER_HOUR = 3600


class OSRMRouter:
    def __init__(self, base_url: str | None = None, timeout: int | None = None):
        self.base_url = (base_url or settings.OSRM_BASE_URL).rstrip('/')
        self.timeout = timeout or settings.ROUTING_TIMEOUT_SECONDS

    def route(self, coordinates: list[Coordinate]) -> dict:
        if len(coordinates) < 2:
            raise RoutingError(
                'At least two coordinates are required to calculate a route',
                code='ROUTE_REQUIRES_TWO_COORDINATES',
            )

        coordinate_path = ';'.join(coordinate.as_osrm_pair() for coordinate in coordinates)
        response = requests.get(
            f'{self.base_url}/route/v1/driving/{coordinate_path}',
            params={'overview': 'full', 'geometries': 'geojson', 'steps': 'false'},
            timeout=self.timeout,
        )
        if response.status_code >= 400:
            raise RoutingError('Routing provider failed', code='ROUTING_PROVIDER_FAILED')

        payload = response.json()
        if payload.get('code') != 'Ok' or not payload.get('routes'):
            raise RoutingError(
                payload.get('message') or 'No route found',
                code='ROUTE_NOT_FOUND',
            )

        route = payload['routes'][0]
        geometry = route.get('geometry', {'type': 'LineString', 'coordinates': []})
        legs = []
        for index, leg in enumerate(route.get('legs', [])):
            legs.append(
                RouteLeg(
                    start_label=coordinates[index].label,
                    end_label=coordinates[index + 1].label,
                    distance_miles=leg['distance'] / METERS_PER_MILE,
                    duration_hours=leg['duration'] / SECONDS_PER_HOUR,
                )
            )

        return {
            'total_miles': round(route['distance'] / METERS_PER_MILE, 2),
            'estimated_drive_hours': round(route['duration'] / SECONDS_PER_HOUR, 2),
            'polyline': geometry.get('coordinates', []),
            'geometry': geometry,
            'legs': [leg.as_dict() for leg in legs],
            'waypoints': [coordinate.as_dict() for coordinate in coordinates],
        }
