import type { DutyStatus, StopType } from '../types/trip'

export const dutyStatusLabels: Record<DutyStatus, string> = {
  off_duty: 'Off Duty',
  sleeper_berth: 'Sleeper Berth',
  driving: 'Driving',
  on_duty_not_driving: 'On Duty',
}

export const stopTypeLabels: Record<StopType, string> = {
  pickup: 'Pickup',
  dropoff: 'Dropoff',
  fuel: 'Fuel',
  rest_break: 'Rest Break',
  sleeper_berth: 'Sleeper Berth',
  cycle_restart: 'Cycle Restart',
}

export function formatHours(value: number): string {
  const rounded = Math.round(value * 100) / 100
  const unit = rounded === 1 ? 'hr' : 'hrs'

  return `${formatNumber(rounded)} ${unit}`
}

export function formatMiles(value: number): string {
  return `${Math.round(value).toLocaleString()} mi`
}

export function formatNumber(value: number, digits = 1): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
  })
}

export function formatClockHour(value: number): string {
  const normalized = Math.max(0, Math.min(24, value))
  const hour = Math.floor(normalized)
  const minutes = Math.round((normalized - hour) * 60)

  return `${hour.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`
}

export function formatMinutesFromTripStart(minutes: number): string {
  const day = Math.floor(minutes / 1440) + 1
  const minuteOfDay = minutes % 1440
  const hour = Math.floor(minuteOfDay / 60)
  const minute = minuteOfDay % 60

  return `Day ${day}, ${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}`
}
