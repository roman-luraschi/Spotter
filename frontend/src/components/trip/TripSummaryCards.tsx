import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import NearMeOutlinedIcon from '@mui/icons-material/NearMeOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import { Alert, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { formatHours, formatMiles } from '@/lib/format'
import type { TripPlanResponse } from '@/types/trip'

interface TripSummaryCardsProps {
  plan: TripPlanResponse
}

export function TripSummaryCards({ plan }: TripSummaryCardsProps) {
  const hasViolations = plan.hos_summary.violations.length > 0

  const metrics: Array<{
    label: string
    value: string
    helper: string
    icon: ReactNode
  }> = [
    {
      label: 'Total miles',
      value: formatMiles(plan.route.total_miles),
      helper: 'Route distance',
      icon: <RouteOutlinedIcon aria-hidden="true" fontSize="small" />,
    },
    {
      label: 'Drive time',
      value: formatHours(plan.route.estimated_drive_hours),
      helper: 'Estimated wheel time',
      icon: <AccessTimeOutlinedIcon aria-hidden="true" fontSize="small" />,
    },
    {
      label: 'Cycle left',
      value: formatHours(plan.hos_summary.remaining_cycle_hours_end),
      helper: `${plan.hos_summary.cycle_rule} rule`,
      icon: <NearMeOutlinedIcon aria-hidden="true" fontSize="small" />,
    },
    {
      label: 'Log sheets',
      value: String(plan.daily_logs.length),
      helper: plan.daily_logs.length === 1 ? 'Daily log' : 'Daily logs',
      icon: <DescriptionOutlinedIcon aria-hidden="true" fontSize="small" />,
    },
  ]

  return (
    <Stack spacing={2}>
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}>
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
              <Stack alignItems="flex-start" spacing={1}>
                <Box color="primary.main">{metric.icon}</Box>
                <Typography color="text.secondary" variant="caption">
                  {metric.label}
                </Typography>
                <Typography color="text.primary" fontWeight={700} variant="h5">
                  {metric.value}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {metric.helper}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      {hasViolations ? (
        <Alert severity="error">
          {plan.hos_summary.violations.map((violation) => (
            <Box component="span" display="block" key={violation}>
              {violation}
            </Box>
          ))}
        </Alert>
      ) : null}
    </Stack>
  )
}
