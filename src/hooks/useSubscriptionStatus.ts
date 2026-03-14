'use client'

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api-service';

export interface SubscriptionStatus {
  hasAccess: boolean;
  trialActive: boolean;
  trialEndDate: string | null;
  daysRemainingInTrial: number | null;
  subscription: {
    plan: string;
    status: string;
  } | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to check user's subscription and trial status
 *
 * @returns {SubscriptionStatus} Current subscription status
 *
 * @example
 * ```tsx
 * const { hasAccess, trialActive, daysRemainingInTrial, loading } = useSubscriptionStatus();
 *
 * if (loading) return <Spinner />;
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt />;
 * }
 * ```
 */
export function useSubscriptionStatus() {
  const [status, setStatus] = useState<SubscriptionStatus>({
    hasAccess: true,
    trialActive: true,
    trialEndDate: null,
    daysRemainingInTrial: null,
    subscription: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const response = await apiService.getSubscriptionStatus();

        if (response.ok && response.data) {
          setStatus({
            hasAccess: response.data.hasAccess,
            trialActive: response.data.trialActive,
            trialEndDate: response.data.trialEndDate,
            daysRemainingInTrial: response.data.daysRemainingInTrial,
            subscription: response.data.subscription,
            loading: false,
            error: null,
          });
        } else {
          setStatus(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load subscription status',
          }));
        }
      } catch (error: any) {
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to load subscription status',
        }));
      }
    }

    checkStatus();
  }, []);

  return status;
}
