'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation, Footer } from '@/components/layout'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui'
import Input from '@/components/ui/Input'
import { PLAN_NAMES, getMonthlyPrice, formatPriceUSD, normalizePlan, normalizeBilling, type BillingCycle, type PlanKey } from '@/lib/plans'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { config } from '@/lib/config'
import { apiService } from '@/lib/api-service'
import { Loader2 } from 'lucide-react'

function PaymentForm({ onBack, onSuccess, clientSecret }: { onBack: () => void; onSuccess: () => void; clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [elementReady, setElementReady] = useState(false)

  const handleSubmit = async () => {
    if (!stripe || !elements) return
    setSubmitting(true)
    try {
      // Detect if this is a SetupIntent or PaymentIntent based on the clientSecret
      // SetupIntent secrets start with 'seti_', PaymentIntent secrets start with 'pi_'
      const isSetupIntent = clientSecret?.startsWith('seti_')

      if (isSetupIntent) {
        const { error, setupIntent } = await stripe.confirmSetup({ elements, redirect: 'if_required' })
        if (error) {
          alert(error.message || 'Setup failed, please try again')
          setSubmitting(false)
          return
        }

        // CRITICAL FIX: Attach payment method to customer immediately after SetupIntent confirmation
        // This ensures upgrades can use the saved payment method without showing payment form again
        if (setupIntent?.id) {
          try {
            await apiService.attachPaymentMethod({ setupIntentId: setupIntent.id })
          } catch (attachError) {
            console.warn('Failed to attach payment method, but continuing:', attachError)
            // Don't block the user - the webhook might still handle it
          }
        }
      } else {
        const { error } = await stripe.confirmPayment({ elements, redirect: 'if_required' })
        if (error) {
          alert(error.message || 'Payment failed, please try again')
          setSubmitting(false)
          return
        }
      }
      onSuccess()
    } catch (e) {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      {!elementReady && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading payment form...</p>
          </div>
        </div>
      )}
      <div className={elementReady ? '' : 'hidden'}>
        <PaymentElement
          options={{ layout: 'tabs' }}
          onReady={() => setElementReady(true)}
        />
      </div>
      {elementReady && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>Back</Button>
          <Button onClick={handleSubmit} disabled={!stripe || submitting} className="bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:text-gray-500">{submitting ? 'Processing…' : 'Pay and Continue'}</Button>
        </div>
      )}
    </div>
  )
}

function CheckoutPaymentContent() {
  const router = useRouter()
  const params = useSearchParams()

  const plan: PlanKey | null = useMemo(() => normalizePlan(params.get('plan')), [params])
  const billing: BillingCycle = useMemo(() => normalizeBilling(params.get('billing')), [params])
  const coupon = params.get('coupon') || ''

  const price = plan ? getMonthlyPrice(plan, billing) : 0

  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingSubscription, setCheckingSubscription] = useState(false)
  const [prorationDetails, setProrationDetails] = useState<{ proratedAmount: number; currency: string; currentPlan: string; currentBilling: string; newPlan: string; newBilling: string; nextBillingDate: string; nextBillingAmount: number } | null>(null)
  const [stripePromise] = useState(() => {
    if (!config.services.stripePublicKey) return null
    return loadStripe(config.services.stripePublicKey)
  })

  useEffect(() => {
    // Check if user already has an active paid subscription
    const checkExistingSubscription = async () => {
      setCheckingSubscription(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        if (token) {
          const response = await apiService.getSubscription()
          if (response.ok && response.data) {
            const { plan: currentPlan, billing: currentBilling, status } = response.data
            // Only redirect if user has active paid plan AND trying to purchase the SAME plan+billing
            if (status === 'active' && (currentPlan === 'starter' || currentPlan === 'growth' || currentPlan === 'custom')) {
              // Allow upgrades/downgrades - only block if purchasing exact same plan+billing
              if (currentPlan === plan && currentBilling === billing) {
                router.push('/account/plan')
                return true
              }
            }
          }
        }
      } catch (error) {
        // Silently fail - allow user to proceed
      } finally {
        setCheckingSubscription(false)
      }
      return false
    }

    let mounted = true
    const initIntent = async () => {
      // First check subscription status
      const hasActiveSubscription = await checkExistingSubscription()
      if (hasActiveSubscription || !mounted) return

      if (!plan || plan === 'trial') return
      try {
        const res = await apiService.createSubscriptionIntent({ plan, billing, coupon: coupon || undefined })
        if (res.ok) {
          if (mounted) {
            // If there's no clientSecret, it means the invoice was already paid (upgrade complete)
            if (!res.data.clientSecret && res.data.isUpgrade) {
              // Upgrade completed automatically, redirect to success
              router.push(`/checkout/done?plan=${plan}&billing=${billing}`)
              return
            }

            if (res.data.clientSecret) {
              setClientSecret(res.data.clientSecret)
              setProrationDetails(res.data.prorationDetails || null)
              setError(null)
            } else {
              setError('Unable to initialize payment. Please try again.')
            }
          }
        } else if (mounted) {
          // Handle authentication errors (401)
          if (res.status === 401) {
            // Clear expired token
            if (typeof window !== 'undefined') {
              localStorage.removeItem('access_token')
            }
            // Redirect to login
            router.push(`/?signin=true&redirect=/checkout/payment?plan=${plan}&billing=${billing}${coupon ? `&coupon=${encodeURIComponent(coupon)}` : ''}`)
            return
          }
          // Only set error if component is still mounted and there's a real error
          setError(typeof res.data === 'string' ? res.data : (res as any)?.data?.message || 'Unable to prepare payment. Please check your plan configuration.')
        }
      } catch (e: any) {
        if (mounted) {
          setError(e?.message || 'Unable to prepare payment. Please try again.')
        }
      }
    }
    initIntent()
    return () => { mounted = false }
  }, [plan, billing, coupon, router])

  const handleBack = () => {
    if (plan) router.push(`/checkout/summary?plan=${plan}&billing=${billing}${coupon ? `&coupon=${encodeURIComponent(coupon)}` : ''}`)
    else router.push('/checkout/summary')
  }

  const title = plan ? `Payment — ${PLAN_NAMES[plan]} (${billing === 'annual' ? 'Annual' : 'Monthly'})` : 'Payment'

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            {/* Progress */}
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700">1</span>
              <span>Summary</span>
              <div className="w-8 h-px bg-gray-300" />
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-600 text-white">2</span>
              <span>Payment</span>
              <div className="w-8 h-px bg-gray-300" />
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-700">3</span>
              <span>Done</span>
            </div>

            <h1 className="mt-6 text-2xl font-semibold text-gray-900 text-center">{title}</h1>
            <p className="mt-2 text-center text-sm text-gray-600">Enter your card details. Your card is processed by Stripe.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">Card details</CardTitle>
                    <CardDescription>Cards only. 3D Secure may be required.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {error && (
                      <div className="text-sm text-red-600">
                        {error}
                        {!config.services.stripePublicKey && (
                          <div className="mt-1 text-xs text-gray-600">Stripe key missing. Set NEXT_PUBLIC_STRIPE_PUBLIC_KEY and reload.</div>
                        )}
                      </div>
                    )}
                    {clientSecret && stripePromise ? (
                      <Elements options={{ clientSecret, appearance: { theme: 'flat' } }} stripe={stripePromise}>
                        <PaymentForm onBack={handleBack} onSuccess={() => router.push(`/checkout/done?plan=${plan}&billing=${billing}`)} clientSecret={clientSecret} />
                      </Elements>
                    ) : (
                      !error && (
                        <div className="flex items-center justify-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                            <p className="text-sm text-gray-600">Preparing secure payment...</p>
                          </div>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>

                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">Business details (optional)</CardTitle>
                    <CardDescription>Used for Stripe Tax and invoice headers.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input placeholder="Company name (optional)" />
                    <Input placeholder="Tax ID (optional)" />
                    <Input placeholder="Address line 1 (optional)" className="md:col-span-2" />
                    <Input placeholder="City (optional)" />
                    <Input placeholder="Country (optional)" />
                  </CardContent>
                  <CardFooter>
                    <p className="text-xs text-gray-500">By paying, you agree to our Terms and Privacy Policy.</p>
                  </CardFooter>
                </Card>

                {/* Action buttons are inside PaymentForm */}
              </div>

              <div className="space-y-4">
                <Card className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-base">Order summary</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Plan</span>
                      <span className="text-gray-900 font-medium">{plan ? PLAN_NAMES[plan] : '—'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-gray-700">Billing</span>
                      <span className="text-gray-900 font-medium capitalize">{billing}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-gray-700">Price (USD)</span>
                      <span className="text-gray-900 font-semibold">{formatPriceUSD(price)}{price > 0 && <span className="text-gray-500 font-normal">/mo</span>}</span>
                    </div>
                    {coupon && (
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-gray-700">Coupon</span>
                        <span className="text-gray-900">{coupon}</span>
                      </div>
                    )}
                    {billing === 'annual' && price > 0 && (
                      <p className="mt-2 text-xs text-gray-500">20% off annual applied</p>
                    )}
                    <p className="mt-4 text-xs text-gray-500">Taxes calculated automatically with Stripe Tax.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutPaymentContent />
    </Suspense>
  )
}
