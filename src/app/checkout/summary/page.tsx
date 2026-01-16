'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation, Footer } from '@/components/layout'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui'
import Input from '@/components/ui/Input'
import { Check } from 'lucide-react'
import { PLAN_NAMES, getMonthlyPrice, formatPriceUSD, normalizePlan, normalizeBilling, PRICING_TIERS, type BillingCycle, type PlanKey } from '@/lib/plans'
import { SigninModal } from '@/components/modals'
import { apiService } from '@/lib/api-service'

function CheckoutSummaryContent() {
  const router = useRouter()
  const params = useSearchParams()

  const [showSignin, setShowSignin] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponStatus, setCouponStatus] = useState<{ valid: boolean; message: string } | null>(null)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')

  const checkExistingSubscription = async () => {
    setCheckingSubscription(true)
    try {
      const response = await apiService.getSubscription()
      if (response.ok && response.data) {
        const { plan: currentPlan, billing: currentBilling, status } = response.data
        // Only redirect if user has active paid plan AND trying to purchase the SAME plan+billing
        if (status === 'active' && (currentPlan === 'starter' || currentPlan === 'growth' || currentPlan === 'custom')) {
          // Allow upgrades/downgrades - only block if purchasing exact same plan+billing
          if (currentPlan === plan && currentBilling === billing) {
            router.push('/account/plan')
          }
        }
      }
    } catch (error) {
      // Silently fail - allow user to proceed
    } finally {
      setCheckingSubscription(false)
    }
  }

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    setIsAuthed(!!token)

    // Check if user already has an active paid subscription
    if (token) {
      checkExistingSubscription()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const plan: PlanKey | null = useMemo(() => normalizePlan(params.get('plan')), [params])
  const billing: BillingCycle = useMemo(() => normalizeBilling(params.get('billing')), [params])

  const price = plan ? getMonthlyPrice(plan, billing) : 0

  const handleContinue = () => {
    if (!plan) return
    if (!isAuthed) {
      setShowSignin(true)
      return
    }
    router.push(`/checkout/payment?plan=${plan}&billing=${billing}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : ''}`)
  }

  const handleChangePlan = () => {
    router.push('/pricing')
  }

  const title = plan ? `Checkout — ${PLAN_NAMES[plan]} (${billing === 'annual' ? 'Annual' : 'Monthly'})` : 'Choose a plan'

  const handleApplyCoupon = async () => {
    if (!plan || plan === 'trial' || !couponCode.trim()) return
    try {
      const res = await apiService.validateCoupon(couponCode.trim(), plan as Exclude<PlanKey, 'trial'>, billing)
      if (res.ok && res.data.valid) {
        setCouponStatus({ valid: true, message: `Applied: ${res.data.percentOff}% off` })
      } else {
        setCouponStatus({ valid: false, message: res.data?.reason || 'Invalid code' })
      }
    } catch {
      setCouponStatus({ valid: false, message: 'Could not validate code' })
    }
  }

  if (checkingSubscription) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Checking subscription...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center pt-20 md:pt-28 lg:pt-24">
        <section className="w-full px-6 ">
          <div className="max-w-5xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white">1</span>
              <span>Summary</span>
              <div className="w-8 h-px bg-gray-300" />
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700">2</span>
              <span>Payment</span>
              <div className="w-8 h-px bg-gray-300" />
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700">3</span>
              <span>Done</span>
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-gray-900 text-center">{title}</h1>
            <p className="mt-2 text-center text-sm text-gray-600">Prices in USD. Stripe processes all payments. Taxes calculated at checkout.</p>

            {!plan && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[{ k: 'trial', p: 0, d: 'Start free and explore' }, { k: 'startup', p: 49, d: 'For small teams' }, { k: 'growth', p: 99, d: 'For scaling stores' }].map((p) => (
                  <Card key={p.k} className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">{PLAN_NAMES[p.k as PlanKey]}</CardTitle>
                      <CardDescription>{p.d}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-semibold text-gray-900">{p.p === 0 ? 'Free' : `$${p.p}`}<span className="text-sm text-gray-500">/mo</span></div>
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" fullWidth onClick={() => router.push(`/checkout/summary?plan=${p.k}&billing=monthly`)}>Select</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {plan && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">Order summary</CardTitle>
                      <CardDescription>Confirm your plan before payment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-700">Plan</div>
                        <div className="text-gray-900 font-medium">{PLAN_NAMES[plan]}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-gray-700">Billing</div>
                        <div className="text-gray-900 font-medium capitalize">{billing}</div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm">
                        <div className="text-gray-700">Price (USD)</div>
                        <div className="text-gray-900 font-semibold">{formatPriceUSD(price)}{price > 0 && <span className="text-gray-500 font-normal">/mo</span>}</div>
                      </div>
                      {billing === 'annual' && price > 0 && (
                        <p className="mt-2 text-xs text-gray-500">Annual billing shows a 20% savings vs monthly.</p>
                      )}
                      <div className="mt-4 text-xs text-gray-500">Taxes calculated at payment with Stripe Tax.</div>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <button onClick={handleChangePlan} className="text-sm text-orange-700 hover:underline">Change plan</button>
                      <Button onClick={handleContinue}>Continue to payment</Button>
                    </CardFooter>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">Have a promo code?</CardTitle>
                      <CardDescription>One active coupon per account. New/existing audience enforced.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Input placeholder="Enter code" value={couponCode} onChange={(e) => { setCouponCode(e.target.value); setCouponStatus(null) }} />
                        <Button variant="outline" onClick={handleApplyCoupon}>Apply</Button>
                      </div>
                      {couponStatus && (
                        <p className={`mt-2 text-xs ${couponStatus.valid ? 'text-green-700' : 'text-red-600'}`}>{couponStatus.message}</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">Optional business details</CardTitle>
                      <CardDescription>Provide company details to appear on invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input placeholder="Company name (optional)" />
                      <Input placeholder="Tax ID (optional)" />
                      <Input placeholder="Address line 1 (optional)" className="md:col-span-2" />
                      <Input placeholder="City (optional)" />
                      <Input placeholder="Country (optional)" />
                    </CardContent>
                    <CardFooter>
                      <p className="text-xs text-gray-500">By continuing, you agree to our Terms and Privacy Policy.</p>
                    </CardFooter>
                  </Card>
                </div>

                <div className="space-y-4">
                  <Card className="border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-base">What you get</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5" /> Unlimited product listings</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5" /> Stripe payments</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5" /> Merchant panel & analytics</li>
                        <li className="flex items-start gap-2"><Check className="w-4 h-4 text-gray-400 mt-0.5" /> Access to templates</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
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
          if (plan) router.push(`/checkout/payment?plan=${plan}&billing=${billing}${couponCode ? `&coupon=${encodeURIComponent(couponCode)}` : ''}`)
        }}
      />
    </div>
  )
}

export default function CheckoutSummaryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutSummaryContent />
    </Suspense>
  )
}
