import type {
  ApiErrorCode,
  ApiErrorDetails,
  ApiErrorPayload,
  ApiErrorResponse,
  LegacyApiErrorBody,
} from '@/types/api'

const fallbackBaseUrl = 'http://127.0.0.1:8000'

export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? fallbackBaseUrl

export class ApiError extends Error {
  code: ApiErrorCode
  status: number
  details?: ApiErrorDetails

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode = 'API_ERROR',
    details?: ApiErrorDetails,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export async function postJson<TResponse, TPayload>(
  path: string,
  payload: TPayload,
): Promise<TResponse> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const body = (await safeParseJson(response)) as ApiErrorResponse | LegacyApiErrorBody | TResponse | null

  if (!response.ok) {
    throw createApiError(body, response.status)
  }

  return body as TResponse
}

export async function getJson<TResponse>(
  path: string,
  params?: Record<string, string>,
): Promise<TResponse> {
  const url = new URL(`${apiBaseUrl}${path}`)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }

  const response = await fetch(url.toString())
  const body = (await safeParseJson(response)) as ApiErrorResponse | LegacyApiErrorBody | TResponse | null

  if (!response.ok) {
    throw createApiError(body, response.status)
  }

  return body as TResponse
}

async function safeParseJson(response: Response): Promise<unknown | null> {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function createApiError(body: unknown, status: number): ApiError {
  const errorPayload = getApiErrorPayload(body)

  if (errorPayload) {
    return new ApiError(errorPayload.message, status, errorPayload.code, errorPayload.details)
  }

  const legacyErrorBody = body as LegacyApiErrorBody | null
  return new ApiError(
    getLegacyErrorMessage(legacyErrorBody, status),
    status,
    status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'API_ERROR',
    legacyErrorBody ?? undefined,
  )
}

function getApiErrorPayload(body: unknown): ApiErrorPayload | null {
  if (!body || typeof body !== 'object') {
    return null
  }

  const error = (body as Partial<ApiErrorResponse>).error
  if (!error || typeof error !== 'object') {
    return null
  }

  if (typeof error.code !== 'string' || typeof error.message !== 'string') {
    return null
  }

  return error
}

function getLegacyErrorMessage(body: LegacyApiErrorBody | null, status: number): string {
  if (typeof body?.error === 'string') {
    return body.error
  }

  if (body?.detail) {
    return body.detail
  }

  const fieldError = body ? Object.values(body).flat().find(Boolean) : undefined

  if (fieldError) {
    return String(fieldError)
  }

  if (status === 422) {
    return 'Could not calculate a route for those locations.'
  }

  return 'Something went wrong while planning the trip.'
}
