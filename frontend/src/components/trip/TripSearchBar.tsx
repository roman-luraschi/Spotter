import { useEffect, useState } from 'react'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Tooltip, Typography } from '@mui/material'

import { LocationAutocomplete } from '@/components/trip/LocationAutocomplete'
import { hasErrors, validateTripRequest } from '@/lib/validators'
import type { TripFormErrors } from '@/lib/validators'
import type { TripPlanRequest } from '@/types/trip'

interface TripSearchBarProps {
  isLoading: boolean
  lastRequest: TripPlanRequest
  onSubmit: (payload: TripPlanRequest) => void | Promise<void>
}

interface SearchState {
  current_location: string
  pickup_location: string
  dropoff_location: string
  current_cycle_used_hours: string
}

export function TripSearchBar({ isLoading, lastRequest, onSubmit }: TripSearchBarProps) {
  const [values, setValues] = useState<SearchState>(() => ({
    current_location: lastRequest.current_location,
    pickup_location: lastRequest.pickup_location,
    dropoff_location: lastRequest.dropoff_location,
    current_cycle_used_hours: String(lastRequest.current_cycle_used_hours),
  }))
  const [errors, setErrors] = useState<TripFormErrors>({})

  useEffect(() => {
    setValues({
      current_location: lastRequest.current_location,
      pickup_location: lastRequest.pickup_location,
      dropoff_location: lastRequest.dropoff_location,
      current_cycle_used_hours: String(lastRequest.current_cycle_used_hours),
    })
  }, [lastRequest])

  function updateField(field: keyof SearchState, value: string) {
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
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{
        borderRadius: { xs: 4, md: 9999 },
        boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
        maxWidth: 920,
        mx: 'auto',
        overflowX: { xs: 'auto', md: 'visible' },
        px: { xs: 2, md: 3 },
        py: { xs: 1.5, md: 1 },
        width: '100%',
      }}
    >
      <Stack
        alignItems={{ xs: 'stretch', md: 'center' }}
        direction={{ xs: 'column', md: 'row' }}
        gap={{ xs: 1.5, md: 2 }}
        minWidth={{ md: 760 }}
      >
        <LocationSearchField
          error={errors.current_location}
          label="Current location"
          onChange={(value) => updateField('current_location', value)}
          value={values.current_location}
        />
        <SearchDivider />
        <LocationSearchField
          error={errors.pickup_location}
          label="Pickup location"
          onChange={(value) => updateField('pickup_location', value)}
          value={values.pickup_location}
        />
        <SearchDivider />
        <LocationSearchField
          error={errors.dropoff_location}
          label="Dropoff location"
          onChange={(value) => updateField('dropoff_location', value)}
          value={values.dropoff_location}
        />
        <SearchDivider />
        <SearchField
          error={errors.current_cycle_used_hours}
          label="Current cycle (hrs)"
          onChange={(value) => updateField('current_cycle_used_hours', value)}
          type="number"
          value={values.current_cycle_used_hours}
        />
        <Button
          disabled={isLoading}
          sx={{ flexShrink: 0, minWidth: 132 }}
          type="submit"
          variant="contained"
        >
          {isLoading ? <CircularProgress color="inherit" size={18} /> : 'Generate plan'}
        </Button>
      </Stack>
    </Paper>
  )
}

interface SearchFieldProps {
  error?: string
  label: string
  onChange: (value: string) => void
  type?: 'number' | 'text'
  value: string
}

function LocationSearchField({ error, label, onChange, value }: SearchFieldProps) {
  return (
    <FieldTooltip error={error}>
      <Box minWidth={{ xs: 220, md: 130 }} sx={{ flex: 1 }}>
        <FieldFrame>
          <Typography color={error ? 'error.main' : 'text.secondary'} fontSize={11} lineHeight={1.2}>
            {label}
          </Typography>
          <LocationAutocomplete
            error={error}
            label={label}
            onChange={onChange}
            placeholder={label}
            showHelperText={false}
            value={value}
            textFieldProps={{
              fullWidth: true,
              variant: 'standard',
              InputProps: { disableUnderline: true },
              sx: {
                '& .MuiInputBase-input': {
                  color: error ? 'error.main' : 'text.primary',
                  fontSize: 14,
                  fontWeight: 600,
                  py: 0.25,
                },
                '& .MuiFormHelperText-root': {
                  mx: 0,
                  whiteSpace: 'nowrap',
                },
              },
            }}
          />
        </FieldFrame>
      </Box>
    </FieldTooltip>
  )
}

function SearchField({ error, label, onChange, type = 'text', value }: SearchFieldProps) {
  return (
    <FieldTooltip error={error}>
      <Box minWidth={{ xs: 220, md: 130 }} sx={{ flex: 1 }}>
        <FieldFrame>
          <Typography color={error ? 'error.main' : 'text.secondary'} fontSize={11} lineHeight={1.2}>
            {label}
          </Typography>
          <TextField
            error={Boolean(error)}
            fullWidth
            onChange={(event) => onChange(event.target.value)}
            placeholder={label}
            size="small"
            type={type}
            value={value}
            variant="standard"
            InputProps={{ disableUnderline: true }}
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
            sx={{
              '& .MuiInputBase-input': {
                color: error ? 'error.main' : 'text.primary',
                fontSize: 14,
                fontWeight: 600,
                py: 0.25,
              },
              '& .MuiFormHelperText-root': {
                mx: 0,
                whiteSpace: 'nowrap',
              },
            }}
          />
        </FieldFrame>
      </Box>
    </FieldTooltip>
  )
}

function FieldTooltip({ children, error }: { children: ReactElement; error?: string }) {
  return (
    <Tooltip
      arrow
      disableFocusListener={!error}
      disableHoverListener={!error}
      disableTouchListener={!error}
      placement="bottom-start"
      title={error ?? ''}
    >
      {children}
    </Tooltip>
  )
}

function FieldFrame({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        px: 1,
        py: 0.5,
        transition: 'color 160ms ease',
      }}
    >
      {children}
    </Box>
  )
}

function SearchDivider() {
  return <Divider flexItem orientation="vertical" sx={{ display: { xs: 'none', md: 'block' }, my: 0.5 }} />
}
