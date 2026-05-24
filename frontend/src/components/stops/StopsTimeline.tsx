import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import CoffeeOutlinedIcon from '@mui/icons-material/CoffeeOutlined'
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined'
import HotelOutlinedIcon from '@mui/icons-material/HotelOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocalGasStationOutlinedIcon from '@mui/icons-material/LocalGasStationOutlined'
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined'
import { Box, Chip, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

import { getStopMarkerColor } from '@/lib/design/hos-colors'
import {
  dutyStatusLabels,
  formatHours,
  formatMiles,
  formatMinutesFromTripStart,
  stopTypeLabels,
} from '@/lib/format'
import type { Stop, StopType } from '@/types/trip'

interface StopsTimelineProps {
  stops: Stop[]
}

export function StopsTimeline({ stops }: StopsTimelineProps) {
  if (stops.length === 0) {
    return (
      <Box border="1px dashed" borderColor="divider" borderRadius={2} color="text.secondary" p={2.5}>
        No stops were returned for this trip.
      </Box>
    )
  }

  return (
    <Stack spacing={0}>
      {stops.map((stop, index) => {
        const color = getStopMarkerColor(stop.type)

        return (
          <Box
            key={`${stop.type}-${stop.start_minute}-${index}`}
            display="grid"
            gridTemplateColumns="44px minmax(0, 1fr)"
            gap={1.5}
          >
            <Stack alignItems="center">
              <Box
                alignItems="center"
                bgcolor={color}
                borderRadius={2}
                color="#FFFFFF"
                display="flex"
                height={40}
                justifyContent="center"
                width={40}
              >
                {getStopIcon(stop.type)}
              </Box>
              {index < stops.length - 1 ? (
                <Box bgcolor="divider" flex={1} minHeight={28} mt={1} width="1px" />
              ) : null}
            </Stack>

            <Box pb={index < stops.length - 1 ? 3 : 0}>
              <Stack
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                spacing={1}
              >
                <Box>
                  <Typography color="text.primary" fontWeight={700} variant="body1">
                    {stopTypeLabels[stop.type]}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {stop.location || 'En route'}
                  </Typography>
                </Box>
                <Chip label={dutyStatusLabels[stop.status]} size="small" />
              </Stack>

              <Typography color="text.secondary" mt={1.25} variant="body2">
                {stop.description}
              </Typography>

              <Stack color="text.secondary" direction={{ xs: 'column', sm: 'row' }} gap={2} mt={1.5}>
                <MetadataItem icon={<AccessTimeOutlinedIcon fontSize="inherit" />}>
                  {formatMinutesFromTripStart(stop.start_minute)}
                </MetadataItem>
                <MetadataItem icon={<AccessTimeOutlinedIcon fontSize="inherit" />}>
                  {formatHours(stop.duration_hours)}
                </MetadataItem>
                <MetadataItem icon={<RouteOutlinedIcon fontSize="inherit" />}>
                  {formatMiles(stop.distance_miles)}
                </MetadataItem>
              </Stack>
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

function getStopIcon(type: StopType): ReactNode {
  if (type === 'pickup') {
    return <Inventory2OutlinedIcon aria-hidden="true" fontSize="small" />
  }

  if (type === 'dropoff') {
    return <FlagOutlinedIcon aria-hidden="true" fontSize="small" />
  }

  if (type === 'fuel') {
    return <LocalGasStationOutlinedIcon aria-hidden="true" fontSize="small" />
  }

  if (type === 'sleeper_berth' || type === 'cycle_restart') {
    return <HotelOutlinedIcon aria-hidden="true" fontSize="small" />
  }

  return <CoffeeOutlinedIcon aria-hidden="true" fontSize="small" />
}

interface MetadataItemProps {
  children: ReactNode
  icon: ReactNode
}

function MetadataItem({ children, icon }: MetadataItemProps) {
  return (
    <Stack alignItems="center" direction="row" fontSize={13} gap={0.5}>
      {icon}
      <Typography color="text.secondary" fontSize={13}>
        {children}
      </Typography>
    </Stack>
  )
}
