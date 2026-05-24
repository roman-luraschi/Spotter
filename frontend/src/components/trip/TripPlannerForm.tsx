import { useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material'

import { LocationAutocomplete } from '@/components/trip/LocationAutocomplete'
import { hasErrors, validateTripRequest } from '@/lib/validators'
import type { TripFormErrors } from '@/lib/validators'
import type { TripPlanRequest } from '@/types/trip'

interface TripPlannerFormProps {
  isLoading: boolean
  onSubmit: (payload: TripPlanRequest) => void | Promise<void>
}

interface FormState {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: string
}

const sampleTrip: FormState = {
  current_location: 'Chicago, IL',
  pickup_location: 'St. Louis, MO',
  dropoff_location: 'Dallas, TX',
  current_cycle_used_hours: '12',
}

export function TripPlannerForm({ isLoading, onSubmit }: TripPlannerFormProps) {
  const [values, setValues] = useState<FormState>(sampleTrip)
  const [errors, setErrors] = useState<TripFormErrors>({})

  function updateField(field: keyof FormState, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload: TripPlanRequest = {
      current_location: values.current_location,
      pickup_location: values.pickup_location,
      dropoff_location: values.dropoff_location,
      current_cycle_used_hours: Number(values.current_cycle_used_hours),
    }
    const nextErrors = validateTripRequest(payload)

    setErrors(nextErrors)

    if (!hasErrors(nextErrors)) {
      onSubmit(payload)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <Box>
          <Typography color="text.primary" fontWeight={700} variant="h5">
            Plan a compliant route
          </Typography>
          <Typography color="text.secondary" mt={0.75} variant="body2">
            Enter the three trip points and current 70-hour cycle usage.
          </Typography>
        </Box>

        <Stack spacing={1.5}>
          <LocationAutocomplete
            error={errors.current_location}
            label="Current location"
            name="current_location"
            onChange={(value) => updateField('current_location', value)}
            placeholder="Current location"
            value={values.current_location}
          />
          <LocationAutocomplete
            error={errors.pickup_location}
            label="Pickup location"
            name="pickup_location"
            onChange={(value) => updateField('pickup_location', value)}
            placeholder="Pickup location"
            value={values.pickup_location}
          />
          <LocationAutocomplete
            error={errors.dropoff_location}
            label="Dropoff location"
            name="dropoff_location"
            onChange={(value) => updateField('dropoff_location', value)}
            placeholder="Dropoff location"
            value={values.dropoff_location}
          />
          <PlannerField
            error={errors.current_cycle_used_hours}
            label="Current cycle (hrs)"
            name="current_cycle_used_hours"
            onChange={(value) => updateField('current_cycle_used_hours', value)}
            placeholder="Current cycle (hrs)"
            type="number"
            value={values.current_cycle_used_hours}
          />
        </Stack>

        <Button disabled={isLoading} fullWidth size="large" type="submit" variant="contained">
          {isLoading ? <CircularProgress color="inherit" size={20} /> : 'Generate route'}
        </Button>
      </Stack>
    </Box>
  )
}

interface PlannerFieldProps {
  error?: string
  label: string
  name: keyof FormState
  onChange: (value: string) => void
  placeholder: string
  type?: 'number' | 'text'
  value: string
}

function PlannerField({
  error,
  label,
  name,
  onChange,
  placeholder,
  type = 'text',
  value,
}: PlannerFieldProps) {
  return (
    <Box>
      <Typography color="text.primary" component="label" fontSize={13} htmlFor={name} mb={0.5} display="block">
        {label}
      </Typography>
      <TextField
        error={Boolean(error)}
        fullWidth
        helperText={error}
        id={name}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        size="small"
        type={type}
        value={value}
        inputProps={
          type === 'number'
            ? {
                min: 0,
                max: 70,
                step: 0.25,
                inputMode: 'decimal',
              }
            : undefined
        }
      />
    </Box>
  )
}
