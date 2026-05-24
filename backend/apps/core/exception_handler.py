from rest_framework import status
from rest_framework.exceptions import ErrorDetail, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.core.exceptions import AppError


def custom_exception_handler(exc, context):
    if isinstance(exc, AppError):
        return Response(
            {
                'error': {
                    'code': exc.code,
                    'message': exc.message,
                    'details': exc.details,
                }
            },
            status=exc.status_code,
        )

    response = drf_exception_handler(exc, context)

    if response is None:
        return Response(
            {
                'error': {
                    'code': 'INTERNAL_SERVER_ERROR',
                    'message': 'Unexpected server error.',
                    'details': {},
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    details = _normalize_error_details(response.data)
    response.data = {
        'error': {
            'code': _get_error_code(exc, response.status_code),
            'message': _get_error_message(exc, response.status_code),
            'details': details,
        }
    }
    return response


def _get_error_code(exc, status_code: int) -> str:
    if isinstance(exc, ValidationError):
        return 'VALIDATION_ERROR'

    if hasattr(exc, 'get_codes'):
        code = _first_value(exc.get_codes())
        if code:
            return str(code).upper().replace('-', '_')

    if status_code >= 500:
        return 'INTERNAL_SERVER_ERROR'

    return 'API_ERROR'


def _get_error_message(exc, status_code: int) -> str:
    if isinstance(exc, ValidationError):
        return 'Invalid request data.'

    if hasattr(exc, 'detail'):
        detail = _first_value(_normalize_error_details(exc.detail))
        if detail:
            return str(detail)

    if status_code >= 500:
        return 'Unexpected server error.'

    return 'Request failed.'


def _normalize_error_details(value):
    if isinstance(value, ErrorDetail):
        return str(value)

    if isinstance(value, list):
        return [_normalize_error_details(item) for item in value]

    if isinstance(value, dict):
        return {key: _normalize_error_details(item) for key, item in value.items()}

    return value


def _first_value(value):
    if isinstance(value, dict):
        for item in value.values():
            found = _first_value(item)
            if found:
                return found
        return None

    if isinstance(value, list):
        for item in value:
            found = _first_value(item)
            if found:
                return found
        return None

    return value
