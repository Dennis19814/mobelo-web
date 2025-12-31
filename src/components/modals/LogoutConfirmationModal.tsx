'use client'
import { logger } from '@/lib/logger'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, X, Loader2 } from 'lucide-react'
import { apiService } from '@/lib/api-service'

interface LogoutConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onLogoutSuccess?: () => void
}

export default function LogoutConfirmationModal({ 
  isOpen, 
  onClose, 
  onLogoutSuccess 
}: LogoutConfirmationModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    const accessToken = localStorage.getItem('access_token')

    if (accessToken) {
      try {
        // Add a 3-second timeout to prevent hanging on expired tokens
        const logoutPromise = apiService.logout()
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Logout timeout')), 3000)
        )

        const response = await Promise.race([logoutPromise, timeoutPromise]) as any

        // Log the response but don't fail on API errors
        if (response?.ok) {
          logger.debug('Logout successful on server')
        } else {
          logger.warn('Logout API failed, but continuing with local cleanup')
        }
      } catch (error) {
        logger.warn('Logout API error, but continuing with local cleanup:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      }
    }

    // Always clean up localStorage regardless of API success/failure
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    localStorage.removeItem('selected_features')

    // Clear all sessionStorage
    try {
      sessionStorage.clear()
      logger.debug('[LogoutModal] SessionStorage cleared')
    } catch (error) {
      logger.warn('[LogoutModal] Failed to clear sessionStorage:', { error: error instanceof Error ? error.message : String(error) })
    }

    // Also clear any staff session to avoid cross-session confusion
    try {
      const { clearStaffAuthData } = await import('@/lib/auth-utils')
      clearStaffAuthData()
    } catch (_) {}

    // Dispatch custom event to notify other components of auth change
    window.dispatchEvent(new Event('auth-changed'))
    logger.debug('[LogoutModal] Dispatched auth-changed event')

    // Call the success callback if provided
    if (onLogoutSuccess) {
      onLogoutSuccess()
    }

    // Navigate to home page
    try { router.push('/') } catch {}
    // Hard fallback in case router isn't active (e.g., non-Next dev server)
    setTimeout(() => { if (typeof window !== 'undefined' && window.location) window.location.replace('/') }, 50)

    // Close the modal
    onClose()
    setIsLoading(false)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-start justify-center p-4 sm:p-6 pt-24 sm:pt-32 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Confirm Logout
          </h2>
          <p className="text-gray-600 text-sm">
            Are you sure you want to log out of your account?
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col space-y-3">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="w-full bg-red-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Yes, Log Out</span>
              </>
            )}
          </button>
          
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg font-semibold hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
