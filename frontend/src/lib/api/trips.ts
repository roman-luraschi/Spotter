import { postJson } from './client'
import type { TripPlanRequest, TripPlanResponse } from '../../types/trip'

export function planTrip(payload: TripPlanRequest): Promise<TripPlanResponse> {
  return postJson<TripPlanResponse, TripPlanRequest>('/api/trips/plan/', payload)
}
