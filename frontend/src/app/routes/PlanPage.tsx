import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Alert, Box, Card, CardContent, Container, Skeleton, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

import { AppHeader } from '@/components/layout/AppHeader'
import { DailyLogTabs } from '@/components/logs/DailyLogTabs'
import { RouteMap } from '@/components/map/RouteMap'
import { StopsTimeline } from '@/components/stops/StopsTimeline'
import { TripSearchBar } from '@/components/trip/TripSearchBar'
import { TripSummaryCards } from '@/components/trip/TripSummaryCards'
import { useTripPlan } from '@/context/TripPlanContext'
import { mapLegendItems } from '@/lib/design/hos-colors'

export function PlanPage() {
  const navigate = useNavigate()
  const { error, isLoading, lastRequest, plan, submitTrip } = useTripPlan()
  const hasLongInstructions = plan ? plan.stops.length > 6 : false

  useEffect(() => {
    if (!plan && !isLoading) {
      navigate('/', { replace: true })
    }
  }, [isLoading, navigate, plan])

  if (!plan || !lastRequest) {
    return null
  }

  return (
    <Box bgcolor="background.default" minHeight="100vh">
      <AppHeader />
      <Box bgcolor="background.paper" px={2} py={2}>
        <TripSearchBar isLoading={isLoading} lastRequest={lastRequest} onSubmit={submitTrip} />
      </Box>

      <Container maxWidth={false} sx={{ maxWidth: 1280, py: { xs: 4, md: 6 } }}>
        <Stack spacing={3}>
          <Typography fontWeight={700} variant="h4">
            Your route plan
          </Typography>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {isLoading ? (
            <DashboardSkeleton />
          ) : (
            <>
              <TripSummaryCards plan={plan} />

              <Box
                display="grid"
                gap={3}
                gridTemplateColumns={{ xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)' }}
              >
                <Box
                  sx={{
                    alignSelf: 'start',
                    position: { md: hasLongInstructions ? 'sticky' : 'static' },
                    top: { md: 24 },
                  }}
                >
                  <SectionCard
                    description="OpenStreetMap tiles with stop markers placed along the returned route."
                    title="Route map"
                  >
                    <RouteMap plan={plan} />
                    <Stack direction="row" flexWrap="wrap" gap={2} mt={2}>
                      {mapLegendItems.map((item) => (
                        <Stack alignItems="center" direction="row" gap={0.75} key={item.label}>
                          <Box bgcolor={item.color} borderRadius="50%" height={10} width={10} />
                          <Typography color="text.secondary" variant="body2">
                            {item.label}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </SectionCard>
                </Box>

                <SectionCard
                  description="Timeline events returned by the HOS planner."
                  title="Route instructions"
                >
                  <StopsTimeline stops={plan.stops} />
                </SectionCard>
              </Box>

              <SectionCard
                description="24-hour ELD grid generated from HOS segments."
                title="ELD duty status grid"
              >
                <DailyLogTabs logs={plan.daily_logs} />
              </SectionCard>
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

interface SectionCardProps {
  children: ReactNode
  description: string
  title: string
}

function SectionCard({ children, description, title }: SectionCardProps) {
  return (
    <Card sx={{ minWidth: 0 }}>
      <CardContent sx={{ minWidth: 0, p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
        <Typography fontWeight={700} variant="h5">
          {title}
        </Typography>
        <Typography color="text.secondary" mt={0.5} variant="body2">
          {description}
        </Typography>
        <Box minWidth={0} mt={2.5}>
          {children}
        </Box>
      </CardContent>
    </Card>
  )
}

function DashboardSkeleton() {
  return (
    <Stack spacing={3}>
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }}>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton height={120} key={index} variant="rounded" />
        ))}
      </Box>
      <Box display="grid" gap={3} gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}>
        <Skeleton height={360} variant="rounded" />
        <Skeleton height={360} variant="rounded" />
      </Box>
      <Skeleton height={360} variant="rounded" />
    </Stack>
  )
}
