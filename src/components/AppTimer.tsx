'use client'
import { useState, useEffect, useCallback } from 'react'
import { Clock, RefreshCw, Loader2 } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { useJobSocket } from '@/hooks/useJobSocket'

interface AppTimerProps {
  appId: string | number
  userId: number
  onTimerExpire?: () => void
}

const TIMEOUT_MINUTES = 15
const TIMEOUT_SECONDS = TIMEOUT_MINUTES * 60
const WARNING_THRESHOLD_SECONDS = 5 * 60 // 5 minutes

export function AppTimer({ appId, userId, onTimerExpire }: AppTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const { appTimeoutEvent, appRestartedEvent } = useJobSocket(userId)

  // Check authentication status on mount
  useEffect(() => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    setIsAuthenticated(!!accessToken)
  }, [])

  // Fetch initial Expo status
  const fetchExpoStatus = useCallback(async () => {
    // Check if user is authenticated before making request
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (!accessToken) {
      console.log('[AppTimer] No access token found, skipping timer')
      setIsLoading(false)
      // Just return without showing anything - user not logged in
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // FIRST: Check if content generation is in progress
      console.log('[AppTimer] Checking content generation status for appId:', appId)
      try {
        const jobResponse = await apiService.getContentGenerationJobByApp(Number(appId))
        if (jobResponse.ok && jobResponse.data) {
          const jobStatus = jobResponse.data.status
          console.log('[AppTimer] Content generation job status:', jobStatus)

          // If generation is in progress or pending, hide timer
          if (jobStatus === 'in_progress' || jobStatus === 'pending') {
            console.log('[AppTimer] Content generation in progress, hiding timer')
            setIsLoading(false)
            setRemainingSeconds(null)
            return
          }
        }
      } catch (jobErr) {
        console.log('[AppTimer] No active content generation job or error checking:', jobErr)
        // Continue with Expo status check
      }

      // SECOND: Fetch Expo status
      console.log('[AppTimer] Fetching Expo status for appId:', appId)
      const status = await apiService.getExpoStatus(Number(appId))
      console.log('[AppTimer] Expo status received:', status)

      if (!status.startedAt) {
        console.log('[AppTimer] No startedAt timestamp, showing as expired')
        setIsExpired(true)
        setRemainingSeconds(0)
        return
      }

      const startedAt = new Date(status.startedAt)
      const elapsedSeconds = Math.floor((Date.now() - startedAt.getTime()) / 1000)
      const remaining = Math.max(0, TIMEOUT_SECONDS - elapsedSeconds)

      console.log('[AppTimer] Timer calculation:', { startedAt, elapsedSeconds, remaining })
      setRemainingSeconds(remaining)
      setIsExpired(remaining === 0)
    } catch (err: any) {
      console.error('[AppTimer] Error fetching Expo status:', err)

      // Check if it's a 401 - user not authenticated
      if (err?.response?.status === 401 || err?.status === 401) {
        console.log('[AppTimer] Got 401, user not authenticated - skipping timer')
        setIsLoading(false)
        // Don't show anything if not authenticated
        return
      }

      // Check if it's a 404 - app might not be started yet
      if (err?.response?.status === 404 || err?.status === 404) {
        console.log('[AppTimer] Got 404, app not started yet - hiding timer')
        setIsLoading(false)
        // Don't render anything - timer will be hidden during generation
        return
      } else {
        console.error('[AppTimer] API error:', err?.message || err)
        setError('Failed to load timer')
        setIsExpired(true)
      }
    } finally {
      setIsLoading(false)
    }
  }, [appId])

  // Initial fetch on mount
  useEffect(() => {
    fetchExpoStatus()
  }, [fetchExpoStatus])

  // Countdown interval
  useEffect(() => {
    if (isExpired || remainingSeconds === null || remainingSeconds === 0) {
      return
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev === null || prev <= 1) {
          setIsExpired(true)
          // Notify parent that timer expired naturally (user was watching)
          onTimerExpire?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isExpired, remainingSeconds, onTimerExpire])

  // Listen to Socket.io app-timeout event
  useEffect(() => {
    if (appTimeoutEvent && appTimeoutEvent.appId === Number(appId)) {
      console.log('[AppTimer] Received app-timeout event:', appTimeoutEvent)
      setIsExpired(true)
      setRemainingSeconds(0)
      // Notify parent that timer expired via socket event (user was on page)
      onTimerExpire?.()
    }
  }, [appTimeoutEvent, appId, onTimerExpire])

  // Listen to Socket.io app-restarted event
  useEffect(() => {
    if (appRestartedEvent && appRestartedEvent.appId === Number(appId)) {
      console.log('[AppTimer] Received app-restarted event:', appRestartedEvent)
      setIsRestarting(false)
      setIsExpired(false)
      // Refetch status to get new startedAt timestamp
      fetchExpoStatus()
    }
  }, [appRestartedEvent, appId, fetchExpoStatus])

  // Handle restart
  const handleRestart = async () => {
    try {
      setIsRestarting(true)
      setError(null)
      console.log('[AppTimer] Restarting app with appId:', appId)
      const result = await apiService.restartApp(Number(appId))
      console.log('[AppTimer] Restart queued successfully:', result)
      // Wait for app-restarted Socket.io event to reset timer
    } catch (err: any) {
      console.error('[AppTimer] Error restarting app:', err)
      console.error('[AppTimer] Error details:', err?.message, err?.response?.status)
      setError('Failed to restart')
      setIsRestarting(false)
    }
  }

  // Format seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Not authenticated - show login required state
  if (!isAuthenticated) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-300" title="Login required to manage app">
        <Clock className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">Login Required</span>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  // Hide timer if app not started (404 from API during generation)
  if (remainingSeconds === null && !isExpired && !error) {
    return null
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 rounded-lg">
        <span className="text-sm text-red-600">{error}</span>
      </div>
    )
  }

  // Expired state - show refresh button
  if (isExpired) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100">
        <RefreshCw className="w-4 h-4" />
        <span className="text-sm font-medium">Session expired</span>
      </div>
    )
  }

  // Timer state
  const isLowTime = remainingSeconds !== null && remainingSeconds < WARNING_THRESHOLD_SECONDS
  const timerColor = isLowTime ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50'

  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${timerColor}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">
        {remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}
      </span>
    </div>
  )
}
