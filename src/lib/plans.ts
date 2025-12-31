export type PlanKey = 'trial' | 'starter' | 'growth' | 'custom'
export type BillingCycle = 'monthly' | 'annual'

export const PLAN_NAMES: Record<PlanKey, string> = {
  trial: 'Free Trial',
  starter: 'Starter',
  growth: 'Growth',
  custom: 'Custom',
}

// USD pricing per month; annual shows a 20% savings in UI
export const PLAN_PRICES_MONTHLY: Record<PlanKey, number> = {
  trial: 0,
  starter: 49,
  growth: 99,
  custom: 199,
}

export function getMonthlyPrice(plan: PlanKey, billing: BillingCycle): number {
  const base = PLAN_PRICES_MONTHLY[plan]
  if (billing === 'annual') {
    // Show discounted monthly equivalent for annual billing (20% off)
    return Math.floor(base * 0.8)
  }
  return base
}

export function formatPriceUSD(value: number): string {
  if (value <= 0) return 'Free'
  return `$${value}`
}

export function normalizePlan(value?: string | null): PlanKey | null {
  if (!value) return null
  const v = value.toLowerCase()
  // Support both old and new plan names for backward compatibility
  if (v === 'trial' || v === 'entrepreneur') return 'trial'
  if (v === 'starter' || v === 'startup') return 'starter'
  if (v === 'growth') return 'growth'
  if (v === 'custom' || v === 'professional') return 'custom'
  return null
}

export function normalizeBilling(value?: string | null): BillingCycle {
  return value === 'annual' ? 'annual' : 'monthly'
}

// Shared pricing data for consistent display across pages
export interface PricingTier {
  key: PlanKey
  name: string
  description: string
  monthlyPrice: number
  note: string
  trialNote?: string
  highlight?: boolean
  badge?: string
  features: string[]
  cta: string
  ctaVariant: 'primary' | 'secondary'
}

export const PRICING_TIERS: PricingTier[] = [
  {
    key: 'starter',
    name: 'Starter',
    description: 'Perfect for testing and small projects',
    monthlyPrice: 49,
    note: '/month',
    trialNote: '+ 14-day free trial',
    features: [
      'Production-ready mobile app',
      'Full merchant dashboard',
      'Unlimited products',
      'Unlimited monthly orders',
      'Essential analytics & reports',
      'Managed infrastructure & updates',
      'No token or usage limits',
      'Mobile App source code ownership',
      'Email and chat support',
      '1-on-1 app launch support',
      '1% commission + Stripe fees',
    ],
    cta: 'Start Free Trial',
    ctaVariant: 'secondary',
  },
  {
    key: 'growth',
    name: 'Growth',
    description: 'For growing businesses',
    monthlyPrice: 99,
    note: '/month',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Production-ready mobile app',
      'Advance merchant dashboard',
      'Unlimited products',
      'Unlimited orders per month',
      'Advance analytics & performance reports',
      'Managed infrastructure & updates',
      'No token or usage limits',
      'Custom Integrations',
      'Mobile App source code export',
      'Email and chat support',
      '1-on-1 app launch support',
      '0.7% commission + Stripe fees',
    ],
    cta: 'Get Started',
    ctaVariant: 'primary',
  },
  {
    key: 'custom',
    name: 'Custom',
    description: 'For large-scale operations',
    monthlyPrice: 199,
    note: '/month',
    features: [
      'Production-ready mobile app',
      'Production-ready website',
      'Advance merchant dashboard',
      'Unlimited products',
      'Unlimited orders per month',
      'Advance analytics & performance reports',
      'Managed infrastructure & updates',
      'No token or usage limits',
      'Custom Integrations',
      'Custom Features',
      'Mobile App source code export',
      'Email and chat support',
      '1-on-1 app launch support',
      '0.4% commission + Stripe fees',
    ],
    cta: 'Contact Sales',
    ctaVariant: 'secondary',
  },
]

