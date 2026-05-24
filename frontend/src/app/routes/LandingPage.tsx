import { Alert, Box, Card, CardContent } from '@mui/material'

import heroTruck from '@/assets/hero-truck.png'
import { AppHeader } from '@/components/layout/AppHeader'
import { TripPlannerForm } from '@/components/trip/TripPlannerForm'
import { useTripPlan } from '@/context/TripPlanContext'

export function LandingPage() {
  const { error, isLoading, submitTrip } = useTripPlan()

  return (
    <Box minHeight="100vh">
      <AppHeader />
      <Box
        alignItems="center"
        display="flex"
        justifyContent="center"
        minHeight="calc(100vh - 80px)"
        px={2}
        py={6}
        sx={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${heroTruck})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <Card
          elevation={4}
          sx={{
            borderRadius: 4,
            maxWidth: 390,
            width: '100%',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 }, '&:last-child': { pb: { xs: 3, sm: 4 } } }}>
            <TripPlannerForm isLoading={isLoading} onSubmit={submitTrip} />
            {error ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
