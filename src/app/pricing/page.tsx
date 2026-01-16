'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation, Footer } from '@/components/layout'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, Badge } from '@/components/ui'
import { Check } from 'lucide-react'
import Link from 'next/link'
import { SigninModal } from '@/components/modals'
import { apiService } from '@/lib/api-service'
import { PRICING_TIERS } from '@/lib/plans'

export default function PricingPage() {
  const router = useRouter()
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [showSignin, setShowSignin] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<{ plan: string; billing: 'monthly' | 'annual' } | null>(null)
  const [checkingSubscription, setCheckingSubscription] = useState(false)

  const [hasActivePlan, setHasActivePlan] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    setIsAuthed(!!token)

    // Redirect to home if not authenticated
    if (!token) {
      router.push('/')
      return
    }

    // Check if user already has an active paid subscription
    checkExistingSubscription()
  }, [router])

  const checkExistingSubscription = async () => {
    setCheckingSubscription(true)
    try {
      const response = await apiService.getSubscription()
      if (response.ok && response.data) {
        const { plan, status } = response.data
        // If user has active paid plan, just mark it so we can redirect correctly on click
        // Support both old and new plan names for backward compatibility
        const paidPlans = ['starter', 'professional', 'enterprise', 'startup', 'growth', 'trial']
        if (status === 'active' && paidPlans.includes(plan)) {
          setHasActivePlan(true)
        }
      }
    } catch (error) {
      // Silently fail - allow user to proceed
    } finally {
      setCheckingSubscription(false)
    }
  }

  const calculatePrice = (monthlyPrice: number) => {
    if (billing === 'annual') {
      return Math.floor(monthlyPrice * 0.8)
    }
    return monthlyPrice
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />

      <main className="flex-1">
        <section className="bg-white pt-20 md:pt-28 lg:pt-24 pb-24 px-6">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Your plan</h1>
            <p className="mt-2 text-sm text-gray-600">Upgrade immediately. Downgrades take effect at the end of the current period.</p>

            <div className="mt-6 flex justify-center">
              <div className="inline-flex rounded-full border border-gray-200 bg-gray-50 p-1">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${billing === 'monthly' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full transition ${billing === 'annual' ? 'bg-orange-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  Annual <span className={`ml-2 text-xs ${billing === 'annual' ? 'text-orange-100' : 'text-orange-700'}`}>Save 20%</span>
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PRICING_TIERS.map((tier) => {
                const planPrice = calculatePrice(tier.monthlyPrice)
                const annualPrice = billing === 'annual' ? Math.floor(tier.monthlyPrice * 12 * 0.8) : null

                return (
                  <Card
                    key={tier.key}
                    className={`border-2 transition-all hover:shadow-lg flex flex-col ${
                      tier.highlight 
                        ? 'ring-2 ring-orange-500 border-orange-500 bg-orange-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{tier.name}</CardTitle>
                        {tier.highlight && <Badge variant="primary" size="sm">Recommended</Badge>}
                      </div>
                      <CardDescription className="text-xs">
                        {billing === 'monthly' ? 'Monthly billing' : 'Annual billing'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="text-2xl font-semibold text-gray-900">
                        ${annualPrice || planPrice}
                        <span className="text-sm text-gray-500">
                          {annualPrice ? '/year' : '/monthly'}
                        </span>
                      </div>
                      {annualPrice && (
                        <div className="text-xs text-gray-500 mt-1">
                          ${Math.round(annualPrice / 12)}/monthly billed annually
                        </div>
                      )}
                      {tier.trialNote && billing === 'monthly' && (
                        <div className="mt-2 text-xs text-orange-700 font-medium">
                          {tier.trialNote}
                        </div>
                      )}

                      <ul className="mt-4 space-y-2">
                        {tier.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2 text-xs text-gray-700">
                            <Check className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <button
                        className={`w-full py-2.5 px-4 text-sm font-semibold rounded-lg transition ${
                          tier.highlight || tier.ctaVariant === 'primary'
                            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md'
                            : 'bg-white text-orange-500 border-2 border-orange-500 hover:bg-orange-50'
                        }`}
                        disabled={checkingSubscription}
                        onClick={() => {
                          // Check authentication for paid plans
                          if (!isAuthed) {
                            setPendingPlan({ plan: tier.key, billing })
                            setShowSignin(true)
                          } else if (hasActivePlan) {
                            router.push('/account/plan')
                          } else {
                            router.push(`/checkout/summary?plan=${tier.key}&billing=${billing}`)
                          }
                        }}
                      >
                        {checkingSubscription ? 'Loading...' : 'Upgrade'}
                      </button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>

          </div>
        </section>
      </main>

      <Footer />

      <SigninModal
        isOpen={showSignin}
        onClose={() => setShowSignin(false)}
        onSigninSuccess={() => {
          setShowSignin(false)
          setIsAuthed(true)
          if (pendingPlan) {
            router.push(`/checkout/summary?plan=${pendingPlan.plan}&billing=${pendingPlan.billing}`)
          }
        }}
      />
    </div>
  )
}
