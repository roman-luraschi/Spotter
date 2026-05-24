import { Box, Stack, Typography } from '@mui/material'

import { getDutyStatusHex } from '@/lib/design/hos-colors'
import { dutyStatusLabels, formatClockHour } from '@/lib/format'
import type { DailyLog, DutyStatus, GridSegment } from '@/types/trip'
import { LogTotals } from './LogTotals'

interface DailyLogSheetProps {
  log: DailyLog
}

const statusRows: DutyStatus[] = [
  'off_duty',
  'sleeper_berth',
  'driving',
  'on_duty_not_driving',
]

const chart = {
  width: 980,
  height: 265,
  labelWidth: 150,
  top: 32,
  rowHeight: 48,
}

const plotWidth = chart.width - chart.labelWidth - 24

export function DailyLogSheet({ log }: DailyLogSheetProps) {
  const segments = [...log.grid_segments].sort((a, b) => a.start_hour - b.start_hour)

  return (
    <Box>
      <Typography color="text.primary" fontWeight={700} mb={2} variant="h6">
        Day {log.date_index}
      </Typography>

      <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'minmax(0, 1fr)', md: 'minmax(0, 1fr) 0.95fr' }}>
        <Stack minWidth={0} spacing={2}>
          <Box
            bgcolor="background.paper"
            border="1px solid"
            borderColor="divider"
            borderRadius={2}
            maxWidth="100%"
            overflow="auto"
            sx={{
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
            }}
          >
            <svg
              aria-label={`Day ${log.date_index} daily log grid`}
              role="img"
              style={{ display: 'block', width: 920 }}
              viewBox={`0 0 ${chart.width} ${chart.height}`}
            >
              <rect fill="#ffffff" height={chart.height} width={chart.width} x="0" y="0" />
              {statusRows.map((status, index) => (
                <g key={status}>
                  <rect
                    fill={index % 2 === 0 ? '#f8fafc' : '#ffffff'}
                    height={chart.rowHeight}
                    width={plotWidth}
                    x={chart.labelWidth}
                    y={rowTop(index)}
                  />
                  <text
                    fill="#334155"
                    fontSize="14"
                    fontWeight="700"
                    textAnchor="end"
                    x={chart.labelWidth - 14}
                    y={rowCenter(status) + 5}
                  >
                    {dutyStatusLabels[status]}
                  </text>
                  <line
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    x1={chart.labelWidth}
                    x2={chart.labelWidth + plotWidth}
                    y1={rowCenter(status)}
                    y2={rowCenter(status)}
                  />
                </g>
              ))}

              {Array.from({ length: 25 }, (_, hour) => (
                <g key={hour}>
                  <line
                    stroke={hour % 6 === 0 ? '#94a3b8' : '#e2e8f0'}
                    strokeWidth={hour % 6 === 0 ? 1.5 : 1}
                    x1={xForHour(hour)}
                    x2={xForHour(hour)}
                    y1={chart.top - 12}
                    y2={chart.top + chart.rowHeight * statusRows.length}
                  />
                  <text
                    fill="#64748b"
                    fontSize="11"
                    fontWeight={hour % 6 === 0 ? 700 : 500}
                    textAnchor="middle"
                    x={xForHour(hour)}
                    y="20"
                  >
                    {hour}
                  </text>
                </g>
              ))}

              {segments.map((segment, index) => (
                <SegmentLine
                  key={`${segment.status}-${segment.start_hour}-${segment.end_hour}-${index}`}
                  segment={segment}
                />
              ))}

              {buildConnectors(segments).map((connector) => (
                <line
                  key={`${connector.hour}-${connector.from}-${connector.to}`}
                  stroke="#0f172a"
                  strokeLinecap="round"
                  strokeWidth="3"
                  x1={xForHour(connector.hour)}
                  x2={xForHour(connector.hour)}
                  y1={rowCenter(connector.from)}
                  y2={rowCenter(connector.to)}
                />
              ))}
            </svg>
          </Box>
          <LogTotals totals={log.totals} />
        </Stack>

        <Box bgcolor="background.paper" border="1px solid" borderColor="divider" borderRadius={2} minWidth={0} p={2}>
          <Typography color="text.primary" fontWeight={700} variant="body2">
            Remarks
          </Typography>
          {log.remarks.length > 0 ? (
            <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', m: 0, mt: 2, p: 0 }}>
              {log.remarks.map((remark, index) => (
                <Typography
                  color="text.secondary"
                  component="li"
                  key={`${remark.time_hour}-${remark.event_type}-${index}`}
                  variant="body2"
                >
                  <Box color="text.primary" component="span" fontWeight={700}>
                    {formatClockHour(remark.time_hour)}
                  </Box>{' '}
                  {remark.description || remark.event_type}
                  {remark.location ? ` (${remark.location})` : ''}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary" mt={2} variant="body2">
              No remarks were returned for this day.
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  )
}

function SegmentLine({ segment }: { segment: GridSegment }) {
  const y = rowCenter(segment.status)

  return (
    <line
      stroke={segmentColor(segment.status)}
      strokeLinecap="round"
      strokeWidth="5"
      x1={xForHour(segment.start_hour)}
      x2={xForHour(segment.end_hour)}
      y1={y}
      y2={y}
    />
  )
}

function buildConnectors(segments: GridSegment[]) {
  return segments.slice(1).flatMap((segment, index) => {
    const previous = segments[index]

    if (!previous || previous.status === segment.status) {
      return []
    }

    return [
      {
        hour: segment.start_hour,
        from: previous.status,
        to: segment.status,
      },
    ]
  })
}

function rowTop(index: number): number {
  return chart.top + index * chart.rowHeight
}

function rowCenter(status: DutyStatus): number {
  const index = statusRows.indexOf(status)

  return rowTop(index) + chart.rowHeight / 2
}

function xForHour(hour: number): number {
  return chart.labelWidth + (Math.max(0, Math.min(24, hour)) / 24) * plotWidth
}

function segmentColor(status: DutyStatus): string {
  return getDutyStatusHex(status)
}
