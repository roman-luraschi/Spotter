import type { TripPlanRequest } from '../types/trip'

export type TripFormErrors = Partial<Record<keyof TripPlanRequest, string>>

export function validateTripRequest(payload: TripPlanRequest): TripFormErrors {
  const errors: TripFormErrors = {}

  if (!payload.current_location.trim()) {
    errors.current_location = 'Current location is required.'
  }

  if (!payload.pickup_location.trim()) {
    errors.pickup_location = 'Pickup location is required.'
  }

  if (!payload.dropoff_location.trim()) {
    errors.dropoff_location = 'Dropoff location is required.'
  }

  if (Number.isNaN(payload.current_cycle_used_hours)) {
    errors.current_cycle_used_hours = 'Enter current cycle hours.'
  } else if (payload.current_cycle_used_hours < 0 || payload.current_cycle_used_hours > 70) {
    errors.current_cycle_used_hours = 'Cycle used must be between 0 and 70 hours.'
  }

  return errors
}

export function hasErrors(errors: TripFormErrors): boolean {
  return Object.keys(errors).length > 0
}
