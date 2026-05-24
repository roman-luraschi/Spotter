import { useEffect, useState } from 'react'
import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
  type TextFieldProps,
} from '@mui/material'

import { searchLocations } from '@/lib/api/locations'
import type { LocationSuggestion } from '@/types/location'

const MIN_QUERY_LENGTH = 2
const SEARCH_DEBOUNCE_MS = 300
const DROPDOWN_MAX_WIDTH = 'min(420px, calc(100vw - 32px))'
const DROPDOWN_MIN_WIDTH = 280

interface LocationAutocompleteProps {
  error?: string
  id?: string
  label: string
  name?: string
  onChange: (value: string) => void
  placeholder?: string
  showHelperText?: boolean
  textFieldProps?: Partial<TextFieldProps>
  value: string
}

export function LocationAutocomplete({
  error,
  id,
  label,
  name,
  onChange,
  placeholder,
  showHelperText = true,
  textFieldProps,
  value,
}: LocationAutocompleteProps) {
  const [options, setOptions] = useState<LocationSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmedQuery = value.trim()

    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      setOptions([])
      setLoading(false)
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)

      try {
        const suggestions = await searchLocations(trimmedQuery)
        if (!cancelled) {
          setOptions(suggestions)
        }
      } catch {
        if (!cancelled) {
          setOptions([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [value])

  return (
    <Box>
      {textFieldProps?.variant !== 'standard' ? (
        <Typography
          color="text.primary"
          component="label"
          display="block"
          fontSize={13}
          htmlFor={id ?? name}
          mb={0.5}
        >
          {label}
        </Typography>
      ) : null}

      <Autocomplete
        freeSolo
        filterOptions={(items) => items}
        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
        inputValue={value}
        loading={loading}
        noOptionsText={value.trim().length < MIN_QUERY_LENGTH ? 'Type at least 2 characters' : 'No locations found'}
        onChange={(_, newValue) => {
          if (typeof newValue === 'string') {
            onChange(newValue)
            return
          }

          if (newValue) {
            onChange(newValue.label)
          }
        }}
        onInputChange={(_, newInputValue, reason) => {
          if (reason === 'reset') {
            return
          }

          onChange(newInputValue)
        }}
        options={options}
        slotProps={{
          popper: {
            sx: {
              maxWidth: DROPDOWN_MAX_WIDTH,
              minWidth: DROPDOWN_MIN_WIDTH,
              width: 'max-content !important',
            },
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            {...textFieldProps}
            error={Boolean(error)}
            helperText={showHelperText ? error : textFieldProps?.helperText}
            id={id ?? name}
            name={name}
            placeholder={placeholder ?? label}
            size={textFieldProps?.size ?? 'small'}
            InputProps={{
              ...params.InputProps,
              ...textFieldProps?.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => {
          const { key, ...optionProps } = props

          return (
            <Box component="li" key={key} {...optionProps}>
              <Box>
                <Typography fontSize={14} fontWeight={600}>
                  {option.label}
                </Typography>
                <Typography color="text.secondary" fontSize={12} noWrap>
                  {option.display_name}
                </Typography>
              </Box>
            </Box>
          )
        }}
        value={value}
      />
    </Box>
  )
}
