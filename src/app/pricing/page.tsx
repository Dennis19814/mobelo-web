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
        <section className="bg-white py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900">Simple, Transparent Pricing</h1>
              <p className="mt-3 text-lg text-gray-600">Choose the plan that fits your needs</p>

              <div className="mt-8 inline-flex rounded-lg border border-gray-300 bg-white p-1">
                <button
                  onClick={() => setBilling('monthly')}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition ${billing === 'monthly' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBilling('annual')}
                  className={`px-6 py-2 text-sm font-medium rounded-md transition ${billing === 'annual' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-700 hover:text-gray-900'}`}
                >
                  Annual <span className="ml-2 text-xs text-orange-600">Save 20%</span>
                </button>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {PRICING_TIERS.map((tier) => (
                <Card
                  key={tier.key}
                  className={`relative h-full transition hover:shadow-lg ${tier.highlight ? 'border-2 border-orange-500 shadow-md' : 'border border-gray-300'} rounded-xl`}
                >
                  {tier.badge && tier.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-orange-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                        {tier.badge}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl font-bold text-gray-900">{tier.name}</CardTitle>
                    <CardDescription className="mt-2 text-gray-600">{tier.description}</CardDescription>
                    <div className="mt-6 flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold text-gray-900">
                        ${calculatePrice(tier.monthlyPrice)}
                      </span>
                      <span className="text-lg text-gray-500">/month</span>
                    </div>
                    {billing === 'annual' && (
                      <div className="mt-2 flex items-baseline justify-center gap-2">
                        <div className="text-sm text-gray-400 line-through">${tier.monthlyPrice}/month</div>
                        <div className="text-xs text-emerald-600 font-semibold">Save 20%</div>
                      </div>
                    )}
                    {tier.trialNote && billing === 'monthly' && (
                      <div className="text-xs text-gray-500 mt-2">{tier.trialNote}</div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-4">
                      {tier.features.map((feat) => (
                        <li key={feat} className="flex items-start gap-3 text-sm text-gray-700">
                          <Check className="mt-0.5 w-5 h-5 text-orange-500 flex-shrink-0" />
                          <span className="leading-relaxed">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <button
                      className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
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
                      {checkingSubscription ? 'Loading...' : 'Select Plan'}
                    </button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center text-xs text-slate-500 space-y-1">
              <div>Starter plan includes 14-day free trial.</div>
              <div>
                Need a custom enterprise plan?{' '}
                <a className="text-orange-600 font-semibold hover:underline" href="/">
                  Contact our sales team
                </a>
              </div>
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
