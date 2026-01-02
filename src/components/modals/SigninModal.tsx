'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, Loader2, Clipboard } from 'lucide-react'
import { apiService } from '@/lib/api-service'

interface SigninModalProps {
  isOpen: boolean
  onClose: () => void
  onSigninSuccess?: (email: string) => void
  initialEmail?: string
}

export default function SigninModal({ isOpen, onClose, onSigninSuccess, initialEmail }: SigninModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail || '')
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentScreen, setCurrentScreen] = useState<'signin' | 'otp'>('signin')

  // Update email when initialEmail prop changes
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail)
    }
  }, [initialEmail])

  // Auto-scroll to top when modal opens
  useEffect(() => {
    if (isOpen) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      // Also prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = 'unset'
    }

    // Cleanup function to ensure scroll is re-enabled
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      logger.debug('Attempting OTP verification with API client')
      
      const response = await apiService.verifyOtp(email.trim(), otp.trim())

      if (response.ok) {
        // OTP verification successful - store tokens
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token)
        }
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token)
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }

        // Ensure session isolation: clear any existing staff session
        try {
          const { clearStaffAuthData } = await import('@/lib/auth-utils')
          clearStaffAuthData()
        } catch (_) {}
        
        // Call the success callback if provided
        if (onSigninSuccess) {
          onSigninSuccess(email)
        }
        
        // Close the modal without navigation
        onClose()
      } else {
        // Handle API errors
        setError(response.data.message || `API Error: ${response.status}`)
      }
    } catch (err) {
      logger.error('OTP verification network/fetch error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToSignin = () => {
    setCurrentScreen('signin')
    setOtp('')
    setError('')
  }

  const handlePasteOtp = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const pastedData = text.replace(/\D/g, '').slice(0, 6)
      setOtp(pastedData)
      setError('')
    } catch (err) {
      logger.error('Failed to read clipboard:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
    }
  }

  if (!isOpen) return null

  const handleEmailSignin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      logger.debug('Attempting login with API client')
      
      const response = await apiService.login(email.trim())

      if (response.ok) {
        // Login successful - show OTP verification screen
        setCurrentScreen('otp')
        setError('')
      } else {
        // Handle API errors
        setError(response.data.message || `API Error: ${response.status}`)
      }
    } catch (err) {
      logger.error('Signin network/fetch error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      
      // More specific error handling
      if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. This could be due to:\n• CORS policy restrictions\n• Network connectivity issues\n• Server not responding\n\nPlease check your connection and try again.')
      } else if (err instanceof TypeError && err.message.includes('NetworkError')) {
        setError('Network error: Please check your internet connection and try again.')
      } else if (err instanceof TypeError && err.message.includes('CORS')) {
        setError('Cross-origin request blocked. Please contact support.')
      } else {
        setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignin = async () => {
    try {
      setIsLoading(true)
      setError('')

      const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
      try { sessionStorage.setItem('oauth_state', state) } catch {}
      // CRITICAL: Use the exact same redirect URI as configured in Google Console
      // Must be hardcoded to match production domain (not window.location.origin which could vary)
      const redirectUri = `https://mobelo.dev/api/auth/callback/google`

      const resp = await apiService.getGoogleAuthInit(redirectUri, state)
      if (!resp.ok || !resp.data?.url) {
        const apiMsg = (resp && typeof resp.data === 'object' && (resp as any).data?.message) || (typeof resp.data === 'string' ? resp.data : '')
        const detailedError = apiMsg || `Failed to start Google login (Status: ${resp.status})`
        logger.error('Google auth init failed:', { status: resp.status, data: resp.data })
        setError(detailedError)
        setIsLoading(false)
        return
      }

      const url = resp.data.url as string
      const popup = window.open(url, 'google-oauth', 'width=500,height=600')
      if (!popup) {
        setError('Popup blocked. Please allow popups and try again.')
        setIsLoading(false)
        return
      }

      const messageHandler = (event: MessageEvent) => {
        try {
          if (event.origin !== window.location.origin) return
          const data: any = event.data || {}
          if (!data || typeof data !== 'object') return
          if (data.ok === false) {
            setError(data.error || 'Google sign-in failed')
            window.removeEventListener('message', messageHandler)
            setIsLoading(false)
            return
          }
          if (data.ok === true && data.data) {
            const res = data.data
            if (res.access_token) localStorage.setItem('access_token', res.access_token)
            if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token)
            if (res.user) localStorage.setItem('user', JSON.stringify(res.user))

            // Clear any staff session
            import('@/lib/auth-utils').then(m => m.clearStaffAuthData?.()).catch(() => {})

            window.removeEventListener('message', messageHandler)
            if (onSigninSuccess) onSigninSuccess(res.user?.email || '')
            onClose()
            setIsLoading(false)
          }
        } catch (e) {
          // ignore
        }
      }

      window.addEventListener('message', messageHandler)
    } catch (err) {
      logger.error('Google signin error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      const errorMsg = err instanceof Error ? err.message : String(err)
      setError(`Google signin failed: ${errorMsg}`)
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Test API connectivity
  const testApiConnectivity = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mobelo.dev'

    logger.debug('Testing API connectivity...')
    logger.debug('API URL:', { value: apiUrl })
    logger.debug('Full endpoint:', { value: `${apiUrl}/api/auth/login` })
    logger.debug('Current origin:', { value: window.location.origin })

    // Test simple GET to base API
    try {
      const baseResponse = await fetch(`${apiUrl}/api`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit'
      })
      logger.debug('Base API test:', { status: baseResponse.status, statusText: baseResponse.statusText })
    } catch (baseError) {
      logger.error('Base API test failed:', { error: baseError instanceof Error ? baseError.message : String(baseError), stack: baseError instanceof Error ? baseError.stack : undefined })
    }

    // Test OPTIONS on auth/login
    try {
      const optionsResponse = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'OPTIONS',
        mode: 'cors',
        credentials: 'omit'
      })
      logger.debug('OPTIONS test:', { status: optionsResponse.status, statusText: optionsResponse.statusText })
      logger.debug('OPTIONS headers:', Object.fromEntries(optionsResponse.headers.entries()))
    } catch (optionsError) {
      logger.error('OPTIONS test failed:', { error: optionsError instanceof Error ? optionsError.message : String(optionsError), stack: optionsError instanceof Error ? optionsError.stack : undefined })
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto h-fit">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex justify-center">
            <Image
              src="/logo.png"
              alt="mobelo logo"
              width={120}
              height={40}
              quality={100}
              className="h-10 w-auto"
              priority
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentScreen === 'signin' ? 'Welcome to mobelo' : 'Verify your email'}
          </h2>
          {currentScreen === 'otp' && (
            <p className="text-gray-600 text-sm">
              We've sent a 6-digit code to {email}. Please enter it below.
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {currentScreen === 'signin' ? (
          /* Email Signin Form */
          <form onSubmit={handleEmailSignin} className="space-y-4 mb-6">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                type="email"
                id="signin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>
        ) : (
          /* OTP Verification Form */
          <form onSubmit={handleOtpSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="otp-input" className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <div className="flex justify-center mb-2">
                <button
                  type="button"
                  onClick={handlePasteOtp}
                  className="flex items-center space-x-2 px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 font-medium text-sm rounded-lg transition-all duration-200"
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste Code</span>
                </button>
              </div>
              <input
                type="text"
                id="otp-input"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setOtp(value)
                  setError('')
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-2xl tracking-widest"
                disabled={isLoading}
                maxLength={6}
                autoComplete="one-time-code"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Code</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToSignin}
              className="w-full text-gray-600 hover:text-gray-800 py-2 text-sm transition-colors"
              disabled={isLoading}
            >
              ← Back to email entry
            </button>
          </form>
        )}

        {currentScreen === 'signin' && (
          <>
            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Google Signin Button */}
            <button
              onClick={handleGoogleSignin}
              disabled={isLoading}
              className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

      </div>
    </div>
  )
}
