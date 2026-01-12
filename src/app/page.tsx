'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import {
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  ShieldCheck,
  Sparkles,
  LayoutTemplate,
  Database,
  Clock4,
  Shield,
  Headphones,
  Package2,
  Image as ImageIcon,
  CreditCard,
  ClipboardList,
  Paintbrush,
  Upload,
  Bell,
  Server,
  Check,
  Users,
  Store,
  Download,
  Palette,
  Rocket,
  Star,
  Play,
  Utensils,
  Heart,
  BookOpen,
  Dumbbell,
  Infinity,
  Eye,
  Zap,
  LayoutDashboard,
  Plug,
  UserCircle2,
  LogOut,
  Loader2,
} from 'lucide-react'
import { Navigation, Footer } from '@/components/layout'
import { SigninModal, VideoModal } from '@/components/modals'
import { isOwnerAuthenticated, clearAllAuthData } from '@/lib/auth-utils'
import { apiService } from '@/lib/api-service'

// Dynamic imports for below-the-fold components (code splitting)
const HomeAppBuilder = dynamic(() => import('@/components/HomeAppBuilder'), {
  loading: () => (
    <aside className="flex justify-end" aria-label="App builder form">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#fff8f1] to-white shadow-[0_20px_60px_rgba(251,146,60,0.3)] border-2 border-orange-200 p-6 min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    </aside>
  ),
  ssr: true,
})

const PricingSection = dynamic(() => import('@/components/PricingSection'), {
  loading: () => (
    <section className="bg-white py-16" aria-labelledby="pricing-heading">
      <div className="mx-auto max-w-6xl px-4 md:px-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    </section>
  ),
  ssr: true,
})

const stats = [
  { label: 'Active Users', value: '1M+' },
  { label: 'Apps Created', value: '500+' },
  { label: 'App Downloads', value: '400K+' },
  { label: 'Customer Rating', value: '4.9/5' },
]

const whyPoints = [
  { title: 'Production Ready Apps', desc: 'Mobelo builds production-ready mobile apps you can launch instantly.', icon: Sparkles },
  { title: 'No Token Limits!', desc: 'Build without restrictions, unlike platforms that cap usage and tokens.', icon: Infinity },
  { title: 'Full App Preview', desc: 'Mobelo builds a fully functional app from one prompt, ready to preview instantly.', icon: Eye },
  { title: 'Premium AI Models', desc: 'Built using premium OpenAI and Anthropic models, including GPT-5.2 and Claude Sonnet 4.2.', icon: Zap },
  { title: 'Merchant Panel Access', desc: 'Fully functional enterprise-grade merchant panel to manage your entire commerce platform.', icon: LayoutDashboard },
  { title: 'Premium Support', desc: 'We\'ll help you ship and iterate quickly with live support when you need it.', icon: Headphones },
]

const launchFeatures = [
  { title: 'Premium Look & Feel', desc: 'Launch beautifully designed mobile apps with polished UI, smooth flows, and brand-ready visuals.', icon: Sparkles },
  { title: 'Product & Stock Management', desc: 'Easily manage products, variants, pricing, and real-time inventory from one powerful dashboard.', icon: Package2 },
  { title: 'Payments & Invoices', desc: 'Accept secure payments, manage taxes, and generate invoices with built-in checkout integrations.', icon: CreditCard },
  { title: 'Roles and Permissions', desc: 'Control access with role-based permissions for admins, staff, and operators across your platform.', icon: ShieldCheck },
  { title: 'Integrations', desc: 'Connect seamlessly with third-party tools, APIs, and services to extend your app\'s capabilities.', icon: Plug },
  { title: 'Fully Managed Service', desc: 'We handle deployments, updates, and maintenance so you can focus on growing your business.', icon: Server },
]

const steps = [
  { title: 'Build Your Store', desc: 'Generate a complete, production-ready fully functional mobile commerce app from a single prompt.', icon: Sparkles },
  { title: 'Customize Your App', desc: 'Customize your app using simple prompts, powered by Claude Code for fast, intelligent generation.', icon: Paintbrush },
  { title: 'Launch & Manage', desc: 'Export your app code, publish to app stores, and manage everything from your powerful merchant dashboard.', icon: Rocket },
]

const templates = [
  { name: 'Fashion & Apparel', color: 'from-[#ec4899] to-[#f472b6]', icon: 'ShoppingBag', desc: 'Trendy clothing stores with size guides, style recommendations, and seasonal collections.', image: '/images/mockups/pink.png' },
  { name: 'Food & Grocery', color: 'from-[#10b981] to-[#34d399]', icon: 'Utensils', desc: 'Organic groceries, meal kits, and specialty food stores with recipe integration.', image: '/images/mockups/green.png' },
  { name: 'Health & Beauty', color: 'from-[#8b5cf6] to-[#a78bfa]', icon: 'Heart', desc: 'Cosmetics, skincare, and wellness products with ingredient lists and tutorials.', image: '/images/mockups/purple.png' },
  { name: 'Books & Media', color: 'from-[#3b82f6] to-[#60a5fa]', icon: 'BookOpen', desc: 'Digital and physical books, courses, and educational content platforms.', image: '/images/mockups/blue.png' },
  { name: 'Sports & Fitness', color: 'from-[#f97316] to-[#fb923c]', icon: 'Dumbbell', desc: 'Athletic wear, equipment, and fitness accessories with workout guides.', image: '/images/mockups/orange.png' },
  { name: 'General Retail', color: 'from-[#64748b] to-[#94a3b8]', icon: 'Package2', desc: 'Electronics, home goods, crafts, and everything else you can imagine selling.', image: '/images/mockups/gray.png' },
]

const techBlocks = [
  { title: 'Native Performance', desc: 'Built with React Native technology for fast load times, smooth animations, and responsive user interactions.', icon: Zap },
  { title: 'GDPR Compliant', desc: 'Designed with data privacy in mind, including secure authentication, consent handling, and compliant data storage.', icon: ShieldCheck },
  { title: 'Scalable', desc: 'Architected to handle growth effortlessly, from first users to high traffic and transaction volumes.', icon: Rocket },
  { title: 'Security', desc: 'Enterprise-grade security practices to protect user data, transactions, and platform operations end to end.', icon: Shield },
  { title: 'Maintenance', desc: 'Continuous updates, monitoring, and improvements to keep your app reliable and up to date.', icon: Clock4 },
  { title: 'Premium Support', desc: 'Priority support from experienced engineers to help you launch, scale, and operate with confidence.', icon: Headphones },
]


const testimonials = [
  {
    name: 'Alex Morgan',
    title: 'Dropshipper, TrendyFinds',
    avatar: 'https://i.pravatar.cc/150?img=12',
    quote:
      'Started my dropshipping business with Mobelo and scaled to $50K monthly revenue in 6 months. The automated order processing and supplier integration made it seamless. Best decision for my business.',
  },
  {
    name: 'Jessica Martinez',
    title: 'Founder, ChicBoutique',
    avatar: 'https://i.pravatar.cc/150?img=47',
    quote:
      'Moved from my web shop to a mobile app with Mobelo. My sales tripled within 2 months! Mobile customers are more engaged and conversion rates are through the roof.',
  },
  {
    name: 'Michael Chen',
    title: 'CEO, SoleStyle Footwear',
    avatar: 'https://i.pravatar.cc/150?img=33',
    quote:
      'Owning my customer data changed everything. I turned my shoe business into a reselling platform where other retailers can sell through my network. Revenue skyrocketed to $200K annually.',
  },
  {
    name: 'Sarah Johnson',
    title: 'Entrepreneur, QuickLaunch Store',
    avatar: 'https://i.pravatar.cc/150?img=45',
    quote:
      'No need to worry about paying per API token or usage fees. I kept building, testing, and iterating without fear of unexpected costs. Launched 3 different app versions until I found the perfect fit.',
  },
  {
    name: 'David Thompson',
    title: 'Owner, FastShip Express',
    avatar: 'https://i.pravatar.cc/150?img=15',
    quote:
      'My dropshipping empire runs on Mobelo. From product sourcing to customer delivery, everything is automated. Made $120K in my first year and still growing.',
  },
  {
    name: 'Rachel Kim',
    title: 'Founder, GlowBeauty Cosmetics',
    avatar: 'https://i.pravatar.cc/150?img=44',
    quote:
      'Transitioned from web to mobile and gained complete ownership of my customer relationships. My cosmetics line reaches thousands through direct mobile sales.',
  },
]

const faqs = [
  { q: 'How long does it take to launch?', a: 'Mobelo generates your complete mobile app in 4-8 minutes. You can refine it using simple prompts and publish with a few clicks. App Store and Play Store approvals may take a few days and are subject to their review processes, which are outside Mobelo\'s control.' },
  { q: 'Do I need design or coding skills?', a: 'No design or coding skills are required. Mobelo uses premium layouts, follows industry standards, and builds fully functional features, so you can launch without any technical expertise.' },
  { q: 'Can I publish to both iOS and Android?', a: 'Yes. You can publish your app to both iOS and Android, and book a support session with our team for hands-on assistance if needed.' },
  { q: 'Can I use my own products and content?', a: 'Yes. You have full control over your app\'s products and content. Manage products, orders, inventory, and more through the merchant panel.' },
  { q: 'Are there any hidden or upfront costs?', a: 'No. There are no hidden or upfront costs. You only pay a monthly fee plus a sales-based commission, ranging from 0.4% to a maximum of 1%, depending on your plan.' },
]

const moreFaqs = [
  { q: 'Who owns the app and source code?', a: 'You own your mobile app and its source code. You can export the full source code at any time.' },
  { q: 'Is the app production-ready or just a demo?', a: 'Mobelo builds fully production-ready mobile apps designed for real users, real traffic, and real transactions.' },
  { q: 'Can I customize the design and features later?', a: 'Yes. You can customize layouts, styles, colors, and features at any time using simple prompts or the merchant panel.' },
  { q: 'What happens if I cancel my subscription?', a: 'You can cancel at any time. Your app will stop receiving updates and managed services, but your data and source code remain yours.' },
  { q: 'Does Mobelo handle hosting and infrastructure?', a: 'Yes. Mobelo provides fully managed infrastructure, including hosting, updates, monitoring, and maintenance.' },
  { q: 'Can Mobelo handle high traffic and large order volumes?', a: 'Yes. Mobelo is built on scalable infrastructure designed to handle growth from launch to high transaction volumes.' },
  { q: 'Is Mobelo secure?', a: 'Yes. Mobelo follows enterprise-grade security best practices to protect user data, payments, and platform operations.' },
  { q: 'Is Mobelo GDPR compliant?', a: 'Yes. Mobelo is designed with GDPR compliance in mind, including data handling and privacy controls.' },
  { q: 'Do you provide onboarding or launch support?', a: 'Yes. We offer guided onboarding and 1-on-1 app launch support depending on your plan.' },
  { q: 'What kind of support do you offer?', a: 'Mobelo offers email and chat support, with priority and dedicated support available on higher plans.' },
]

export default function HomePage() {
  const [showSigninModal, setShowSigninModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [trialEmail, setTrialEmail] = useState('')
  const [signinInitialEmail, setSigninInitialEmail] = useState('')
  const [showMoreFaqs, setShowMoreFaqs] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    // Check if user is authenticated
    const authenticated = isOwnerAuthenticated()
    setIsLoggedIn(authenticated)

    if (authenticated) {
      // Get user email from localStorage
      const user = localStorage.getItem('user')
      if (user) {
        try {
          const userData = JSON.parse(user)
          setUserEmail(userData.email || '')
        } catch (e) {
          console.error('Error parsing user data:', e)
        }
      }
    }
  }, [])

  const handleContinueWithEmail = () => {
    setSigninInitialEmail(trialEmail)
    setShowSigninModal(true)
    // Scroll to top to make modal visible
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleLoginAsDifferentUser = () => {
    clearAllAuthData()
    setIsLoggedIn(false)
    setUserEmail('')
    setShowSigninModal(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleContinueWithGoogle = async () => {
    try {
      // Scroll to top first
      window.scrollTo({ top: 0, behavior: 'smooth' })

      const state = Math.random().toString(36).slice(2) + Date.now().toString(36)
      try { sessionStorage.setItem('oauth_state', state) } catch {}

      const redirectUri = `https://mobelo.dev/api/auth/callback/google`

      const resp = await apiService.getGoogleAuthInit(redirectUri, state)
      if (!resp.ok || !resp.data?.url) {
        console.error('Google auth init failed:', { status: resp.status, data: resp.data })
        return
      }

      const url = resp.data.url as string
      const popup = window.open(url, 'google-oauth', 'width=500,height=600')
      if (!popup) {
        alert('Popup blocked. Please allow popups and try again.')
        return
      }

      const messageHandler = (event: MessageEvent) => {
        try {
          if (event.origin !== window.location.origin) return
          const data: any = event.data || {}
          if (!data || typeof data !== 'object') return
          if (data.ok === false) {
            console.error('Google sign-in failed:', data.error)
            window.removeEventListener('message', messageHandler)
            return
          }
          if (data.ok === true && data.data) {
            const res = data.data
            if (res.access_token) localStorage.setItem('access_token', res.access_token)
            if (res.refresh_token) localStorage.setItem('refresh_token', res.refresh_token)
            if (res.user) localStorage.setItem('user', JSON.stringify(res.user))

            // Clear any staff session
            clearAllAuthData()

            window.removeEventListener('message', messageHandler)

            // Update logged in state
            setIsLoggedIn(true)
            setUserEmail(res.user?.email || '')

            // Redirect to dashboard
            window.location.href = '/dashboard'
          }
        } catch (e) {
          // ignore
        }
      }

      window.addEventListener('message', messageHandler)
    } catch (err) {
      console.error('Google signin error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900">
      {/* Structured Data - FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a
              }
            }))
          })
        }}
      />

      {/* Structured Data - Reviews/Testimonials */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'Mobelo Mobile App Builder',
            description: 'AI-powered mobile app builder for e-commerce',
            brand: {
              '@type': 'Brand',
              name: 'Mobelo'
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: testimonials.length,
              bestRating: '5',
              worstRating: '1'
            },
            review: testimonials.map(t => ({
              '@type': 'Review',
              author: {
                '@type': 'Person',
                name: t.name
              },
              reviewRating: {
                '@type': 'Rating',
                ratingValue: '5',
                bestRating: '5'
              },
              reviewBody: t.quote,
              publisher: {
                '@type': 'Organization',
                name: 'Mobelo'
              }
            }))
          })
        }}
      />

      <Navigation />

      <main className="flex-1">
        {/* Hero - responsive padding and grid */}
        <section className="relative bg-gradient-to-b from-orange-50 via-white to-amber-50 min-h-screen flex items-center py-12 md:py-16 lg:py-20 pt-20 md:pt-24" aria-label="Hero section">
          <div className="absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-6xl px-4 md:px-6 w-full grid gap-8 md:gap-12 lg:grid-cols-2 items-center">
            <article className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white via-[#fff4e8] to-white px-4 py-2 shadow-sm text-sm font-semibold text-orange-600 border-2 border-transparent bg-clip-padding" style={{ backgroundImage: 'linear-gradient(white, white), linear-gradient(to right, #fb923c, #fdba74)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }}>
                <Sparkles className="w-4 h-4 text-orange-600" aria-hidden="true" />
                <span className="font-bold">AI-Powered Platform</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-extrabold leading-tight text-slate-900">
                Build Your Mobile App,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500">
                  in Minutes
                </span>
              </h1>
              <p className="text-base md:text-lg text-slate-600">
                Create professional iOS and Android shopping apps with AI-powered design, integrated Stripe payments, and a complete merchant dashboard. No coding required.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowSigninModal(true)}
                  className="rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3 text-white font-semibold shadow-[0_10px_20px_rgba(251,146,60,0.25)] hover:from-orange-700 hover:to-orange-600 transition flex items-center gap-2"
                  aria-label="Start building your mobile app for free"
                >
                  Start Building Free
                  <span className="text-lg" aria-hidden="true">→</span>
                </button>
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="rounded-xl bg-white px-6 py-3 text-slate-800 font-semibold border border-slate-200 shadow-[0_10px_20px_rgba(0,0,0,0.05)] hover:border-orange-200 hover:text-orange-600 transition flex items-center gap-2"
                  aria-label="Watch demo video"
                >
                  <Play className="w-4 h-4" aria-hidden="true" />
                  Watch Demo
                </button>
              </div>
              <div className="pt-6">
                <div className="h-px bg-gradient-to-r from-transparent via-orange-100 to-transparent mb-6" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-orange-500" aria-hidden="true">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Integrated Merchant Panel</div>
                      <div className="text-slate-600 text-xs">Full control</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-orange-500" aria-hidden="true">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">iOS & Android</div>
                      <div className="text-slate-600 text-xs">Both platforms</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-orange-500" aria-hidden="true">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">Fully Managed Service</div>
                      <div className="text-slate-600 text-xs">Hassle-free</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <HomeAppBuilder />
          </div>
        </section>

        {/* Stats - responsive grid */}
        <section className="bg-white py-8 md:py-12 border-t border-b border-slate-100" aria-label="Platform statistics">
          <div className="mx-auto max-w-6xl px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
            {stats.map((item, idx) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-orange-50 text-orange-500" aria-hidden="true">
                  {idx === 0 && <Users className="w-5 h-5" />}
                  {idx === 1 && <Store className="w-5 h-5" />}
                  {idx === 2 && <Download className="w-5 h-5" />}
                  {idx === 3 && <Star className="w-5 h-5" />}
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-slate-900">{item.value}</div>
                <div className="text-xs md:text-sm text-slate-600 mt-[-6px]">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose */}
        <section id="features" className="bg-white min-h-screen flex items-center py-12 md:py-16" aria-labelledby="features-heading">
          <div className="mx-auto max-w-6xl px-4 md:px-6 w-full">
            <div className="text-center space-y-3 mb-10">
              <h2 id="features-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">Why Choose Mobelo?</h2>
              <p className="text-slate-600">AI-driven mobile apps, launch-ready builds, and an enterprise-grade merchant panel.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {whyPoints.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="rounded-2xl border border-slate-100 bg-white p-5">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3" aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Launch Features */}
        <section className="bg-slate-50 min-h-screen flex items-center py-12 md:py-16" aria-labelledby="launch-features-heading">
          <div className="mx-auto max-w-6xl px-4 md:px-6 w-full">
            <div className="text-center space-y-3 mb-10">
              <h2 id="launch-features-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">Everything You Need to Launch</h2>
              <p className="text-slate-600">Everything you need to build, launch, manage, and scale a production-ready mobile commerce app.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {launchFeatures.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center mb-3" aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section id="how-it-works" className="bg-white py-12 md:py-16 lg:py-20" aria-labelledby="how-it-works-heading">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="space-y-3 mb-16 text-center">
              <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">Three Simple Steps</h2>
              <p className="text-slate-600">Go live quickly without compromising on quality.</p>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
              {steps.map((step, idx) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="relative flex">
                    {/* Connecting line - only show between cards */}
                    {idx < steps.length - 1 && (
                      <div className="hidden md:block absolute top-20 left-[calc(50%+2rem)] w-[calc(100%+2rem)] h-0.5 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 z-0"></div>
                    )}

                    <div className="relative rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm hover:shadow-lg transition-shadow w-full flex flex-col">
                      {/* Number badge */}
                      <div className="absolute -top-4 left-8 flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 border-2 border-orange-200 text-orange-600 font-bold text-sm">
                        {idx + 1}
                      </div>

                      {/* Icon */}
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30" aria-hidden="true">
                        <Icon className="w-10 h-10" />
                      </div>

                      {/* Content */}
                      <div className="text-center flex-1 flex flex-col">
                        <h3 className="font-bold text-xl text-slate-900 mb-3">{step.title}</h3>
                        <p className="text-slate-600 leading-relaxed flex-1">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTA Button */}
            <div className="mt-12 text-center">
              <button className="rounded-[14px] border border-orange-500 bg-orange-500 px-8 py-4 text-base font-semibold text-white shadow-md hover:bg-white hover:text-slate-900 hover:border-slate-200 transition-all duration-200">
                Schedule a Demo
              </button>
            </div>
          </div>
        </section>


      {/* Templates */}
        <section className="bg-gradient-to-b from-slate-50 via-white to-slate-50 py-16 md:py-20" aria-labelledby="templates-heading">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="text-center space-y-4 mb-16">
              
              <h2 id="templates-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">
                Built for Every Type of Store
              </h2>
              <p className="text-slate-600">
                Whether you're selling fashion, food, or anything in between, Mobelo has templates and features tailored to your industry.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((tpl, idx) => {
                // Map string icon names to components
                const iconMap: { [key: string]: any } = {
                  ShoppingBag,
                  Package2,
                  Utensils,
                  Heart,
                  BookOpen,
                  Dumbbell,
                }
                const Icon = typeof tpl.icon === 'string' && iconMap[tpl.icon] ? iconMap[tpl.icon] : null
                const isEmoji = typeof tpl.icon === 'string' && !iconMap[tpl.icon]

                return (
                  <div 
                    key={tpl.name} 
                    className="group relative rounded-3xl bg-white border-2 border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    style={{
                      ['--hover-color' as any]: tpl.color
                    }}
                  >
                    {/* Gradient accent line that changes on hover */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tpl.color}`}></div>
                    
                    {/* Phone mockup */}
         <div 
  className="relative h-[400px] overflow-visible bg-slate-50 flex items-center justify-center p-6 transition-all duration-300 group"
  style={{ background: 'rgb(248 250 252)' }}
  onMouseEnter={(e) => {
    const colorMap: { [key: string]: string } = {
      'from-[#ec4899] to-[#f472b6]': 'linear-gradient(135deg, rgba(236, 72, 153, 0.08), rgba(244, 114, 182, 0.08))',
      'from-[#10b981] to-[#34d399]': 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(52, 211, 153, 0.08))',
      'from-[#8b5cf6] to-[#a78bfa]': 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(167, 139, 250, 0.08))',
      'from-[#3b82f6] to-[#60a5fa]': 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(96, 165, 250, 0.08))',
      'from-[#f97316] to-[#fb923c]': 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(251, 146, 60, 0.08))',
      'from-[#64748b] to-[#94a3b8]': 'linear-gradient(135deg, rgba(100, 116, 139, 0.08), rgba(148, 163, 184, 0.08))',
    }
    e.currentTarget.style.background = colorMap[tpl.color] || 'rgb(248 250 252)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = 'rgb(248 250 252)'
  }}
>
  {/* iPhone 16 Pro Frame */}
  <div className="relative aspect-[9/19.5] h-full max-h-[380px] w-auto bg-[#080808] p-[1.2%] shadow-2xl flex flex-col ring-1 ring-black/50 transform group-hover:scale-105 transition-transform duration-300"
       style={{ borderRadius: '18% / 8.5%' }}>
    
    {/* Physical Buttons */}
    <div className="absolute -left-[1.5px] top-[18%] w-[2px] h-[6%] bg-[#1a1a1a] rounded-l-sm"></div>
    <div className="absolute -left-[1.5px] top-[26%] w-[2px] h-[12%] bg-[#1a1a1a] rounded-l-sm"></div>
    <div className="absolute -left-[1.5px] top-[40%] w-[2px] h-[12%] bg-[#1a1a1a] rounded-l-sm"></div>
    <div className="absolute -right-[1.5px] top-[32%] w-[2px] h-[18%] bg-[#1a1a1a] rounded-r-sm"></div>

    {/* Screen Container */}
    <div className="relative w-full h-full bg-white overflow-hidden flex flex-col shadow-inner ring-1 ring-inset ring-black/5"
         style={{ borderRadius: '16.5% / 7.8%' }}>
      
      {/* 1. REDUCED Top Spacer (Controls the height under the island) */}
      <div className="h-[5%] w-full flex-shrink-0 bg-white z-20"></div>

      {/* 2. Dynamic Island - Moved slightly up to save space */}
      <div className="absolute top-[2.2%] left-1/2 -translate-x-1/2 w-[28%] h-[3%] bg-black rounded-full z-50 flex items-center justify-end px-[1.5%]">
          <div className="w-[12%] aspect-square rounded-full bg-[#1a1a2e]"></div>
      </div>

      {/* 3. Content Area - Stretches to show full image including bottom tabs */}
      <div className="flex-1 w-full relative bg-white overflow-hidden"> 
        {tpl.image && (
          <img
            src={tpl.image}
            alt={`${tpl.name} mockup`}
            className="w-full h-full object-fill" 
            style={{ display: 'block' }}
          />
        )}
      </div>

      {/* 4. Home Bar Area */}
      <div className="h-[4%] w-full flex items-center justify-center flex-shrink-0 bg-white">
        <div className="w-[32%] h-[2.5px] bg-black/15 rounded-full"></div>
      </div>
    </div>
  </div>

  {/* Floating icon badge */}
  <div className={`absolute top-6 right-8 w-14 h-14 rounded-2xl bg-gradient-to-br ${tpl.color} flex items-center justify-center text-white shadow-lg z-40 group-hover:scale-110 transition-transform`}>
    {Icon ? <Icon className="w-7 h-7" /> : isEmoji ? <span className="text-2xl">{tpl.icon}</span> : null}
  </div>
</div>
                    
                    {/* Content */}
                    <div className="p-6 space-y-3">
                      <h3 className="text-xl font-bold text-slate-900 transition-colors">{tpl.name}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{tpl.desc}</p>
                      
                      {/* Learn more link */}
                      <div className="pt-2">
                        <button className={`text-sm font-semibold flex items-center gap-1 group/btn transition-colors`}
                                style={{
                                  color: tpl.color.includes('ec4899') ? '#ec4899' :
                                         tpl.color.includes('10b981') ? '#10b981' :
                                         tpl.color.includes('8b5cf6') ? '#8b5cf6' :
                                         tpl.color.includes('3b82f6') ? '#3b82f6' :
                                         tpl.color.includes('f97316') ? '#f97316' :
                                         '#64748b'
                                }}>
                          <span>Explore Template</span>
                          <span className="transform group-hover/btn:translate-x-1 transition-transform">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            
            <div className="mt-12 text-center">
              <p className="text-slate-600 mb-4">Don't see your niche? Mobelo instantly generates custom code, design, styles, and colors tailored to your needs.</p>
            </div>
          </div>
        </section>

        {/* Tech */}
        <section className="bg-slate-900 py-12 md:py-16 text-white" aria-labelledby="technology-heading">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="text-center space-y-3 mb-10">
              <h2 id="technology-heading" className="text-3xl md:text-4xl font-extrabold">Built on Modern, Proven Technology</h2>
              <p className="text-slate-300">Reliable, secure, and optimized for growth.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {techBlocks.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="rounded-2xl border border-slate-800 bg-slate-800/70 p-5 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/90 text-white flex items-center justify-center mb-3" aria-hidden="true">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{item.desc}</p>
                  </article>
                )
              })}
            </div>
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setShowSigninModal(true)}
                  className="rounded-[14px] bg-orange-500 px-8 py-3 text-white font-semibold shadow-lg shadow-orange-400/30 hover:bg-orange-600 transition flex items-center gap-2"
                  aria-label="Launch your mobile app now"
                >
                  <Rocket className="w-5 h-5" aria-hidden="true" />
                  Launch Now
                </button>
              </div>
          </div>
        </section>

        {/* Pricing */}
        <PricingSection />

        {/* Testimonials */}
        <section className="bg-white py-12 md:py-16" aria-labelledby="testimonials-heading">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center space-y-3 mb-10">
              <h2 id="testimonials-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">Trusted by Entrepreneurs Worldwide</h2>
              <p className="text-slate-600">Founders across verticals launch and scale with Mobelo.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.name}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex items-center gap-1 text-orange-500 text-lg mb-3" aria-label="5 star rating">
                    {'★★★★★'.split('').map((star, idx) => (
                      <span key={idx} aria-hidden="true">★</span>
                    ))}
                  </div>
                  <blockquote className="text-sm text-slate-800 leading-relaxed mb-6">"{item.quote}"</blockquote>
                  <div className="flex items-center gap-3">
                    <Image
                      src={item.avatar}
                      alt={`${item.name}, ${item.title}`}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-600">{item.title}</div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="bg-white py-16" aria-labelledby="faq-heading">
          <div className="mx-auto max-w-4xl px-6">
            <div className="text-center space-y-3 mb-10">
              <h2 id="faq-heading" className="text-3xl md:text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
              <p className="text-slate-600">Quick answers about launching, publishing, and scaling.</p>
            </div>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
                    {faq.q}
                    <span className="text-orange-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </details>
              ))}
              {showMoreFaqs && moreFaqs.map((faq) => (
                <details key={faq.q} className="group rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900">
                    {faq.q}
                    <span className="text-orange-500 transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowMoreFaqs(!showMoreFaqs)}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:border-orange-200 hover:text-orange-600 transition"
                aria-label={showMoreFaqs ? 'Show less FAQs' : 'Show more FAQs'}
              >
                {showMoreFaqs ? 'Show Less' : 'More FAQ'}
              </button>
            </div>
            <div className="mt-10 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 px-8 py-8 text-center space-y-4">
              <h3 className="text-4xl font-bold text-slate-900">Still have questions?</h3>
              <p className="text-slate-600 max-w-md mx-auto">Our team is here to help you get started. Chat with us and we'll help you launch faster.</p>
              <div className="flex justify-center pt-2">
                <button className="rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-3 text-white font-semibold shadow-lg shadow-orange-300/40 hover:from-orange-700 hover:to-orange-600 transition" aria-label="Contact support team">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-br from-orange-500 to-amber-500 min-h-screen flex items-center py-16" aria-labelledby="cta-heading">
          <div className="mx-auto max-w-5xl px-6 w-full">
            <div className="bg-white rounded-3xl shadow-2xl shadow-orange-300/40 p-8 md:p-10 space-y-8">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h2 id="cta-heading" className="text-2xl md:text-3xl font-extrabold text-slate-900">Start Your Free Trial Today</h2>
                  <ul className="space-y-3 text-sm text-slate-800">
                    {[
                      'Create your first app in under 5 minutes',
                      'No credit card required to start',
                      'Full access to all features for 14 days',
                      'Cancel anytime, no questions asked',
                      'Export your code and own it forever',
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-full bg-emerald-100 text-emerald-600 p-1">
                          <Check className="w-4 h-4" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {!isLoggedIn ? (
                  <aside className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm" aria-label="Sign up form">
                    <h3 className="text-lg font-semibold text-slate-900">Create Your Account</h3>
                    <input
                      className="w-full rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                      placeholder="Enter your email address"
                      type="email"
                      aria-label="Email address"
                      value={trialEmail}
                      onChange={(e) => setTrialEmail(e.target.value)}
                    />
                    <button
                      onClick={handleContinueWithEmail}
                      className="w-full rounded-[14px] bg-gradient-to-r from-orange-500 to-amber-500 py-3 text-white font-semibold shadow-lg shadow-orange-200 hover:from-orange-600 hover:to-amber-600 transition flex items-center justify-center gap-2"
                      aria-label="Continue with email"
                    >
                      Continue with Email <span className="text-base" aria-hidden="true">→</span>
                    </button>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex-1 h-px bg-slate-200" aria-hidden="true" />
                      <span>or</span>
                      <span className="flex-1 h-px bg-slate-200" aria-hidden="true" />
                    </div>
                    <button
                      onClick={handleContinueWithGoogle}
                      className="w-full rounded-[14px] border border-slate-300 bg-white py-3 text-slate-800 font-semibold shadow-sm hover:border-orange-200 transition flex items-center justify-center gap-2"
                      aria-label="Continue with Google"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                        <path fill="none" d="M0 0h48v48H0z"/>
                      </svg>
                      Continue with Google
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      By signing up, you agree to our Terms & Privacy Policy
                    </p>
                  </aside>
                ) : (
                  <aside className="bg-gradient-to-br from-emerald-50 to-white border-2 border-emerald-200 rounded-2xl p-6 space-y-4 shadow-md" aria-label="Logged in user">
                    <div className="flex items-center gap-3 pb-3 border-b border-emerald-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                        <UserCircle2 className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">You\'re Logged In</h3>
                        <p className="text-sm text-slate-600 truncate">{userEmail}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-100 rounded-lg px-3 py-2">
                        <Check className="w-4 h-4" />
                        <span>Your account is active</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span>Ready to create apps</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLoginAsDifferentUser}
                      className="w-full rounded-[14px] border border-slate-300 bg-white py-3 text-slate-800 font-semibold shadow-sm hover:border-orange-200 hover:bg-orange-50 transition flex items-center justify-center gap-2"
                      aria-label="Login as different user"
                    >
                      <LogOut className="w-4 h-4" />
                      Login as Different User
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                      Want to switch accounts? Click above to logout and sign in with a different email.
                    </p>
                  </aside>
                )}
              </div>
              <div className="border-t border-slate-200 pt-4 flex flex-col items-center gap-3">
                <div className="text-sm text-slate-700">Want to see it in action first?</div>
                <button className="rounded-[14px] border border-orange-500 bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-white hover:text-slate-800 hover:border-slate-200 transition">
                  Schedule a Demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Signin Modal */}
      <SigninModal
        isOpen={showSigninModal}
        onClose={() => setShowSigninModal(false)}
        onSigninSuccess={() => {
          setShowSigninModal(false)
        }}
        initialEmail={signinInitialEmail}
      />

      {/* Video Modal */}
      <VideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
      />
    </div>
  )
}
