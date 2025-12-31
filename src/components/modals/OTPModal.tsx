'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { X, ArrowLeft, RefreshCw, CheckCircle, Clipboard } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { clearStaffAuthData } from '@/lib/auth-utils'

interface OTPModalProps {
  isOpen: boolean
  onClose: () => void
  onBack: () => void
  email: string
  onVerifySuccess?: (token: string) => void
}

export default function OTPModal({ isOpen, onClose, onBack, email, onVerifySuccess }: OTPModalProps) {
  const router = useRouter()
  const [otp, setOTP] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(600) // 10 minutes in seconds
  const [isResendAvailable, setIsResendAvailable] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  
  // Refs for OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer effect
  useEffect(() => {
    if (!isOpen || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsResendAvailable(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, countdown])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOTP(['', '', '', '', '', ''])
      setError('')
      setCountdown(600)
      setIsResendAvailable(false)
      setIsComplete(false)
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus()
      }, 100)
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOTP = [...otp]
    newOTP[index] = value.slice(-1) // Take only the last character

    setOTP(newOTP)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all digits are entered
    if (newOTP.every(digit => digit !== '') && !isLoading) {
      setIsComplete(true)
      setTimeout(() => {
        handleVerifyOTP(newOTP.join(''))
      }, 300)
    } else {
      setIsComplete(false)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    // Handle paste
    else if (e.key === 'Paste') {
      e.preventDefault()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    const newOTP = [...otp]
    for (let i = 0; i < 6; i++) {
      newOTP[i] = pastedData[i] || ''
    }
    
    setOTP(newOTP)
    
    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5)
    inputRefs.current[nextIndex]?.focus()

    // Auto-verify if complete
    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData)
    }
  }

  const handlePasteButton = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const pastedData = text.replace(/\D/g, '').slice(0, 6)
      
      const newOTP = [...otp]
      for (let i = 0; i < 6; i++) {
        newOTP[i] = pastedData[i] || ''
      }
      
      setOTP(newOTP)
      
      // Focus the next empty input or the last one
      const nextIndex = Math.min(pastedData.length, 5)
      inputRefs.current[nextIndex]?.focus()

      // Auto-verify if complete
      if (pastedData.length === 6) {
        handleVerifyOTP(pastedData)
      }
    } catch (err) {
      logger.error('Failed to read clipboard:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
    }
  }

  const handleVerifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await apiService.verifyOtp(email, otpCode)

      if (response.ok && (response.data.verified || response.data.access_token)) {
        // Clear any existing staff auth data to prevent conflicts
        clearStaffAuthData();

        // Store tokens in localStorage
        if (response.data.access_token) {
          localStorage.setItem('access_token', response.data.access_token)
        }
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token)
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }

        // Dispatch custom event to notify other components of auth change
        window.dispatchEvent(new Event('auth-changed'))
        logger.debug('[OTPModal] Dispatched auth-changed event')

        // Success callback
        if (onVerifySuccess) {
          onVerifySuccess(response.data.access_token)
        }

        // Close modal and navigate to features page
        onClose()
        router.push('/features')
      } else {
        // Handle API errors
        const message = response.data.message || 'Verification failed. Please try again.'
        if (message === 'Invalid or expired OTP') {
          setError('Invalid or expired verification code. Please try again.')
        } else if (message === 'User not found') {
          setError('User not found. Please try signing up again.')
        } else if (message === 'Validation failed') {
          setError('Invalid verification code format. Please try again.')
        } else {
          setError(message)
        }
        
        // Clear OTP on error
        setOTP(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      logger.error('OTP verification error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      setError('Network error. Please check your connection and try again.')
      setOTP(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setError('')

    try {
      const response = await apiService.resendOtp(email)

      if (response.ok) {
        // Reset countdown
        setCountdown(600)
        setIsResendAvailable(false)
        
        // Clear current OTP
        setOTP(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(response.data.message || 'Failed to resend code. Please try again.')
      }
      
    } catch (err) {
      logger.error('Resend OTP error:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
      // Fallback: Still reset countdown for better UX even if API fails
      setCountdown(600)
      setIsResendAvailable(false)
      setOTP(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsResending(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center pt-20 p-4"
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

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pt-6">
          <div className="mx-auto mb-4">
            <Image 
              src="/logo.png" 
              alt="mobelo logo" 
              width={48} 
              height={48}
              className="w-12 h-12 mx-auto"
            />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-600 text-sm">
            We've sent a 6-digit verification code to
          </p>
          <p className="text-orange-600 text-sm font-semibold mt-1">
            {email}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter verification code
          </label>
          <div className="flex justify-center items-center space-x-3" onPaste={handlePaste}>
            <div className="flex space-x-3">
              {otp.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    ref={el => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg transition-all duration-200 ${
                      digit 
                        ? 'border-blue-500 bg-orange-50 text-orange-700 transform scale-105' 
                        : 'border-gray-300 bg-white text-gray-900 hover:border-gray-400'
                    } focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white`}
                    disabled={isLoading}
                    placeholder="•"
                  />
                  {digit && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={handlePasteButton}
                className="p-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                title="Paste code from clipboard"
              >
                <Clipboard className="w-5 h-5" />
              </button>
              <span className="text-xs text-gray-500 mt-1">Paste</span>
            </div>
          </div>
          
          {/* Progress Indicator */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center space-x-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-1 transition-all duration-300 ${
                    otp[i] ? 'w-6 bg-orange-600' : 'w-3 bg-gray-300'
                  } rounded-full`}
                />
              ))}
            </div>
          </div>
          
          {/* Completion Status */}
          {isComplete && (
            <div className="mt-2 text-center">
              <p className="text-green-600 text-sm font-medium animate-pulse">
                ✓ Code complete - Verifying...
              </p>
            </div>
          )}
        </div>

        {/* Timer and Resend */}
        <div className="text-center mb-6">
          {countdown > 0 ? (
            <p className="text-gray-600 text-sm">
              Resend code in {formatTime(countdown)}
            </p>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center justify-center space-x-2 mx-auto disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Resend code</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Verify Button (Manual) */}
        <button
          onClick={() => handleVerifyOTP(otp.join(''))}
          disabled={isLoading || otp.some(digit => !digit)}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-orange-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Verify Code</span>
            </>
          )}
        </button>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Didn't receive the email? Check your spam folder or{' '}
            <button 
              onClick={onBack}
              className="text-orange-600 hover:underline"
            >
              try a different email
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
