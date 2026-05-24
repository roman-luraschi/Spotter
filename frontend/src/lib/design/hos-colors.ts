import type { DutyStatus, StopType } from '../../types/trip'

export const dutyStatusColors: Record<DutyStatus, { hex: string }> = {
  off_duty: { hex: '#22C55E' },
  sleeper_berth: { hex: '#7C3AED' },
  driving: { hex: '#3B82F6' },
  on_duty_not_driving: { hex: '#E68A24' },
}

export const stopMarkerColors: Record<StopType, string> = {
  pickup: '#8B6914',
  dropoff: '#22C55E',
  fuel: '#E68A24',
  rest_break: '#3B82F6',
  sleeper_berth: '#3B82F6',
  cycle_restart: '#3B82F6',
}

export const departureMarkerColor = '#64748B'

export function getDutyStatusHex(status: DutyStatus): string {
  return dutyStatusColors[status].hex
}

export function getStopMarkerColor(type: StopType): string {
  return stopMarkerColors[type]
}

export const mapLegendItems = [
  { label: 'Pickup', color: stopMarkerColors.pickup },
  { label: 'Rest', color: stopMarkerColors.rest_break },
  { label: 'Dropoff', color: stopMarkerColors.dropoff },
  { label: 'Fuel', color: stopMarkerColors.fuel },
] as const
