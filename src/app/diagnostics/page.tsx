'use client'

import { useEffect, useState } from 'react'
import { Navigation, Footer } from '@/components/layout'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { apiService } from '@/lib/api-service'
import { loadStripe } from '@stripe/stripe-js'
import { config } from '@/lib/config'

type DiagnosticChecks = Record<string, { ok: boolean; priceId?: string; error?: string }>

type StripeHealthCheck = {
  status: 'checking' | 'success' | 'error'
  message: string
  details?: any
}

export default function DiagnosticsPage() {
  const [envData, setEnvData] = useState<{ NEXT_PUBLIC_STRIPE_PUBLIC_KEY?: string; hasKey?: boolean } | null>(null)
  const [diag, setDiag] = useState<{ accountId?: string | null; accountEmail?: string | null; checks?: DiagnosticChecks } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [webStripeHealth, setWebStripeHealth] = useState<StripeHealthCheck>({ status: 'checking', message: 'Testing...' })
  const [apiStripeHealth, setApiStripeHealth] = useState<StripeHealthCheck>({ status: 'checking', message: 'Testing...' })

  useEffect(() => {
    let mounted = true
    const run = async () => {
      setError(null)

      // Test 1: Web Client Stripe Connection
      try {
        const key = config.services.stripePublicKey
        if (!key) {
          setWebStripeHealth({
            status: 'error',
            message: 'No publishable key found in client bundle',
            details: { key: 'NOT_FOUND' }
          })
        } else {
          const stripe = await loadStripe(key)
          if (stripe) {
            setWebStripeHealth({
              status: 'success',
              message: 'Successfully loaded Stripe.js client library',
              details: {
                keyPrefix: key.substring(0, 20) + '...',
                stripeLoaded: true
              }
            })
          } else {
            setWebStripeHealth({
              status: 'error',
              message: 'Failed to initialize Stripe.js (invalid key or network error)',
              details: { keyPrefix: key.substring(0, 20) + '...' }
            })
          }
        }
      } catch (e: any) {
        setWebStripeHealth({
          status: 'error',
          message: e.message || 'Error loading Stripe.js',
          details: { error: e.toString() }
        })
      }

      // Test 2: Environment Variable Check
      try {
        const envResp = await fetch('/api/test-env')
        const envJson = await envResp.json()
        if (!mounted) return
        setEnvData(envJson)
      } catch (e: any) {
        if (!mounted) return
        setEnvData({ NEXT_PUBLIC_STRIPE_PUBLIC_KEY: 'NOT_FOUND', hasKey: false })
      }

      // Test 3: API Stripe Connection & Diagnostics
      try {
        const res = await apiService.getBillingDiagnostics()
        if (!mounted) return
        if (res.ok) {
          setDiag(res.data as any)
          // If we got account info, API Stripe connection is working
          if ((res.data as any)?.accountId) {
            setApiStripeHealth({
              status: 'success',
              message: 'API successfully connected to Stripe',
              details: {
                accountId: (res.data as any).accountId,
                accountEmail: (res.data as any).accountEmail
              }
            })
          } else {
            setApiStripeHealth({
              status: 'error',
              message: 'API returned diagnostics but no Stripe account info',
              details: res.data
            })
          }
        } else if (res.status === 401) {
          setError('Please sign in to run server diagnostics. The API requires authentication.')
          setApiStripeHealth({
            status: 'error',
            message: 'Authentication required to test API Stripe connection'
          })
        } else if (res.status === 403) {
          setError('You are signed in but not authorized to view diagnostics.')
          setApiStripeHealth({
            status: 'error',
            message: 'Not authorized to test API Stripe connection'
          })
        } else {
          setError(`Diagnostics request failed: HTTP ${res.status}`)
          setApiStripeHealth({
            status: 'error',
            message: `API request failed with HTTP ${res.status}`
          })
        }
      } catch (e: any) {
        if (!mounted) return
        setError(e?.message || 'Failed to reach diagnostics endpoint')
        setApiStripeHealth({
          status: 'error',
          message: e?.message || 'Failed to reach API diagnostics endpoint',
          details: { error: e.toString() }
        })
      }
    }
    run()
    return () => { mounted = false }
  }, [])

  const hasPk = !!envData?.hasKey && !!envData?.NEXT_PUBLIC_STRIPE_PUBLIC_KEY && envData?.NEXT_PUBLIC_STRIPE_PUBLIC_KEY !== 'NOT_FOUND'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-700'
      case 'error': return 'text-red-600'
      case 'checking': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'checking': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navigation />
      <main className="flex-1">
        <section className="py-14 px-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold text-gray-900">Stripe Setup Diagnostics</h1>
            <p className="text-gray-600 text-sm">Use this page to validate that your publishable key is loaded in the web app and that the API resolves plan prices and Stripe account correctly.</p>

            {/* Health Check Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`border-2 ${webStripeHealth.status === 'success' ? 'border-green-500' : webStripeHealth.status === 'error' ? 'border-red-500' : 'border-yellow-500'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Web Client Health</CardTitle>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(webStripeHealth.status)}`}>
                      {webStripeHealth.status.toUpperCase()}
                    </span>
                  </div>
                  <CardDescription>Stripe.js client-side connection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${getStatusColor(webStripeHealth.status)}`}>
                      {webStripeHealth.message}
                    </p>
                    {webStripeHealth.details && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(webStripeHealth.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className={`border-2 ${apiStripeHealth.status === 'success' ? 'border-green-500' : apiStripeHealth.status === 'error' ? 'border-red-500' : 'border-yellow-500'}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">API Server Health</CardTitle>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(apiStripeHealth.status)}`}>
                      {apiStripeHealth.status.toUpperCase()}
                    </span>
                  </div>
                  <CardDescription>Stripe API server-side connection</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className={`text-sm font-medium ${getStatusColor(apiStripeHealth.status)}`}>
                      {apiStripeHealth.message}
                    </p>
                    {apiStripeHealth.details && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <pre className="whitespace-pre-wrap break-all">
                          {JSON.stringify(apiStripeHealth.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">Web Key (Client)</CardTitle>
                <CardDescription>Checks the publishable key the browser is actually using</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">NEXT_PUBLIC_STRIPE_PUBLIC_KEY present</span>
                    <span className={hasPk ? 'text-green-700' : 'text-red-600'}>{hasPk ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="mt-2 break-all text-gray-700">
                    <span className="text-gray-500">Value: </span>
                    <code className="text-xs">{envData?.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'NOT_FOUND'}</code>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Set this in apps/web/.env and restart the web server.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-base">API Diagnostics (Server)</CardTitle>
                <CardDescription>Stripe account id and price mapping resolution per plan</CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-sm text-red-600">{error}</div>
                )}
                {!error && (
                  <div className="text-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Stripe Account Id</span>
                      <span className={diag?.accountId ? 'text-gray-900' : 'text-red-600'}>{diag?.accountId || 'NOT RESOLVED'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Stripe Account Email</span>
                      <span className="text-gray-900">{diag?.accountEmail || '—'}</span>
                    </div>

                    <div className="mt-4">
                      <p className="text-gray-700 font-medium">Price Mapping Checks</p>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {['startup_monthly','startup_annual','growth_monthly','growth_annual'].map((k) => {
                          const c = diag?.checks?.[k]
                          return (
                            <div key={k} className="rounded-lg border border-gray-200 p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-700">{k}</span>
                                <span className={c?.ok ? 'text-green-700' : 'text-red-600'}>{c?.ok ? 'OK' : 'Missing'}</span>
                              </div>
                              <div className="mt-1 text-xs text-gray-600 break-all">
                                {c?.ok ? (<>
                                  <span className="text-gray-500">priceId: </span>{c.priceId}
                                </>) : (
                                  <>
                                    <span className="text-gray-500">error: </span>{c?.error || '—'}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="mt-2 text-xs text-gray-500">API resolves mapping from env (STRIPE_PRICE_…) or Stripe Price lookup_key (e.g., startup_monthly).</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
