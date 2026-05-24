export type ApiErrorCode =
  | 'API_ERROR'
  | 'GEOCODING_PROVIDER_FAILED'
  | 'INTERNAL_SERVER_ERROR'
  | 'LOCATION_NOT_FOUND'
  | 'LOCATION_SEARCH_FAILED'
  | 'ROUTE_NOT_FOUND'
  | 'ROUTE_REQUIRES_TWO_COORDINATES'
  | 'ROUTING_ERROR'
  | 'ROUTING_PROVIDER_FAILED'
  | 'VALIDATION_ERROR'
  | (string & {})

export type ApiErrorDetails = Record<string, unknown> | unknown[]

export interface ApiErrorPayload {
  code: ApiErrorCode
  message: string
  details?: ApiErrorDetails
}

export interface ApiErrorResponse {
  error: ApiErrorPayload
}

export interface LegacyApiErrorBody {
  error?: string
  detail?: string
  [field: string]: string | string[] | undefined
}
