import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiError } from '@/lib/api/client'
import type { ApiErrorDetails } from '@/types/api'
import { planTrip } from '@/lib/api/trips'
import type { TripPlanRequest, TripPlanResponse } from '@/types/trip'

interface TripPlanContextValue {
  plan: TripPlanResponse | null
  lastRequest: TripPlanRequest | null
  isLoading: boolean
  error: string | null
  errorCode: string | null
  errorDetails: ApiErrorDetails | null
  submitTrip: (payload: TripPlanRequest) => Promise<void>
  clearPlan: () => void
}

interface TripPlanProviderProps {
  children: ReactNode
}

const TripPlanContext = createContext<TripPlanContextValue | null>(null)

export function TripPlanProvider({ children }: TripPlanProviderProps) {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<TripPlanResponse | null>(null)
  const [lastRequest, setLastRequest] = useState<TripPlanRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<ApiErrorDetails | null>(null)

  const submitTrip = useCallback(
    async (payload: TripPlanRequest) => {
      setIsLoading(true)
      setError(null)
      setErrorCode(null)
      setErrorDetails(null)

      try {
        const nextPlan = await planTrip(payload)
        setPlan(nextPlan)
        setLastRequest(payload)
        navigate('/plan')
      } catch (requestError: unknown) {
        const message =
          requestError instanceof ApiError
            ? requestError.message
            : 'Unable to reach the trip planning API.'
        const code = requestError instanceof ApiError ? requestError.code : null
        const details = requestError instanceof ApiError ? requestError.details ?? null : null
        setError(message)
        setErrorCode(code)
        setErrorDetails(details)
      } finally {
        setIsLoading(false)
      }
    },
    [navigate],
  )

  const clearPlan = useCallback(() => {
    setPlan(null)
    setLastRequest(null)
    setError(null)
    setErrorCode(null)
    setErrorDetails(null)
  }, [])

  const value = useMemo(
    () => ({
      plan,
      lastRequest,
      isLoading,
      error,
      errorCode,
      errorDetails,
      submitTrip,
      clearPlan,
    }),
    [clearPlan, error, errorCode, errorDetails, isLoading, lastRequest, plan, submitTrip],
  )

  return <TripPlanContext.Provider value={value}>{children}</TripPlanContext.Provider>
}

export function useTripPlan() {
  const context = useContext(TripPlanContext)

  if (!context) {
    throw new Error('useTripPlan must be used inside TripPlanProvider.')
  }

  return context
}
