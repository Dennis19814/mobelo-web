'use client'
import { useEffect, useMemo, useState } from 'react'
import { Sparkles, PenTool, Palette } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose?: () => void
}

type Step = {
  id: number
  title: string
  subtitle: string
  icon: (props: { className?: string; style?: any }) => React.ReactElement
}

export default function GenerationProgressModal({ isOpen, onClose }: Props) {
  const steps: Step[] = useMemo(() => [
    {
      id: 1,
      title: 'Ideating your app idea',
      subtitle: 'Refining your concept with market-fit',
      icon: (p) => <Sparkles {...p} />
    },
    {
      id: 2,
      title: 'Designing your app idea',
      subtitle: 'Crafting pages, flows and key features',
      icon: (p) => <PenTool {...p} />
    },
    {
      id: 3,
      title: 'Selecting theme styles & colours',
      subtitle: 'Picking typography, palettes and accents',
      icon: (p) => <Palette {...p} />
    }
  ], [])

  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % steps.length)
    }, 15000) // 15 seconds per step
    return () => clearInterval(interval)
  }, [isOpen, steps.length])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4">
      {/* Soft gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 opacity-95" />
      <div className="absolute inset-0 bg-black/10" />

      {/* Modal card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white/90 shadow-2xl border border-gray-200 backdrop-blur-sm mt-16 md:mt-24">
        {/* Header */}
        <div className="px-6 pt-6">
          <h3 className="text-xl font-semibold text-gray-900">Generating your mobile app</h3>
          <p className="mt-1 text-sm text-gray-600">Hang tight while we turn your idea into a beautiful concept.</p>
        </div>

        {/* Progress indicator */}
        <div className="px-6 mt-4">
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="px-2 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {steps.map((s, idx) => {
            const active = idx === activeIndex
            const Icon = s.icon
            return (
              <div
                key={s.id}
                className={
                  `relative rounded-xl border transition-all duration-300 p-4 bg-white/70 ` +
                  (active
                    ? 'border-orange-300 shadow-[0_6px_24px_rgba(59,130,246,0.25)]'
                    : 'border-gray-200 shadow-sm')
                }
              >
                <div className="flex items-start gap-3">
                  <div className={
                    `relative flex h-12 w-12 items-center justify-center rounded-xl ` +
                    (active
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-gray-100 text-gray-600')
                  }>
                    {/* Animated ring */}
                    <div
                      className={
                        `absolute inset-0 rounded-xl border-2 ` +
                        (active ? 'border-orange-200 animate-spin' : 'border-gray-200')
                      }
                      style={active ? { animationDuration: '15s' } : undefined}
                    />
                    <Icon className={active ? 'h-6 w-6 animate-pulse' : 'h-6 w-6 opacity-80'} style={active ? { animationDuration: '15s' } : undefined} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={"text-sm font-semibold " + (active ? 'text-gray-900' : 'text-gray-700')}>{s.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.subtitle}</p>
                  </div>
                </div>
                {/* Circular spinner only when active */}
                {active ? (
                  <div className="mt-4 flex items-center gap-2">
                    <div
                      className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"
                      style={{ animationDuration: '0.8s' }}
                    />
                    <span className="text-xs text-gray-500">Thinking…</span>
                  </div>
                ) : (
                  // Keep spacing consistent when inactive
                  <div className="mt-4 h-4" />
                )}
              </div>
            )
          })}
        </div>

        {/* Footer removed per request */}
      </div>
    </div>
  )
}
