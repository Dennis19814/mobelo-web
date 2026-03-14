'use client'

import Link from 'next/link'
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus'
import { AlertCircle, Clock } from 'lucide-react'

/**
 * Banner to show trial expiration warnings and subscription status
 *
 * Displays:
 * - Warning when trial is expiring soon (≤ 3 days)
 * - Alert when trial has expired
 * - Nothing when trial is active (> 3 days) or user has paid subscription
 *
 * @example
 * ```tsx
 * // Add to your layout
 * <Navigation />
 * <TrialBanner />
 * <main>{children}</main>
 * ```
 */
export function TrialBanner() {
  const { hasAccess, trialActive, trialEndDate, daysRemainingInTrial, loading, subscription } = useSubscriptionStatus()

  // Don't show anything while loading
  if (loading) {
    return null
  }

  // Don't show if user has paid subscription
  if (subscription && subscription.status === 'active') {
    return null
  }

  // Trial expiring soon warning (1-3 days remaining)
  if (hasAccess && trialActive && daysRemainingInTrial !== null && daysRemainingInTrial <= 3 && daysRemainingInTrial > 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <strong>Trial ending soon:</strong> You have {daysRemainingInTrial} day{daysRemainingInTrial !== 1 ? 's' : ''} left in your trial.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Trial expired alert
  if (!hasAccess && !trialActive) {
    return (
      <div className="bg-red-50 border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <strong>Trial expired:</strong> Your trial has ended. Upgrade to continue creating and managing apps.
              </p>
            </div>
            <Link
              href="/settings/billing"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
