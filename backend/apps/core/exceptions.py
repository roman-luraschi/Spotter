from rest_framework import status


class AppError(Exception):
    default_code = 'APP_ERROR'
    default_message = 'Application error.'
    status_code = status.HTTP_400_BAD_REQUEST

    def __init__(
        self,
        message: str | None = None,
        *,
        code: str | None = None,
        status_code: int | None = None,
        details: dict | list | None = None,
    ):
        self.code = code or self.default_code
        self.message = message or self.default_message
        self.status_code = status_code or self.status_code
        self.details = details or {}
        super().__init__(self.message)
