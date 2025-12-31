'use client'

import { useState } from 'react'

interface Result {
  id: number
  appId: number
  status: string
  currentStep?: string
  progress: number
  errorMessage?: string
}

export default function TestContentGenerationPage() {
  const [appId, setAppId] = useState('')
  const [productOrNiche, setProductOrNiche] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleQueue() {
    setError(null)
    setResult(null)

    const numericAppId = Number(appId)
    if (!numericAppId || Number.isNaN(numericAppId)) {
      setError('Please enter a valid numeric app ID')
      return
    }
    if (!productOrNiche.trim()) {
      setError('Please enter a product or niche')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        '/api/admin/content-generation/queue-test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appId: numericAppId,
            productOrNiche: productOrNiche.trim(),
          }),
        },
      )

      const data = await res.json()

      if (!res.ok) {
        setError(
          data?.message ||
            `Request failed with status ${res.status}`,
        )
        return
      }

      setResult(data)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold">
          Test Smart Content Generation
        </h1>
        <p className="text-sm text-slate-300">
          Queue a manual content-generation job for an existing app.
          Simply provide the App ID and a product/niche. The AI will automatically
          generate categories, brands, and product details based on your input.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              App ID
            </label>
            <input
              type="number"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Product or Niche
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={productOrNiche}
              onChange={(e) =>
                setProductOrNiche(e.target.value)
              }
              placeholder="e.g., Fashion, Electronics, Food & Beverage, Fitness, Beauty..."
            />
            <p className="text-xs text-slate-400 mt-1">
              The AI will infer industry, target demographic, and style from your product type.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQueue}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600 disabled:opacity-60"
        >
          {loading ? 'Queueing…' : 'Queue content-generation job'}
        </button>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-950 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-md border border-slate-700 bg-slate-900 px-3 py-3 text-xs">
            <div className="mb-2 font-medium">
              Job queued successfully
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

