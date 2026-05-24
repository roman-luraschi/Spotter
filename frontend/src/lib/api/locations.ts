import { getJson } from './client'
import type { LocationSuggestion } from '@/types/location'

export function searchLocations(query: string): Promise<LocationSuggestion[]> {
  return getJson<LocationSuggestion[]>('/api/routing/locations/search/', { q: query })
}
