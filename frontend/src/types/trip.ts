export type DutyStatus =
  | 'off_duty'
  | 'sleeper_berth'
  | 'driving'
  | 'on_duty_not_driving'

export type StopType =
  | 'pickup'
  | 'dropoff'
  | 'fuel'
  | 'rest_break'
  | 'sleeper_berth'
  | 'cycle_restart'

export interface TripPlanRequest {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: number
}

export interface RouteGeometry {
  type: 'LineString'
  coordinates: CoordinatePair[]
}

export type CoordinatePair = [longitude: number, latitude: number]

export interface RouteWaypoint {
  label: string
  latitude: number
  longitude: number
}

export interface RouteData {
  total_miles: number
  estimated_drive_hours: number
  polyline: CoordinatePair[]
  geometry: RouteGeometry
  legs: unknown[]
  waypoints: RouteWaypoint[]
}

export interface Stop {
  type: StopType
  status: DutyStatus
  start_minute: number
  end_minute: number
  duration_minutes: number
  duration_hours: number
  distance_miles: number
  location: string
  description: string
}

export interface HosSummary {
  cycle_rule: '70/8'
  current_cycle_used_hours: number
  remaining_cycle_hours_start: number
  remaining_cycle_hours_end: number
  violations: string[]
}

export interface GridSegment {
  status: DutyStatus
  start_hour: number
  end_hour: number
  duration_hours: number
  event_type: string
  location: string
  description: string
}

export interface DailyLogTotals {
  off_duty: number
  sleeper_berth: number
  driving: number
  on_duty_not_driving: number
}

export interface DailyLogRemark {
  time_hour: number
  event_type: string
  location: string
  description: string
}

export interface DailyLog {
  date_index: number
  grid_segments: GridSegment[]
  totals: DailyLogTotals
  remarks: DailyLogRemark[]
}

export interface TimelineEvent extends Stop {}

export interface TripPlanResponse {
  route: RouteData
  stops: Stop[]
  hos_summary: HosSummary
  daily_logs: DailyLog[]
  timeline: TimelineEvent[]
}

