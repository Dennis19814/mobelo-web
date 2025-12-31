'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { PRICING_TIERS } from '@/lib/plans'
import { SigninModal } from '@/components/modals'

export default function PricingSection() {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [showSignin, setShowSignin] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [pendingPlan, setPendingPlan] = useState<{ plan: string; billing: 'monthly' | 'annual' } | null>(null)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    setIsAuthed(!!token)
  }, [])

  const calculatePrice = (monthlyPrice: number) => {
    if (billingCycle === 'annual') {
      // Annual price with 20% discount
      return Math.floor(monthlyPrice * 0.8)
    }
    return monthlyPrice
  }

  return (
    <section className="bg-white py-16" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center space-y-3 mb-10">
          <h2 id="pricing-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">Simple, Transparent Pricing</h2>
          <p className="text-slate-600">Choose the plan that fits your business. All plans include a 14-day free trial.</p>
        </div>
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white p-1 text-sm font-semibold shadow-sm">
            {(['monthly', 'annual'] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`px-4 py-2 rounded-[14px] transition ${
                  billingCycle === cycle
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600'
                }`}
              >
                {cycle === 'monthly' ? 'Monthly' : 'Annual'}
              </button>
            ))}
            <span className="ml-2 rounded-full bg-emerald-100 text-emerald-700 px-2 py-1 text-[11px] font-semibold">
              Save 20%
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`rounded-3xl border p-6 h-full flex flex-col ${
                tier.highlight
                  ? 'border-orange-400 bg-gradient-to-b from-orange-50 to-white shadow-md shadow-orange-100 relative overflow-visible'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-[14px] bg-orange-500 text-white px-4 py-1 text-xs font-semibold shadow-md">
                  {tier.badge}
                </div>
              )}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold text-slate-900">{tier.name}</div>
                  <div className="text-sm text-slate-500">{tier.description}</div>
                </div>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <div className="text-4xl font-extrabold text-slate-900">${calculatePrice(tier.monthlyPrice)}</div>
                <div className="text-sm text-slate-500">{tier.note}</div>
              </div>
              {billingCycle === 'annual' && (
                <div className="flex items-baseline gap-2 mb-1">
                  <div className="text-sm text-slate-400 line-through">${tier.monthlyPrice}/month</div>
                  <div className="text-xs text-emerald-600 font-semibold">Save 20%</div>
                </div>
              )}
              {tier.trialNote && <div className="text-xs text-slate-500 mb-4">{tier.trialNote}</div>}
              {!tier.trialNote && <div className="mb-4">&nbsp;</div>}
              <div className="text-xs font-semibold text-slate-500 mb-2">WHAT'S INCLUDED:</div>
              <ul className="space-y-2 text-sm text-slate-700 flex-1 mb-5">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-orange-500 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <button
                  onClick={() => {
                    // Check authentication
                    if (!isAuthed) {
                      setPendingPlan({ plan: tier.key, billing: billingCycle })
                      setShowSignin(true)
                    } else {
                      // Navigate to checkout with plan and billing
                      router.push(`/checkout/summary?plan=${tier.key}&billing=${billingCycle}`)
                    }
                  }}
                  className={`w-full rounded-[14px] py-3 font-semibold transition ${
                    tier.highlight || tier.ctaVariant === 'primary'
                      ? 'bg-orange-500 text-white shadow-[0_8px_20px_rgba(251,146,60,0.35)] hover:bg-orange-600'
                      : 'bg-slate-100 border border-slate-200 text-slate-900 hover:border-orange-200'
                  }`}
                >
                  {tier.cta} <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <div>Starter plan includes 14-day free trial.</div>
          <div>
            Need a custom plan?{' '}
            <a className="text-orange-600 font-semibold hover:underline" href="#">
              Contact our sales team
            </a>
          </div>
        </div>
      </div>

      {/* Signin Modal */}
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
    </section>
  )
}
