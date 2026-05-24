import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography } from '@mui/material'

import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'

import type { DivIcon } from 'leaflet'

import type { LatLngBoundsExpression, LatLngExpression } from 'leaflet'



import { departureMarkerColor, getStopMarkerColor } from '@/lib/design/hos-colors'

import { formatHours, formatMiles, stopTypeLabels } from '@/lib/format'

import type { CoordinatePair, RouteWaypoint, StopType, TripPlanResponse } from '@/types/trip'

import { createMapPinIcon } from './createMapPinIcon'



interface RouteMapProps {

  plan: TripPlanResponse

}



interface MapPin {

  id: string

  position: LatLngExpression

  color: string

  letter: string

  title: string

  location: string

  description?: string

  durationHours?: number

  distanceMiles?: number

}



const defaultCenter: LatLngExpression = [39.5, -98.35]



const restStopTypes: StopType[] = ['rest_break', 'sleeper_berth', 'cycle_restart']



export function RouteMap({ plan }: RouteMapProps) {

  const routeCoordinates = getRouteCoordinates(plan.route.polyline, plan.route.geometry.coordinates)

  const waypoints = normalizeWaypoints(plan.route.waypoints)

  const pins = useMemo(

    () => buildMapPins(plan, routeCoordinates, waypoints),

    [plan, routeCoordinates, waypoints],

  )



  return (

    <Box border="1px solid" borderColor="divider" borderRadius={2} overflow="hidden">

      <MapContainer

        center={routeCoordinates[0] ?? defaultCenter}

        style={{ height: 420 }}

        scrollWheelZoom={false}

        zoom={5}

      >

        <TileLayer

          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />

        {routeCoordinates.length > 0 ? (

          <>

            <FitBounds coordinates={routeCoordinates} />

            <AnimatedPolyline coordinates={routeCoordinates} />

          </>

        ) : null}

        {pins.map((pin) => (

          <Marker

            icon={getPinIcon(pin.color, pin.letter)}

            key={pin.id}

            position={pin.position}

          >

            <Popup>

              <Box minWidth={160}>

                <Typography color="text.primary" fontWeight={700} variant="body2">
                  {pin.title}
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  {pin.location}
                </Typography>

                {pin.description ? (

                  <Typography color="text.secondary" mt={1} variant="caption">
                    {pin.description}
                  </Typography>

                ) : null}

                {pin.durationHours !== undefined ? (

                  <Typography color="text.secondary" display="block" mt={1} variant="caption">

                    {formatHours(pin.durationHours)}

                    {pin.distanceMiles !== undefined ? ` · ${formatMiles(pin.distanceMiles)}` : ''}

                  </Typography>

                ) : null}

              </Box>

            </Popup>

          </Marker>

        ))}

      </MapContainer>

    </Box>

  )

}



const pinIconCache = new Map<string, DivIcon>()



function getPinIcon(color: string, letter: string): DivIcon {

  const key = `${color}-${letter}`



  if (!pinIconCache.has(key)) {

    pinIconCache.set(key, createMapPinIcon(color, letter))

  }



  return pinIconCache.get(key)!

}



function FitBounds({ coordinates }: { coordinates: LatLngExpression[] }) {

  const map = useMap()



  useEffect(() => {

    if (coordinates.length > 1) {

      map.fitBounds(coordinates as LatLngBoundsExpression, { padding: [28, 28] })

    }

  }, [coordinates, map])



  return null

}



const ROUTE_ANIMATION_DURATION_MS = 1500



function AnimatedPolyline({ coordinates }: { coordinates: LatLngExpression[] }) {

  const [progress, setProgress] = useState(0)

  const frameRef = useRef<number | null>(null)



  useEffect(() => {

    if (coordinates.length < 2) {

      setProgress(1)

      return

    }



    setProgress(0)

    const start = performance.now()



    const step = (now: number) => {

      const elapsed = now - start

      const ratio = Math.min(1, elapsed / ROUTE_ANIMATION_DURATION_MS)

      const eased = 1 - Math.pow(1 - ratio, 3)

      setProgress(eased)



      if (ratio < 1) {

        frameRef.current = requestAnimationFrame(step)

      }

    }



    frameRef.current = requestAnimationFrame(step)



    return () => {

      if (frameRef.current !== null) {

        cancelAnimationFrame(frameRef.current)

        frameRef.current = null

      }

    }

  }, [coordinates])



  const animatedCoordinates = useMemo(

    () => sliceCoordinatesByProgress(coordinates, progress),

    [coordinates, progress],

  )



  if (animatedCoordinates.length < 2) {

    return null

  }



  return (

    <Polyline

      pathOptions={{ color: '#3b82f6', weight: 5, lineCap: 'round', lineJoin: 'round' }}

      positions={animatedCoordinates}

    />

  )

}



function sliceCoordinatesByProgress(

  coordinates: LatLngExpression[],

  progress: number,

): LatLngExpression[] {

  if (coordinates.length < 2 || progress >= 1) {

    return coordinates

  }

  if (progress <= 0) {

    return []

  }



  const lastIndex = coordinates.length - 1

  const exact = progress * lastIndex

  const fullIndex = Math.floor(exact)

  const fraction = exact - fullIndex

  const visible = coordinates.slice(0, fullIndex + 1)



  if (fraction > 0 && fullIndex < lastIndex) {

    const current = toLatLngTuple(coordinates[fullIndex])

    const next = toLatLngTuple(coordinates[fullIndex + 1])



    if (current && next) {

      visible.push([

        current[0] + (next[0] - current[0]) * fraction,

        current[1] + (next[1] - current[1]) * fraction,

      ])

    }

  }



  return visible

}



function toLatLngTuple(value: LatLngExpression): [number, number] | null {

  if (Array.isArray(value) && value.length >= 2) {

    return [Number(value[0]), Number(value[1])]

  }

  if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) {

    return [Number((value as { lat: number }).lat), Number((value as { lng: number }).lng)]

  }

  return null

}



function buildMapPins(

  plan: TripPlanResponse,

  routeCoordinates: LatLngExpression[],

  waypoints: RouteWaypoint[],

): MapPin[] {

  const pins: MapPin[] = []



  if (waypoints[0]) {

    pins.push({

      id: 'departure',

      position: [waypoints[0].latitude, waypoints[0].longitude],

      color: departureMarkerColor,

      letter: 'S',

      title: 'Departure',

      location: waypoints[0].label,

    })

  }



  if (waypoints[1]) {

    const pickupStop = plan.stops.find((stop) => stop.type === 'pickup')



    pins.push({

      id: 'pickup',

      position: [waypoints[1].latitude, waypoints[1].longitude],

      color: getStopMarkerColor('pickup'),

      letter: 'P',

      title: 'Pickup',

      location: waypoints[1].label,

      description: pickupStop?.description,

      durationHours: pickupStop?.duration_hours,

    })

  }



  if (waypoints[2]) {

    const dropoffStop = plan.stops.find((stop) => stop.type === 'dropoff')



    pins.push({

      id: 'dropoff',

      position: [waypoints[2].latitude, waypoints[2].longitude],

      color: getStopMarkerColor('dropoff'),

      letter: 'D',

      title: 'Dropoff',

      location: waypoints[2].label,

      description: dropoffStop?.description,

      durationHours: dropoffStop?.duration_hours,

    })

  }



  plan.stops.forEach((stop, index) => {

    if (stop.type === 'pickup' || stop.type === 'dropoff') {

      return

    }



    if (stop.type !== 'fuel' && !restStopTypes.includes(stop.type)) {

      return

    }



    const position = coordinateAtDistance(routeCoordinates, stop.distance_miles, plan.route.total_miles)



    if (!position) {

      return

    }



    pins.push({

      id: `${stop.type}-${stop.start_minute}-${index}`,

      position,

      color: getStopMarkerColor(stop.type),

      letter: stop.type === 'fuel' ? 'F' : 'R',

      title: stopTypeLabels[stop.type],

      location: stop.location || 'En route',

      description: stop.description,

      durationHours: stop.duration_hours,

      distanceMiles: stop.distance_miles,

    })

  })



  return pins

}



function normalizeWaypoints(waypoints: RouteWaypoint[]): RouteWaypoint[] {

  return waypoints.filter(

    (waypoint): waypoint is RouteWaypoint =>

      typeof waypoint.latitude === 'number' && typeof waypoint.longitude === 'number',

  )

}



function getRouteCoordinates(polyline: CoordinatePair[], geometry: CoordinatePair[]): LatLngExpression[] {

  const coordinates = polyline.length > 0 ? polyline : geometry



  return coordinates.map(([longitude, latitude]) => [latitude, longitude])

}



function coordinateAtDistance(

  coordinates: LatLngExpression[],

  distanceMiles: number,

  totalMiles: number,

): LatLngExpression | null {

  if (coordinates.length === 0) {

    return null

  }



  if (coordinates.length === 1 || totalMiles <= 0) {

    return coordinates[0] ?? null

  }



  const ratio = Math.max(0, Math.min(1, distanceMiles / totalMiles))

  const index = Math.min(coordinates.length - 1, Math.round(ratio * (coordinates.length - 1)))



  return coordinates[index] ?? null

}


