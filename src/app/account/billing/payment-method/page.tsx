'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/layout'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { apiService } from '@/lib/api-service'
import { config } from '@/lib/config'
import { Loader2, CreditCard, Check, ArrowLeft, Lock } from 'lucide-react'

function UpdateCardForm({ onSaved }: { onSaved: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!stripe || !elements) return
    setSaving(true)
    setError(null)
    try {
      const { error, setupIntent } = await stripe.confirmSetup({ elements, redirect: 'if_required' })
      if (error) {
        setError(error.message || 'Failed to update card')
        setSaving(false)
        return
      }
      // Immediately set the new card as the customer's default payment method.
      // The setup_intent.succeeded webhook also does this, but calling it here
      // ensures the card is ready for any immediate charges/upgrades.
      if (setupIntent?.id) {
        try {
          await apiService.attachPaymentMethod({ setupIntentId: setupIntent.id })
        } catch {
          // Non-fatal: webhook will handle it if this fails
        }
      }
      onSaved()
    } catch (err) {
      setError('An unexpected error occurred')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
        <PaymentElement
          options={{
            layout: 'tabs',

          }}
        />
      </div>

      {error && (
        <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => history.back()}
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!stripe || saving}
          size="sm"
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Save card
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function UpdatePaymentMethodPage() {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripePromise] = useState(() => loadStripe(config.services.stripePublicKey || ''))

  useEffect(() => {
    let mounted = true
    apiService.createSetupIntent().then((res) => {
      if (res.ok && res.data.clientSecret && mounted) {
        setClientSecret(res.data.clientSecret)
      }
    }).catch(() => { }).finally(() => {
      if (mounted) setPageLoading(false)
    })
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        {pageLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-sm text-gray-600">Loading payment form...</p>
            </div>
          </div>
        ) : (
          <section className="pt-20 md:pt-28 lg:pt-24 pb-16 px-6">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-6 h-6 text-orange-600" />
                <h1 className="text-2xl font-semibold text-gray-900">Update payment method</h1>
              </div>
              <p className="mt-2 text-sm text-gray-600">This card will be used for future renewals and charges.</p>

              {saved ? (
                <Card className="mt-8 border-2 border-green-200 bg-green-50">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment method updated</h3>
                        <p className="text-sm text-gray-700 mb-4">
                          Your new card has been saved successfully and will be used for all future payments.
                        </p>
                        <Button
                          onClick={() => router.push('/account/billing')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          Return to Billing
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="mt-8 border-2 border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-gray-600" />
                      <CardTitle className="text-base">Secure payment details</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l10 4v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V6l10-4z"/>
                      </svg>
                      Processed securely by Stripe
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clientSecret && config.services.stripePublicKey ? (
                      <Elements
                        options={{
                          clientSecret,
                          appearance: {
                            theme: 'flat',
                            variables: {
                              colorPrimary: '#ea580c',
                              borderRadius: '8px',
                            }
                          }
                        }}
                        stripe={stripePromise}
                      >
                        <UpdateCardForm onSaved={() => setSaved(true)} />
                      </Elements>
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-gray-600 py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-orange-600" />
                        <span>Preparing secure payment form…</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="mt-6 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Your payment information is encrypted and securely processed by Stripe. We never store your complete card details.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
