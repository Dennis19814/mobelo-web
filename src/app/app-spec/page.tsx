'use client'
import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/layout'
import HomeAppCarousel from '@/components/HomeAppCarousel'
import { SigninModal } from '@/components/modals'
import { apiService } from '@/lib/api-service'
import {
  Home as HomeIcon,
  Search,
  ShoppingBag,
  ShoppingCart,
  Heart,
  Package,
  User,
  Image as ImageIcon,
  Tag,
  Truck,
  CalendarCheck,
  Sparkles,
  BadgePercent,
  Camera,
  Layers,
  Landmark,
  ClipboardList,
  CheckCircle,
  ArrowLeft,
  RotateCcw,
  Users,
  Star,
  BarChart3,
  UserCog,
  CreditCard,
  Calculator,
  Megaphone,
  Filter,
  Gift,
  Share2,
  Bell,
  TrendingUp,
  Zap,
  Shield,
  MessageCircle,
  Percent,
  RefreshCw,
  Grid,
  Ruler,
  Scale,
  Eye,
  Clock,
  Bookmark,
  MapPin,
  Loader2,
} from 'lucide-react'

type KeyFeature = { feature: string; why: string }
type PageExpl = { pageId: string; title: string; role: 'promote'|'sell'|'discover'|'retain'|'support'; why: string }

type ThemeColors = {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
}

type SuggestedTheme = {
  id: string
  displayName: string
  colors: ThemeColors
  icon?: string
  category?: string
  isDark?: boolean
}

type AppSpec = {
  best: {
    verticalName: string
    confidence: number
    suggestedThemes?: SuggestedTheme[]
  }
  explanation: { keyFeatures: KeyFeature[]; pages: PageExpl[] }
  concept: { appName: string; oneLiner: string; heroTagline: string; homepageSections: string[]; recommendedPages: string[] }
  theme?: { id: string; displayName: string; colors: ThemeColors; usage?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string }; isDark?: boolean }
  fonts?: { heading: string; body: string }
  menuItems?: string[]
  shortDescription?: string
}

function AppSpecContent() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('spec')
  const [data, setData] = useState<{ prompt: string; spec: AppSpec } | null>(null)
  const [showSigninModal, setShowSigninModal] = useState(false)
  const themeMenuRef = useRef<HTMLDivElement | null>(null)
  const darkThemes: SuggestedTheme[] = [
    {
      id: 'dark-midnight',
      displayName: 'Midnight Neon',
      colors: {
        primary: '#38BDF8',
        secondary: '#A855F7',
        accent: '#F97316',
        background: '#0B1120',
        text: '#E2E8F0',
      },
      icon: '🌙',
      category: 'Dark',
      isDark: true,
    },
    {
      id: 'dark-forest',
      displayName: 'Forest Night',
      colors: {
        primary: '#22C55E',
        secondary: '#0EA5E9',
        accent: '#F59E0B',
        background: '#0B1F17',
        text: '#E5F0EA',
      },
      icon: '🌲',
      category: 'Dark',
      isDark: true,
    },
    {
      id: 'dark-graphite',
      displayName: 'Graphite Pro',
      colors: {
        primary: '#F97316',
        secondary: '#64748B',
        accent: '#38BDF8',
        background: '#0F172A',
        text: '#E2E8F0',
      },
      icon: '⚡',
      category: 'Dark',
      isDark: true,
    },
  ]
  const [selectedThemeId, setSelectedThemeId] = useState('theme')
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)

  // Load Google Fonts dynamically based on API response
  useEffect(() => {
    const spec = data?.spec
    if (!spec || !spec.fonts) return
    const families = [spec.fonts.heading, spec.fonts.body].filter(Boolean) as string[]
    if (families.length === 0) return
    const toGF = (name: string) => name.trim().replace(/\s+/g, '+')
    const href = `https://fonts.googleapis.com/css2?${families
      .map(f => `family=${encodeURIComponent(toGF(f))}:wght@400;600;700`)
      .join('&')}&display=swap`
    const id = 'dynamic-google-fonts'
    let link = document.getElementById(id) as HTMLLinkElement | null
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    } else if (link.href !== href) {
      link.href = href
    }
  }, [data?.spec?.fonts?.heading, data?.spec?.fonts?.body, data?.spec])

  useEffect(() => {
    // Try token-based sessionStorage first
    try {
      if (token) {
        const raw = sessionStorage.getItem(`appSpec:${token}`)
        if (raw) {
          setData(JSON.parse(raw))
          return
        }
      }
      // Fallback to lastAppSpec
      const rawLast = sessionStorage.getItem('lastAppSpec')
      if (rawLast) {
        setData(JSON.parse(rawLast))
        return
      }
    } catch {}
    // If nothing found, go home
    router.replace('/')
  }, [router, token])

  useEffect(() => {
    if (!isThemeMenuOpen) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (themeMenuRef.current && !themeMenuRef.current.contains(target)) {
        setIsThemeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isThemeMenuOpen])

  useEffect(() => {
    const spec = data?.spec
    if (!spec) return
    const baseThemes = (spec.best?.suggestedThemes && spec.best.suggestedThemes.length > 0)
      ? spec.best.suggestedThemes
      : (spec.theme ? [spec.theme] : [])
    const themes = [...baseThemes, ...darkThemes.filter((theme) => !baseThemes.some((t) => t.id === theme.id))]
    const defaultId = spec.theme?.id || themes[0]?.id
    if (!defaultId) return
    const isCurrentValid = themes.some((theme) => theme.id === selectedThemeId)
    if (selectedThemeId === 'theme' || !isCurrentValid) {
      setSelectedThemeId(defaultId)
    }
  }, [data, selectedThemeId, darkThemes])

  const roleClass = (role: string) =>
    `inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
      role === 'promote' ? 'border-orange-200 text-orange-700 bg-orange-50' :
      role === 'discover' ? 'border-amber-200 text-amber-700 bg-amber-50' :
      role === 'sell' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
      role === 'retain' ? 'border-purple-200 text-purple-700 bg-purple-50' :
      'border-gray-200 text-gray-700 bg-gray-50'
    }`

  const handleBuildMobileApp = async () => {
    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      // User is not authenticated, show signin modal
      setShowSigninModal(true)
      return
    }

    if (!data) return

    // Store app spec data in sessionStorage for app-builder page
    sessionStorage.setItem('appCreationData', JSON.stringify({
      prompt: data.prompt,
      spec: data.spec,
      creating: true
    }))

    // Navigate immediately to app-builder page
    router.push('/app-builder?creating=true')
  }

  if (!data) return null
  const { spec } = data

  const cap = (s: string) => (s && s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s)

  const FeatureIcon = ({ name }: { name: string }) => {
    const key = (name || '').toLowerCase()
    const wrap = (cls: string, node: React.ReactElement) => (
      <div className={`h-12 w-28 rounded-xl flex items-center justify-center ${cls}`}>{node}</div>
    )

    // Search & Filter
    if (key.includes('search') || key.includes('filter') || key.includes('sort'))
      return wrap('bg-orange-50 text-orange-600', <Filter className="h-6 w-6" />)

    // Reviews & Ratings
    if (key.includes('review') || key.includes('rating') || key.includes('feedback'))
      return wrap('bg-yellow-50 text-yellow-600', <Star className="h-6 w-6" />)

    // Payment & Checkout
    if (key.includes('payment') || key.includes('checkout') || key.includes('pay') || key.includes('purchase'))
      return wrap('bg-green-50 text-green-600', <CreditCard className="h-6 w-6" />)

    // Shipping & Delivery
    if (key.includes('ship') || key.includes('delivery') || key.includes('track'))
      return wrap('bg-emerald-50 text-emerald-600', <Truck className="h-6 w-6" />)

    // Rewards & Loyalty
    if (key.includes('reward') || key.includes('loyalty') || key.includes('point') || key.includes('gift'))
      return wrap('bg-purple-50 text-purple-600', <Gift className="h-6 w-6" />)

    // Social Sharing
    if (key.includes('share') || key.includes('social'))
      return wrap('bg-sky-50 text-sky-600', <Share2 className="h-6 w-6" />)

    // Notifications & Alerts
    if (key.includes('notification') || key.includes('alert') || key.includes('push') || key.includes('bell'))
      return wrap('bg-orange-50 text-orange-600', <Bell className="h-6 w-6" />)

    // Analytics & Insights
    if (key.includes('analytic') || key.includes('insight') || key.includes('data') || key.includes('report'))
      return wrap('bg-indigo-50 text-indigo-600', <TrendingUp className="h-6 w-6" />)

    // Personalization & Recommendations
    if (key.includes('recommend') || key.includes('personalize') || key.includes('suggest') || key.includes('ai'))
      return wrap('bg-violet-50 text-violet-600', <Zap className="h-6 w-6" />)

    // Security & Authentication
    if (key.includes('security') || key.includes('secure') || key.includes('protect') || key.includes('auth'))
      return wrap('bg-red-50 text-red-600', <Shield className="h-6 w-6" />)

    // Chat & Support
    if (key.includes('chat') || key.includes('support') || key.includes('help') || key.includes('message'))
      return wrap('bg-teal-50 text-teal-600', <MessageCircle className="h-6 w-6" />)

    // Discounts & Coupons
    if (key.includes('discount') || key.includes('coupon') || key.includes('voucher') || key.includes('code') || key.includes('deal') || key.includes('promo'))
      return wrap('bg-amber-50 text-amber-600', <Percent className="h-6 w-6" />)

    // Returns & Refunds
    if (key.includes('return') || key.includes('refund') || key.includes('exchange'))
      return wrap('bg-pink-50 text-pink-600', <RefreshCw className="h-6 w-6" />)

    // Collections & Catalog
    if (key.includes('collection') || key.includes('catalog') || key.includes('curate') || key.includes('category') || key.includes('multi'))
      return wrap('bg-slate-50 text-slate-600', <Grid className="h-6 w-6" />)

    // Size Guides
    if (key.includes('size') || key.includes('guide') || key.includes('measure') || key.includes('fit'))
      return wrap('bg-cyan-50 text-cyan-600', <Ruler className="h-6 w-6" />)

    // Product Comparison
    if (key.includes('compare') || key.includes('comparison') || key.includes('versus'))
      return wrap('bg-lime-50 text-lime-700', <Scale className="h-6 w-6" />)

    // Quick View & Preview
    if (key.includes('preview') || key.includes('quick') || key.includes('peek'))
      return wrap('bg-fuchsia-50 text-fuchsia-600', <Eye className="h-6 w-6" />)

    // History & Recently Viewed
    if (key.includes('recent') || key.includes('history') || key.includes('viewed'))
      return wrap('bg-gray-50 text-gray-600', <Clock className="h-6 w-6" />)

    // Saved & Bookmarks
    if (key.includes('save') || key.includes('saved') || key.includes('bookmark') || key.includes('favorite'))
      return wrap('bg-rose-50 text-rose-600', <Bookmark className="h-6 w-6" />)

    // Wishlist (keep existing)
    if (key.includes('wishlist'))
      return wrap('bg-rose-50 text-rose-600', <Heart className="h-6 w-6" />)

    // Store Locator
    if (key.includes('location') || key.includes('store') || key.includes('finder') || key.includes('map'))
      return wrap('bg-emerald-50 text-emerald-600', <MapPin className="h-6 w-6" />)

    // Images & Hero (keep existing)
    if (key.includes('hero') || key.includes('image'))
      return wrap('bg-sky-50 text-sky-600', <ImageIcon className="h-6 w-6" />)

    // Brand (keep existing)
    if (key.includes('brand'))
      return wrap('bg-indigo-50 text-indigo-600', <Landmark className="h-6 w-6" />)

    // Try-on & Camera (keep existing)
    if (key.includes('tryon') || key.includes('camera'))
      return wrap('bg-fuchsia-50 text-fuchsia-600', <Camera className="h-6 w-6" />)

    // Booking (keep existing)
    if (key.includes('booking'))
      return wrap('bg-purple-50 text-purple-600', <CalendarCheck className="h-6 w-6" />)

    // Lookbook (keep existing)
    if (key.includes('lookbook') || key.includes('editorial'))
      return wrap('bg-slate-50 text-slate-600', <ClipboardList className="h-6 w-6" />)

    // Default
    return wrap('bg-orange-50 text-orange-600', <Sparkles className="h-6 w-6" />)
  }

  const PageIcon = ({ title, id }: { title: string; id: string }) => {
    const t = (title || id || '').toLowerCase()
    const wrap = (cls: string, node: React.ReactElement) => (
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cls}`}>{node}</div>
    )
    if (t.includes('home') || id === 'home') return wrap('bg-sky-50 text-sky-600', <HomeIcon className="h-6 w-6" />)
    if (t.includes('browse') || t.includes('catalog') || id === 'browse') return wrap('bg-amber-50 text-amber-600', <Search className="h-6 w-6" />)
    if (t.includes('product')) return wrap('bg-emerald-50 text-emerald-600', <ShoppingBag className="h-6 w-6" />)
    if (t.includes('wishlist')) return wrap('bg-rose-50 text-rose-600', <Heart className="h-6 w-6" />)
    if (t.includes('cart') || t.includes('checkout')) return wrap('bg-indigo-50 text-indigo-600', <ShoppingCart className="h-6 w-6" />)
    if (t.includes('order')) return wrap('bg-violet-50 text-violet-600', <Package className="h-6 w-6" />)
    if (t.includes('profile') || t.includes('account')) return wrap('bg-slate-50 text-slate-600', <User className="h-6 w-6" />)
    if (t.includes('deal')) return wrap('bg-lime-50 text-lime-700', <Tag className="h-6 w-6" />)
    return wrap('bg-gray-50 text-gray-600', <ClipboardList className="h-6 w-6" />)
  }

  const defaultThemeColors = {
    primary: '#4F46E5',
    secondary: '#10B981',
    accent: '#06B6D4',
    background: '#FFFFFF',
    text: '#1F2937'
  }

  const baseThemes = (spec.best?.suggestedThemes && spec.best.suggestedThemes.length > 0)
    ? spec.best.suggestedThemes
    : (spec.theme ? [spec.theme] : [])
  const availableThemes = [...baseThemes, ...darkThemes.filter((theme) => !baseThemes.some((t) => t.id === theme.id))]

  const chosenTheme = spec.theme || availableThemes[0]
  const selectedTheme = availableThemes.find((theme) => theme.id === selectedThemeId) || chosenTheme
  const themeColors = selectedTheme?.colors || chosenTheme?.colors || defaultThemeColors
  const themeSwatches = [
    themeColors.primary,
    themeColors.secondary,
    themeColors.accent,
    themeColors.background,
    themeColors.text,
  ]
  const isDarkTheme = selectedTheme?.isDark ?? (() => {
    const hex = (selectedTheme?.colors?.background || selectedTheme?.colors?.text || '#FFFFFF').replace('#', '')
    if (hex.length !== 6) return false
    const r = parseInt(hex.slice(0, 2), 16) / 255
    const g = parseInt(hex.slice(2, 4), 16) / 255
    const b = parseInt(hex.slice(4, 6), 16) / 255
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luminance < 0.45
  })()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation hideMenuItems={true} showGenerateNewApp={true} />
      <div className="mx-auto max-w-5xl px-4 pt-20 md:pt-28 lg:pt-24 pb-12 w-full flex-1">
        <header className="mb-6">
          <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="inline-flex w-max items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
              Your Mobile App
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <h1 className="m-0 text-4xl md:text-5xl font-extrabold text-gray-900">{spec.concept.appName}</h1>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.history.length > 1) {
                    router.back()
                  } else {
                    router.push('/')
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleBuildMobileApp}
                className="inline-flex h-11 w-max items-center justify-center gap-2 rounded-lg bg-green-600 px-5 text-base font-semibold text-white shadow hover:bg-green-700 transition-colors"
              >
                <Sparkles className="h-5 w-5" />
                Build Mobile App
              </button>
            </div>
          </div>
          <p className="mt-2 text-lg text-gray-700">{spec.concept.oneLiner}</p>
        {/* Wizard Steps (after primary subtitle) */}
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-center gap-4 sm:gap-6 mx-auto w-fit">
              {/* Step 1 - Completed */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-green-50 text-green-600 flex items-center justify-center ring-1 ring-green-200">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-medium text-green-600">Step 1</div>
                  <div className="text-sm font-semibold text-gray-900">Idea</div>
                </div>
              </div>
              {/* Connector */}
              <div className="h-0.5 w-14 bg-green-300 rounded-full hidden sm:block" />

              {/* Step 2 - Current */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white text-orange-600 flex items-center justify-center ring-2 ring-blue-600">
                  <span className="text-xs font-bold">2</span>
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-medium text-orange-600">Step 2</div>
                  <div className="text-sm font-extrabold text-gray-900">Mobile App Spec</div>
                </div>
              </div>
              {/* Connector */}
              <div className="h-0.5 w-14 bg-gray-200 rounded-full hidden sm:block" />

              {/* Step 3 - Upcoming */}
              <div className="flex items-center gap-3 opacity-70">
                <div className="h-9 w-9 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center ring-1 ring-gray-200">
                  <span className="text-xs font-bold">3</span>
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-medium text-gray-400">Step 3</div>
                  <div className="text-sm font-extrabold text-gray-500">Your App!</div>
                </div>
              </div>
            </div>
          </div>
        <div className="mb-8">
          <HomeAppCarousel />
        </div>

        <section className="mb-10">
  {(() => {
    const colorSwatches = [
      themeColors.primary,
      themeColors.secondary,
      themeColors.accent,
      themeColors.background,
      themeColors.text,
      '#F5F5F5',
      '#D1D5DB',
      '#9CA3AF'
    ]

    const menus = (
      spec.menuItems?.length
        ? spec.menuItems
        : ['Home', 'Browse', 'Product', 'Wishlist', 'Cart', 'Profile']
    ).slice(0, 6)

    const icons = ['home', 'search', 'shopping-bag', 'heart', 'shopping-cart', 'user']

    const iconNode = (key: string) => {
      switch (key) {
        case 'home': return <HomeIcon className="h-4 w-4" />
        case 'search': return <Search className="h-4 w-4" />
        case 'shopping-bag': return <ShoppingBag className="h-4 w-4" />
        case 'heart': return <Heart className="h-4 w-4" />
        case 'shopping-cart': return <ShoppingCart className="h-4 w-4" />
        case 'user': return <User className="h-4 w-4" />
        default: return <ClipboardList className="h-4 w-4" />
      }
    }

    return (
      <div
        className={`rounded-2xl border p-6 shadow-[0_30px_80px_rgba(15,23,42,0.04)] ${
          isDarkTheme
            ? 'border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
            : 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white'
        }`}
      >
        <div className="grid gap-6 md:grid-cols-3">

          {/* 🎨 Colors */}
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDarkTheme ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
            }`}
          >
            <div className={`mb-4 text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-slate-800'}`}>
              {selectedTheme?.displayName || spec.concept.appName || 'App Theme'}
            </div>

            <div className="grid grid-cols-4 gap-3">
              {colorSwatches.map((hex, i) => (
                <div
                  key={i}
                  className={`h-11 w-11 rounded-xl border shadow-sm transition hover:scale-105 ${
                    isDarkTheme ? 'border-slate-800' : 'border-slate-200'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={hex}
                />
              ))}
            </div>
          </div>

          {/* 🔤 Typography */}
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDarkTheme ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
            }`}
          >
            <div className={`mb-4 text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-slate-800'}`}>
              Typography
            </div>

            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold shadow-inner ${
                  isDarkTheme
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-slate-100'
                    : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-700'
                }`}
                style={{ fontFamily: spec.fonts?.heading || 'Inter' }}
              >
                Aa
              </div>

              <div>
                <div className={`text-sm font-medium ${isDarkTheme ? 'text-slate-100' : 'text-slate-700'}`}>
                  {spec.fonts?.heading || 'Inter'}
                </div>
                <div
                  className={`text-xs mt-1 ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}
                  style={{ fontFamily: spec.fonts?.body || 'Inter' }}
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </div>
            </div>
          </div>

          {/* 🧩 Icons + Menu */}
          <div
            className={`rounded-2xl border p-5 shadow-sm ${
              isDarkTheme ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
            }`}
          >
            <div className={`mb-4 text-sm font-semibold ${isDarkTheme ? 'text-slate-100' : 'text-slate-800'}`}>
              Navigation
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {icons.map((ic) => (
                <div
                  key={ic}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${
                    isDarkTheme
                      ? 'border-slate-800 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {iconNode(ic)}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {menus.map((m) => (
                <span
                  key={m}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isDarkTheme ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>
    )
  })()}
</section>


        
        <section className="mb-10">
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    
    {/* Theme Selector */}
    <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-5 shadow-sm hover:shadow-md transition">
      <div className="mb-3 text-sm font-semibold text-gray-900">
        🎨 App Color Theme
      </div>

              <div className="relative" ref={themeMenuRef}>
        <button
          type="button"
          onClick={() => setIsThemeMenuOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm transition hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        >
          <span className="font-medium">
            {selectedTheme?.displayName || "Default Theme"}
          </span>

          <div className="flex items-center gap-1.5">
            {(selectedTheme?.colors
              ? [
                  selectedTheme.colors.primary,
                  selectedTheme.colors.secondary,
                  selectedTheme.colors.accent,
                ]
              : themeSwatches.slice(0, 3)
            ).map((hex, index) => (
              <span
                key={index}
                className="h-4 w-4 rounded-full border border-gray-200"
                style={{ backgroundColor: hex }}
              />
            ))}
          </div>
        </button>

        {isThemeMenuOpen && (
          <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {availableThemes.length ? (
              availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setSelectedThemeId(theme.id)
                    setIsThemeMenuOpen(false)
                  }}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition"
                >
                  <span className="font-medium text-gray-800">
                    {theme.displayName}
                  </span>
                  <div className="flex gap-1.5">
                    {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map(
                      (hex, i) => (
                        <span
                          key={i}
                          className="h-4 w-4 rounded-full border"
                          style={{ backgroundColor: hex }}
                        />
                      )
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500">
                Default theme applied
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Font Selector */}
    <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-5 shadow-sm hover:shadow-md transition">
      <div className="mb-3 text-sm font-semibold text-gray-900">
        🔤 App Font
      </div>

      <select
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        defaultValue="poppins"
      >
        <option value="poppins">Poppins</option>
        <option value="inter">Inter</option>
        <option value="montserrat">Montserrat</option>
        <option value="source-sans">Source Sans 3</option>
      </select>
    </div>

    {/* Icon Selector */}
    <div className="rounded-2xl border border-gray-200 bg-white/70 backdrop-blur p-5 shadow-sm hover:shadow-md transition">
      <div className="mb-3 text-sm font-semibold text-gray-900">
        📱 App Icon
      </div>

      <select
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        defaultValue="leaf"
      >
        <option value="leaf">Leaf</option>
        <option value="cart">Cart</option>
        <option value="sparkle">Sparkle</option>
        <option value="badge">Badge</option>
      </select>
    </div>

  </div>
</section>

        </header>


        {/* Secondary Tagline (hero tagline) moved below visual spec */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-gray-800">{spec.concept.heroTagline}</p>
        </div>

        <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Key Features</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spec.explanation.keyFeatures.map((f, idx) => (
              <div key={idx} className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
                <FeatureIcon name={f.feature} />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{cap(f.feature)}</div>
                  <p className="mt-1 text-sm text-gray-600">{f.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Mobile App Pages</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {spec.explanation.pages.map((p) => (
              <div key={p.pageId} className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
                <PageIcon title={p.title} id={p.pageId} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{p.title}</div>
                    <span className={roleClass(p.role)}>{p.role}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{p.why}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Merchant Panel</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Product and catalog management</div>
                <p className="mt-1 text-sm text-gray-600">Manage your entire product catalog with ease</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <BadgePercent className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Pricing, discounts, and coupons</div>
                <p className="mt-1 text-sm text-gray-600">Create flexible pricing strategies and promotions</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Inventory tracking with low‑stock alerts</div>
                <p className="mt-1 text-sm text-gray-600">Monitor stock levels and receive alerts automatically</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Orders, fulfillment, and invoicing</div>
                <p className="mt-1 text-sm text-gray-600">Process orders and manage fulfillment workflows</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Returns and refunds management</div>
                <p className="mt-1 text-sm text-gray-600">Handle returns and process refunds efficiently</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Customer profiles and segmentation</div>
                <p className="mt-1 text-sm text-gray-600">Organize and segment your customer base</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-yellow-50 text-yellow-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Reviews and reputation management</div>
                <p className="mt-1 text-sm text-gray-600">Monitor and respond to customer reviews</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-sky-50 text-sky-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Sales analytics and KPI dashboards</div>
                <p className="mt-1 text-sm text-gray-600">Track performance with comprehensive analytics</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <UserCog className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Staff users and role‑based permissions</div>
                <p className="mt-1 text-sm text-gray-600">Manage team access with granular permissions</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Payments, settlements, and payout oversight</div>
                <p className="mt-1 text-sm text-gray-600">Monitor payment flows and settlement schedules</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Tax and shipping rules configuration</div>
                <p className="mt-1 text-sm text-gray-600">Set up complex tax and shipping logic</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-16 rounded-xl flex items-center justify-center bg-pink-50 text-pink-600">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Marketing assets and push campaigns</div>
                <p className="mt-1 text-sm text-gray-600">Design hero images, banners, and push notifications</p>
              </div>
            </div>
          </div>
        </section>

        
        {/* Meta footer removed per requirement (no Vertical/Confidence display) */}
      </div>

      {/* Signin Modal */}
      <SigninModal
        isOpen={showSigninModal}
        onClose={() => setShowSigninModal(false)}
        onSigninSuccess={() => {
          setShowSigninModal(false)
          router.push('/app-builder')
        }}
      />
    </div>
  )
}

export default function AppSpecPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-gray-600">Loading...</div></div>}>
      <AppSpecContent />
    </Suspense>
  )
}
