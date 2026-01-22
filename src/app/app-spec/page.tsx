'use client'
import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/layout'
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
import HomeAppCarousel from '@/components/HomeAppCarousel'

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
}

type AppSpec = {
  best: {
    verticalName: string
    confidence: number
    suggestedThemes?: SuggestedTheme[]
  }
  explanation: { keyFeatures: KeyFeature[]; pages: PageExpl[] }
  concept: { appName: string; oneLiner: string; heroTagline: string; homepageSections: string[]; recommendedPages: string[] }
  theme?: { id: string; displayName: string; colors: ThemeColors; usage?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string } }
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
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${cls}`}>{node}</div>
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
        </header>

        {/* Concept Canvas (static sample visual spec) */}
        <section className="mb-8">
          {(() => {
            // Get theme colors from API response, fallback to defaults
            const chosenTheme = spec.theme || spec.best?.suggestedThemes?.[0]
            const themeColors = chosenTheme?.colors || {
              primary: '#4F46E5',
              secondary: '#10B981',
              accent: '#06B6D4',
              background: '#FFFFFF',
              text: '#1F2937'
            }

            // Sample static visual spec for concept visualization
            const visualSpec = {
              palette: {
                primary: themeColors.primary,
                accent: themeColors.accent,
                neutrals: ['#F5F5F5', '#E5E7EB', '#D1D5DB', '#9CA3AF'],
                swatches: [
                  themeColors.primary,
                  themeColors.secondary,
                  themeColors.accent,
                  themeColors.background,
                  themeColors.text,
                  '#F5F5F5',
                  '#D1D5DB',
                  '#9CA3AF'
                ]
              },
              typography: {
                heading: { name: spec.fonts?.heading || 'Inter', sample: 'Aa' },
                body: { name: spec.fonts?.body || 'Inter', sample: 'The quick brown fox jumps over the lazy dog' },
              },
              screenshots: [
                { id: 's1', url: '/images/app1.png', alt: 'App Screen 1' },
                { id: 's2', url: '/images/app2.png', alt: 'App Screen 2' },
              ],
              menus: (spec.menuItems && spec.menuItems.length > 0 ? spec.menuItems : ['Home','Browse','Product','Wishlist','Cart','Orders','Profile']).slice(0,7),
              icons: ['home','search','shopping-bag','heart','shopping-cart','package','user'],
            } as const

            const iconNode = (key: string) => {
              switch (key) {
                case 'home': return <HomeIcon className="h-4 w-4" />
                case 'search': return <Search className="h-4 w-4" />
                case 'shopping-bag': return <ShoppingBag className="h-4 w-4" />
                case 'heart': return <Heart className="h-4 w-4" />
                case 'shopping-cart': return <ShoppingCart className="h-4 w-4" />
                case 'package': return <Package className="h-4 w-4" />
                case 'user': return <User className="h-4 w-4" />
                default: return <ClipboardList className="h-4 w-4" />
              }
            }

            return (
              <div className="relative overflow-hidden rounded-2xl bg-[#8C8C8C] text-white shadow-lg px-4 sm:px-6 py-6 min-h-[420px]">

                {/* Left mid: Theme palette */}
                <div className="absolute left-6 top-28">
                  <div className="text-xs font-semibold opacity-90 mb-2">{chosenTheme?.displayName || 'Product Catalog'}</div>
                  <div className="grid grid-cols-4 gap-2">
                    {visualSpec.palette.swatches.slice(0,8).map((hex, i) => (
                      <div key={i} className="h-10 w-10 rounded-lg border border-white/10 shadow-inner" style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                </div>

                {/* Left top: secondary screenshot (left device) */}
                <div className="absolute left-56 top-6 drop-shadow-xl">
                  <div className="rounded-[22px] bg-white/5 border border-white/10 h-80 w-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visualSpec.screenshots[1].url}
                      alt={visualSpec.screenshots[1].alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e:any)=>{e.currentTarget.src='https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=400&auto=format&fit=crop'}}
                    />
                  </div>
                </div>

                {/* Right device near center */}
                <div className="absolute left-1/2 -translate-x-12 top-6 drop-shadow-xl">
                  <div className="rounded-[22px] bg-white/5 border border-white/10 h-80 w-44 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={visualSpec.screenshots[0].url}
                      alt={visualSpec.screenshots[0].alt}
                      className="h-full w-full object-cover"
                      loading="lazy"
                      onError={(e:any)=>{e.currentTarget.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400&auto=format&fit=crop'}}
                    />
                  </div>
                </div>

                {/* Bottom-left: Typography */}
                <div className="absolute left-6 bottom-10 max-w-xs">
                  <div className="text-sm font-semibold opacity-90 mb-2">Typography</div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-lg font-bold" style={{ fontFamily: visualSpec.typography.heading.name + ', system-ui, sans-serif' }}>{visualSpec.typography.heading.sample}</div>
                    <div className="text-xs opacity-80">{visualSpec.typography.heading.name}</div>
                  </div>
                  <div className="mt-3 text-[11px] opacity-90 leading-snug" style={{ fontFamily: visualSpec.typography.body.name + ', system-ui, sans-serif' }}>{visualSpec.typography.body.sample}</div>
                </div>

                {/* Right side: Menus + Icons */}
                <div className="absolute right-[25px] top-24 max-w-[320px]">
                  <div className="text-sm font-semibold opacity-90 mb-2">Menus</div>
                  <div className="flex flex-wrap gap-2 gap-y-2 mb-3 justify-start">
                    {visualSpec.menus.map((m, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[11px] opacity-90">{m}</span>
                    ))}
                  </div>
                  <div className="text-sm font-semibold opacity-90 mb-2 text-left">Icons</div>
                  <div className="flex flex-wrap gap-2 justify-start max-w-[320px]">
                    {visualSpec.icons.map((ic, i) => (
                      <span key={i} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white/90">
                        {iconNode(ic)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}
        </section>

        {/* Secondary Tagline (hero tagline) moved below visual spec */}
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
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
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Product and catalog management</div>
                <p className="mt-1 text-sm text-gray-600">Manage your entire product catalog with ease</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <BadgePercent className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Pricing, discounts, and coupons</div>
                <p className="mt-1 text-sm text-gray-600">Create flexible pricing strategies and promotions</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Inventory tracking with low‑stock alerts</div>
                <p className="mt-1 text-sm text-gray-600">Monitor stock levels and receive alerts automatically</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Orders, fulfillment, and invoicing</div>
                <p className="mt-1 text-sm text-gray-600">Process orders and manage fulfillment workflows</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-orange-50 text-orange-600">
                <RotateCcw className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Returns and refunds management</div>
                <p className="mt-1 text-sm text-gray-600">Handle returns and process refunds efficiently</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Customer profiles and segmentation</div>
                <p className="mt-1 text-sm text-gray-600">Organize and segment your customer base</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-yellow-50 text-yellow-600">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Reviews and reputation management</div>
                <p className="mt-1 text-sm text-gray-600">Monitor and respond to customer reviews</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-sky-50 text-sky-600">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Sales analytics and KPI dashboards</div>
                <p className="mt-1 text-sm text-gray-600">Track performance with comprehensive analytics</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                <UserCog className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Staff users and role‑based permissions</div>
                <p className="mt-1 text-sm text-gray-600">Manage team access with granular permissions</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-green-50 text-green-600">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Payments, settlements, and payout oversight</div>
                <p className="mt-1 text-sm text-gray-600">Monitor payment flows and settlement schedules</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600">
                <Calculator className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Tax and shipping rules configuration</div>
                <p className="mt-1 text-sm text-gray-600">Set up complex tax and shipping logic</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 flex gap-3 items-start">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-pink-50 text-pink-600">
                <Megaphone className="h-6 w-6" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Marketing assets and push campaigns</div>
                <p className="mt-1 text-sm text-gray-600">Design hero images, banners, and push notifications</p>
              </div>
            </div>
          </div>
        </section>

        {/* Suggested Themes Section */}
        {spec.best?.suggestedThemes && spec.best.suggestedThemes.length > 0 && (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Suggested Themes</h3>
            <p className="mb-6 text-sm text-gray-600">
              Based on your app concept, we recommend these professionally designed themes
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {spec.best.suggestedThemes.map((theme) => (
                <div
                  key={theme.id}
                  className="rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  {/* Theme Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {theme.icon && (
                        <div className="text-2xl">{theme.icon}</div>
                      )}
                      <div>
                        <div className="text-base font-semibold text-gray-900">
                          {theme.displayName}
                        </div>
                        {theme.category && (
                          <span className="inline-block mt-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            {theme.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Color Palette Grid */}
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500 mb-2">Color Palette</div>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="space-y-1">
                        <div
                          className="h-12 w-full rounded-lg border border-gray-200 shadow-sm"
                          style={{ backgroundColor: theme.colors.primary }}
                          title={`Primary: ${theme.colors.primary}`}
                        />
                        <div className="text-[10px] text-gray-500 text-center">Primary</div>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-12 w-full rounded-lg border border-gray-200 shadow-sm"
                          style={{ backgroundColor: theme.colors.secondary }}
                          title={`Secondary: ${theme.colors.secondary}`}
                        />
                        <div className="text-[10px] text-gray-500 text-center">Secondary</div>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-12 w-full rounded-lg border border-gray-200 shadow-sm"
                          style={{ backgroundColor: theme.colors.accent }}
                          title={`Accent: ${theme.colors.accent}`}
                        />
                        <div className="text-[10px] text-gray-500 text-center">Accent</div>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-12 w-full rounded-lg border border-gray-200 shadow-sm"
                          style={{ backgroundColor: theme.colors.background }}
                          title={`Background: ${theme.colors.background}`}
                        />
                        <div className="text-[10px] text-gray-500 text-center">BG</div>
                      </div>
                      <div className="space-y-1">
                        <div
                          className="h-12 w-full rounded-lg border border-gray-200 shadow-sm"
                          style={{ backgroundColor: theme.colors.text }}
                          title={`Text: ${theme.colors.text}`}
                        />
                        <div className="text-[10px] text-gray-500 text-center">Text</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

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
    <HomeAppCarousel/>
    </Suspense>
  )
}
