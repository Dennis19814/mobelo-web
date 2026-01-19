'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation, Footer } from '@/components/layout'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui'
import { CheckCircle } from 'lucide-react'
import { PLAN_NAMES, normalizePlan, normalizeBilling, type BillingCycle, type PlanKey } from '@/lib/plans'

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function CheckoutDoneContent() {
  const params = useSearchParams()
  const plan: PlanKey | null = useMemo(() => normalizePlan(params.get('plan')), [params])
  const billing: BillingCycle = useMemo(() => normalizeBilling(params.get('billing')), [params])

  const nextRenewal = (() => {
    const now = new Date()
    if (billing === 'annual') {
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
    }
    // month ahead
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
  })()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1 flex items-center justify-center pt-20 md:pt-28 lg:pt-24">
        <section className="w-full px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <h1 className="mt-3 text-2xl font-semibold text-gray-900">You’re all set</h1>
              <p className="mt-2 text-sm text-gray-600">{plan ? PLAN_NAMES[plan] : 'Your plan'} is active. Next renewal on {formatDate(nextRenewal)}.</p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base">What’s next?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Set up your products and explore templates</li>
                    <li>Invite teammates and configure your store</li>
                    <li>View your invoices under Billing</li>
                  </ul>
                </CardContent>
                <CardFooter className="gap-3">
                  <Button onClick={() => location.assign('/my-apps')}>Go to dashboard</Button>
                  <Button variant="outline" onClick={() => location.assign('/account/billing')}>View billing</Button>
                </CardFooter>
              </Card>
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-base">Billing details</CardTitle>
                  <CardDescription className="capitalize">{billing} plan • USD</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Manage payment methods and download invoices any time.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function CheckoutDonePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center pt-20 md:pt-28 lg:pt-24">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <CheckoutDoneContent />
    </Suspense>
  )
}

