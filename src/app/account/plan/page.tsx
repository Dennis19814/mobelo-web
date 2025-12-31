'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, Badge } from '@/components/ui'
import { PLAN_NAMES, PLAN_PRICES_MONTHLY, PRICING_TIERS, type PlanKey } from '@/lib/plans'
import { apiService } from '@/lib/api-service'
import { Loader2, Check } from 'lucide-react'

export default function AccountPlanPage() {
  const router = useRouter()

  const [pageLoading, setPageLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)
  const [scheduled, setScheduled] = useState<{ targetPlan: PlanKey; targetBilling: 'monthly' | 'annual'; effectiveDate: string } | null>(null)
  const [subscription, setSubscription] = useState<{ plan: PlanKey; billing: 'monthly' | 'annual'; status: string; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; trialEnd: string | null } | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [showCancelModal, setShowCancelModal] = useState(false)

  // Features for each plan - using PRICING_TIERS from shared config
  const planFeatures = useMemo(() => {
    const features: Record<PlanKey, string[]> = {
      trial: [], // Free plan not shown on this page
      starter: [],
      growth: [],
      custom: [],
    }

    PRICING_TIERS.forEach(tier => {
      features[tier.key] = tier.features
    })

    return features
  }, [])

  // All plan options (including billing cycles) - Free plan removed
  const allPlans = useMemo(() => [
    { key: 'starter' as PlanKey, billing: 'monthly' as const, price: 49, annualPrice: null, name: 'Starter', tagline: 'Monthly billing' },
    { key: 'starter' as PlanKey, billing: 'annual' as const, price: Math.round(49 * 0.8), annualPrice: Math.round(49 * 12 * 0.8), name: 'Starter', tagline: 'Annual (Save 20%)' },
    { key: 'growth' as PlanKey, billing: 'monthly' as const, price: 99, annualPrice: null, name: 'Growth', tagline: 'Monthly billing' },
    { key: 'growth' as PlanKey, billing: 'annual' as const, price: Math.round(99 * 0.8), annualPrice: Math.round(99 * 12 * 0.8), name: 'Growth', tagline: 'Annual (Save 20%)' },
    { key: 'custom' as PlanKey, billing: 'monthly' as const, price: 199, annualPrice: null, name: 'Custom', tagline: 'Monthly billing' },
    { key: 'custom' as PlanKey, billing: 'annual' as const, price: Math.round(199 * 0.8), annualPrice: Math.round(199 * 12 * 0.8), name: 'Custom', tagline: 'Annual (Save 20%)' },
  ], [])

  // Current plan for comparison - provide default subscription if API fails
  const effectiveSubscription = subscription || {
    plan: 'trial' as PlanKey,
    billing: 'monthly' as const,
    status: 'free',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    trialEnd: null
  }
  const currentPlan = effectiveSubscription.plan
  const currentBilling = effectiveSubscription.billing
  // Calculate actual payment amount (full year for annual, monthly for monthly)
  const currentPaymentAmount = subscription
    ? (subscription.billing === 'annual'
      ? PLAN_PRICES_MONTHLY[subscription.plan] * 12 * 0.8
      : PLAN_PRICES_MONTHLY[subscription.plan])
    : 0

  useEffect(() => {
    const loadData = async () => {
      const results = await Promise.allSettled([
        apiService.getScheduledPlanChange(),
        apiService.getSubscription()
      ])

      if (results[0].status === 'fulfilled' && results[0].value.ok) {
        setScheduled(results[0].value.data || null)
      }
      if (results[1].status === 'fulfilled' && results[1].value.ok) {
        const subscriptionData = results[1].value.data as any
        console.log('[DEBUG] Subscription data loaded:', subscriptionData)
        setSubscription(subscriptionData)
        // Set initial billing cycle to match current subscription
        if (subscriptionData?.billing) {
          setBillingCycle(subscriptionData.billing)
        }
      } else {
        console.log('[DEBUG] Failed to load subscription:', results[1])
      }

      setPageLoading(false)
    }
    loadData()
  }, [])

  const handleChange = async (targetPlan: PlanKey, targetBilling: 'monthly' | 'annual') => {
    // Check if it's the current plan
    if (targetPlan === currentPlan && targetBilling === currentBilling) return

    // Calculate actual payment amounts for comparison
    const currentMonthlyPrice = PLAN_PRICES_MONTHLY[currentPlan]
    const targetMonthlyPrice = PLAN_PRICES_MONTHLY[targetPlan]

    // For annual, use the full year amount for comparison (since user pays upfront)
    const currentPaymentAmount = currentBilling === 'annual' ? currentMonthlyPrice * 12 * 0.8 : currentMonthlyPrice
    const targetPaymentAmount = targetBilling === 'annual' ? targetMonthlyPrice * 12 * 0.8 : targetMonthlyPrice

    const isDowngrade = targetPaymentAmount < currentPaymentAmount

    if (isDowngrade || targetPlan === 'trial') {
      // Schedule downgrade for end of period
      setLoading(`${targetPlan}-${targetBilling}`)
      setActionMsg('')
      try {
        const res = await apiService.schedulePlanChange(targetPlan, targetBilling)
        if (res.ok) {
          setScheduled({ targetPlan, targetBilling, effectiveDate: res.data.effectiveDate })
          setActionMsg(`Scheduled change to ${PLAN_NAMES[targetPlan]} (${targetBilling}) on ${new Date(res.data.effectiveDate).toLocaleDateString()}.`)
        } else {
          setActionMsg('Could not schedule change.')
        }
      } catch {
        setActionMsg('Could not schedule change.')
      } finally {
        setLoading(null)
      }
    } else {
      // Immediate upgrade
      router.push(`/checkout/summary?plan=${targetPlan}&billing=${targetBilling}`)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-sm text-gray-600">Loading your plan...</p>
            </div>
          </div>
        ) : (
          <section className="py-16 px-6">
            <div className="max-w-6xl mx-auto">
              {/* Current Plan Status Banner */}
              <>
                {console.log('[DEBUG] Rendering banners - effectiveSubscription:', effectiveSubscription, 'currentPlan:', currentPlan)}

                {/* Current Plan Banner - show trial banner for entrepreneur, regular banner for paid plans */}
                {currentPlan === 'trial' ? (
                  <div className="mb-8 rounded-xl border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-gray-900">
                          14-Day Free Trial
                        </div>
                        {(() => {
                          const trialEndDate = effectiveSubscription.trialEnd ? new Date(effectiveSubscription.trialEnd) : null
                          const now = new Date()
                          const isTrialActive = trialEndDate && trialEndDate > now
                          const isTrialExpired = trialEndDate && trialEndDate <= now

                          if (isTrialActive) {
                            const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                            return (
                              <div className="text-sm text-gray-700 mt-1">
                                <span className="font-medium text-blue-700">
                                  {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                                </span>
                                <span className="text-gray-600 mx-2">·</span>
                                <span className="text-gray-600">
                                  Trial ends {trialEndDate.toLocaleDateString()}
                                </span>
                              </div>
                            )
                          }

                          if (isTrialExpired) {
                            return (
                              <div className="text-sm mt-1">
                                <span className="font-medium text-orange-700">
                                  Trial expired on {trialEndDate.toLocaleDateString()}
                                </span>
                                <span className="text-gray-600 mx-2">·</span>
                                <span className="text-gray-700">
                                  Upgrade to a paid plan to continue
                                </span>
                              </div>
                            )
                          }

                          // No trial data (should never happen according to user)
                          return (
                            <div className="text-sm mt-1">
                              <span className="font-medium text-yellow-700">
                                Unable to determine trial status
                              </span>
                              <span className="text-gray-600 mx-2">·</span>
                              <span className="text-gray-600">
                                Please contact support
                              </span>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8 rounded-xl border-2 border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-lg font-semibold text-gray-900">
                          Current Plan: {PLAN_NAMES[currentPlan]} {currentBilling === 'annual' ? '(Annual)' : '(Monthly)'}
                        </div>
                        {effectiveSubscription.currentPeriodEnd && (
                          <div className="text-sm text-gray-600 mt-1">
                            {effectiveSubscription.cancelAtPeriodEnd ? (
                              <span className="text-orange-600 font-medium">
                                Cancels on {new Date(effectiveSubscription.currentPeriodEnd).toLocaleDateString()}
                              </span>
                            ) : (
                              <>
                                Renews on {new Date(effectiveSubscription.currentPeriodEnd).toLocaleDateString()}
                                <span className="mx-2">·</span>
                                <span className="font-medium text-gray-700">
                                  ${currentBilling === 'annual' ? Math.round(currentPaymentAmount) : currentPaymentAmount}/{currentBilling === 'annual' ? 'year' : 'month'}
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>

              {/* Scheduled Plan Change Banner */}
              {scheduled && scheduled.targetPlan && scheduled.effectiveDate && (
                <div className="mb-6 rounded-lg border-2 border-orange-300 bg-orange-50 px-4 py-4 text-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900">
                        Scheduled plan change to <strong>{PLAN_NAMES[scheduled.targetPlan]} ({scheduled.targetBilling === 'annual' ? 'Annual' : 'Monthly'})</strong>
                      </div>
                      <div className="text-gray-600 mt-0.5">
                        Effective on {new Date(scheduled.effectiveDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading === 'cancelScheduled'}
                    onClick={async () => {
                      setLoading('cancelScheduled')
                      try {
                        const res = await apiService.cancelScheduledPlanChange()
                        if (res.ok && res.data.cancelled) {
                          setScheduled(null)
                          setActionMsg('Scheduled change canceled.')
                        }
                      } finally {
                        setLoading(null)
                      }
                    }}
                  >
                    {loading === 'cancelScheduled' ? 'Canceling...' : 'Cancel Change'}
                  </Button>
                </div>
              )}

              <h1 className="text-2xl font-semibold text-gray-900">Your plan</h1>
              <p className="mt-2 text-sm text-gray-600">Upgrade immediately. Downgrades take effect at the end of the current period.</p>

              <div className="mt-6 flex justify-center">
                <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${billingCycle === 'monthly' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${billingCycle === 'annual' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Annual <span className={`ml-2 text-xs ${billingCycle === 'annual' ? 'text-blue-100' : 'text-orange-700'}`}>Save 20%</span>
                  </button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {allPlans.filter(plan => plan.billing === billingCycle).map((plan) => {
                  const isCurrent = plan.key === currentPlan && plan.billing === currentBilling
                  // Calculate actual payment amount for this plan
                  const targetPaymentAmount = plan.billing === 'annual'
                    ? PLAN_PRICES_MONTHLY[plan.key] * 12 * 0.8
                    : PLAN_PRICES_MONTHLY[plan.key]
                  const isUpgrade = targetPaymentAmount > currentPaymentAmount
                  const planId = `${plan.key}-${plan.billing}`
                  const isLoading = loading === planId

                  return (
                    <Card
                      key={planId}
                      className={`border-2 transition-all hover:shadow-lg flex flex-col ${isCurrent
                        ? 'ring-2 ring-blue-500 border-blue-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{plan.name}</CardTitle>
                          {isCurrent && <Badge variant="primary" size="sm">Current</Badge>}
                        </div>
                        <CardDescription className="text-xs">{plan.tagline}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <div className="text-2xl font-semibold text-gray-900">
                          {plan.price === 0 ? 'Free' : plan.annualPrice ? `$${plan.annualPrice}` : `$${plan.price}`}
                          {plan.price > 0 && (
                            <span className="text-sm text-gray-500">
                              {plan.annualPrice ? '/year' : '/monthly'}
                            </span>
                          )}
                        </div>
                        {plan.annualPrice && (
                          <div className="text-xs text-gray-500 mt-1">
                            ${Math.round(plan.annualPrice / 12)}/monthly billed annually
                          </div>
                        )}
                        {isCurrent && subscription?.currentPeriodEnd && (
                          <div className="mt-2 text-xs text-orange-700 font-medium">
                            Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                          </div>
                        )}

                        <ul className="mt-4 space-y-2">
                          {planFeatures[plan.key].map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-xs text-gray-700">
                              <Check className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="leading-snug">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      <CardFooter>
                        {isCurrent ? (
                          <Button variant="outline" fullWidth disabled size="sm">Current Plan</Button>
                        ) : (
                          <Button
                            fullWidth
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleChange(plan.key, plan.billing)}
                            variant={isUpgrade ? 'primary' : 'outline'}
                          >
                            {isLoading ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  )
                })}
              </div>

              <div className="mt-8">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">Cancellation</CardTitle>
                    <CardDescription>No refunds. Your plan remains active until the end of the period.</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      disabled={loading === 'cancel'}
                      onClick={() => setShowCancelModal(true)}
                      className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                    >
                      {loading === 'cancel' ? 'Processing...' : 'Cancel at end of period'}
                    </Button>
                    {actionMsg && <span className="text-sm text-gray-700">{actionMsg}</span>}
                  </CardFooter>
                </Card>
              </div>
            </div>
          </section>
        )}
      </main>


      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Cancel Subscription?</h3>
            <p className="text-sm text-gray-600 mb-6">
              Your subscription will be canceled at the end of the current billing period.
              You'll continue to have access to all features until then. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                fullWidth
                onClick={() => setShowCancelModal(false)}
              >
                Keep Plan
              </Button>
              <Button
                fullWidth
                disabled={loading === 'cancel'}
                onClick={async () => {
                  setShowCancelModal(false)
                  await handleChange('trial', 'monthly')
                }}
                className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:text-gray-500"
              >
                {loading === 'cancel' ? 'Processing...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
