'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Sparkles, Loader2, Check, Shirt, ShoppingBasket, Laptop, Heart, Home, Trophy } from 'lucide-react'
import { apiService } from '@/lib/api-service'

const quickPrompts = [
  {
    text: 'Fashion Store',
    icon: Shirt,
    prompt: "Build a premium fashion store mobile app for men's and women's apparel under the brand name Flickz, delivering a high-end look and feel comparable to leading global fashion brands"
  },
  { text: 'Food & Grocery', icon: ShoppingBasket, prompt: 'Build a premium food and grocery mobile app offering fresh produce, daily essentials, and household items, with a modern, high-quality shopping experience similar to leading grocery brands.' },
  { text: 'Electronics Shop', icon: Laptop, prompt: 'Build an electronics shop mobile app that allows customers to browse and purchase gadgets, accessories, and smart devices through a sleek, premium user experience' },
  { text: 'Health & Beauty', icon: Heart, prompt: 'Build a premium health and beauty mobile app offering skincare, cosmetics, and wellness products, designed with an elegant, trust-driven experience comparable to leading beauty brands.' },
  { text: 'Home & Garden', icon: Home, prompt: 'Build a home and garden mobile app for selling décor, furniture, and garden products, featuring a clean, modern design aligned with major home retailers' },
  { text: 'Sports & Outdoors', icon: Trophy, prompt: 'Build a sports and outdoors mobile app that lets customers shop activewear, equipment, and outdoor gear through a dynamic, premium experience inspired by top sports brands.' }
]

const placeholderTexts = [
  "Build a mobile app where I sell kids toys. Brand name is Toyzz and I would like to have a green colour theme.",
  "Create a mobile store for selling organic groceries and fresh produce. Include categories for fruits, vegetables, dairy, and pantry items with fast checkout.",
  "Fashion boutique mobile app for women's clothing and accessories. Need product filtering by size, color, and price with secure payment.",
  "Electronics store selling phones, laptops, and gadgets. Include product specifications, warranty info, and multiple payment options.",
]

export default function HomeAppBuilder() {
  const [prompt, setPrompt] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [placeholderText, setPlaceholderText] = useState('')
  const [isTyping, setIsTyping] = useState(true)
  const router = useRouter()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Typewriter animation effect
  useEffect(() => {
    if (!isTyping) return

    let currentTextIndex = 0
    let currentCharIndex = 0
    let isDeleting = false
    let animationTimeout: ReturnType<typeof setTimeout>

    const typeWriter = () => {
      const currentFullText = placeholderTexts[currentTextIndex]

      if (!isDeleting) {
        // Typing forward
        setPlaceholderText(currentFullText.substring(0, currentCharIndex))
        currentCharIndex++

        if (currentCharIndex > currentFullText.length) {
          // Pause at end before deleting
          animationTimeout = setTimeout(() => {
            isDeleting = true
            typeWriter()
          }, 2000)
        } else {
          animationTimeout = setTimeout(typeWriter, 50)
        }
      } else {
        // Deleting backward
        currentCharIndex--
        setPlaceholderText(currentFullText.substring(0, currentCharIndex))

        if (currentCharIndex === 0) {
          // Move to next text
          isDeleting = false
          currentTextIndex = (currentTextIndex + 1) % placeholderTexts.length
          animationTimeout = setTimeout(typeWriter, 500)
        } else {
          animationTimeout = setTimeout(typeWriter, 30)
        }
      }
    }

    // Start typing immediately
    typeWriter()

    // Cleanup
    return () => {
      if (animationTimeout) {
        clearTimeout(animationTimeout)
      }
    }
  }, [isTyping])

  const handleBuild = async () => {
    const idea = prompt.trim()

    if (!idea || isBuilding) {
      return
    }

    setError(null)
    setIsBuilding(true)
    setLoadingProgress(0)

    // Get average response time from previous calls (default: 10000ms for first call)
    const lastResponseTime = parseInt(localStorage.getItem('lastApiResponseTime') || '10000')
    const expectedDuration = lastResponseTime * 1.1 // Add 10% buffer

    // Calculate smooth progress increments to reach 95% by expected completion
    const updateInterval = 200 // Update every 200ms for smooth animation
    const totalUpdates = expectedDuration / updateInterval
    const incrementPerUpdate = 95 / totalUpdates // Reach 95% when API should complete

    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 95) return prev // Stop at 95%, wait for API
        return Math.min(prev + incrementPerUpdate, 95)
      })
    }, updateInterval)

    try {
      // Persist for downstream flows
      localStorage.setItem('mobile_app_idea', idea)
      localStorage.setItem('app_idea', idea)

      // Track API response time
      const startTime = Date.now()
      const response = await apiService.getAppSpec(idea)
      const responseTime = Date.now() - startTime

      // Store for future predictions
      localStorage.setItem('lastApiResponseTime', responseTime.toString())

      clearInterval(progressInterval)
      setLoadingProgress(100)

      if (response.ok && response.data) {
        const rand = Math.random().toString(36).slice(2, 8)
        const token = `s_${Date.now().toString(36)}_${rand}`
        const payload = { prompt: idea, spec: response.data, at: Date.now() }
        try {
          sessionStorage.setItem(`appSpec:${token}`, JSON.stringify(payload))
          sessionStorage.setItem('lastAppSpec', JSON.stringify(payload))
        } catch {
          /* ignore */
        }

        // Small delay to show 100% completion
        setTimeout(() => {
          router.push('/app-spec')
        }, 500)
        return
      }

      const message =
        typeof response.data === 'string'
          ? response.data
          : 'Failed to generate your app. Please try again.'
      setError(message)
    } catch (err: any) {
      clearInterval(progressInterval)
      const message = err?.message || 'Something went wrong. Please try again.'
      setError(message)
      setIsBuilding(false) // Hide modal immediately on error
    }
    // Note: Don't set isBuilding to false on success - let the navigation handle unmounting
  }

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isBuilding) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'

      return () => {
        // Restore scroll position
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isBuilding])

  // Loading Modal with Portal to escape parent overflow-hidden
  const renderLoadingModal = () => {
    if (!isBuilding) {
      return null
    }

    if (typeof document === 'undefined') {
      return null
    }

    const modalContent = (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          overflow: 'hidden'
        }}
      >
        <div className="relative bg-white rounded-3xl p-12 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center animate-pulse">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <Loader2 className="w-24 h-24 text-orange-500 absolute -top-2 -left-2 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">Creating Your App</h3>
              <p className="text-sm text-gray-600">Our AI is analyzing your requirements and designing your perfect mobile store...</p>
            </div>
            <div className="w-full space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(loadingProgress, 100)}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Analyzing design patterns...</span>
                <span>{Math.round(loadingProgress)}%</span>
              </div>
            </div>
            <div className="w-full space-y-2 text-sm text-gray-600">
              <div className={`flex items-center gap-2 transition-opacity ${loadingProgress > 10 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingProgress > 10 ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <Check className={`w-3 h-3 ${loadingProgress > 10 ? 'text-white' : 'text-gray-400'}`} strokeWidth={3} />
                </div>
                <span>Analyzing your requirements</span>
              </div>
              <div className={`flex items-center gap-2 transition-opacity ${loadingProgress > 40 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingProgress > 40 ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <Check className={`w-3 h-3 ${loadingProgress > 40 ? 'text-white' : 'text-gray-400'}`} strokeWidth={3} />
                </div>
                <span>Selecting optimal mobile design</span>
              </div>
              <div className={`flex items-center gap-2 transition-opacity ${loadingProgress > 70 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingProgress > 70 ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <Check className={`w-3 h-3 ${loadingProgress > 70 ? 'text-white' : 'text-gray-400'}`} strokeWidth={3} />
                </div>
                <span>Generating custom features</span>
              </div>
              <div className={`flex items-center gap-2 transition-opacity ${loadingProgress > 95 ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${loadingProgress > 95 ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <Check className={`w-3 h-3 ${loadingProgress > 95 ? 'text-white' : 'text-gray-400'}`} strokeWidth={3} />
                </div>
                <span>Finalizing your app spec</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    return createPortal(modalContent, document.body)
  }


  return (
    <>
      <aside className="flex justify-end md:justify-center" aria-label="App builder form">
        <div className="w-full rounded-3xl bg-gradient-to-b from-[#fff8f1] to-white shadow-[0_20px_60px_rgba(251,146,60,0.3)] border-2 border-orange-200 p-6 space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900">Describe Your Mobile Store</h2>

          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 shadow-inner min-h-[120px] resize-none"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsTyping(false)}
            placeholder={placeholderText}
          />

          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={handleBuild}
              disabled={isBuilding || !prompt.trim()}
              className="w-full rounded-[14px] bg-gradient-to-r from-orange-600 to-orange-500 py-3.5 text-white font-semibold shadow-[0_14px_30px_rgba(251,146,60,0.35)] hover:from-orange-700 hover:to-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label={isBuilding ? 'Building your app' : 'Generate app now'}
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              {isBuilding ? 'Building your app...' : 'Generate App Now'}
              <span className="text-lg" aria-hidden="true">→</span>
            </button>
            {error && <div className="text-xs text-red-500">{error}</div>}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />

          <div className="space-y-3">
            <div className="text-[11px] font-semibold tracking-wide text-slate-500">QUICK PROMPTS</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickPrompts.map((qp) => {
                const Icon = qp.icon
                return (
                  <button
                    key={qp.text}
                    type="button"
                    onClick={() => setPrompt(qp.prompt)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.05)] hover:border-orange-200 hover:text-orange-600 transition flex items-center justify-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {qp.text}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 text-[11px] text-slate-500 pt-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              No credit cards needed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              14-day trial
            </span>
          </div>
        </div>
      </aside>

      {/* Loading Modal */}
      {renderLoadingModal()}
    </>
  )
}
