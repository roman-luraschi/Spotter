from rest_framework import status

from apps.core.exceptions import AppError


class RoutingError(AppError):
    """Raised when a geocoding or routing provider cannot satisfy a request."""

    default_code = 'ROUTING_ERROR'
    default_message = 'Could not calculate a route for those locations.'
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
