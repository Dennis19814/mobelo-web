import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing – Mobelo No-Code Mobile App Builder | Free Trial',
  description: 'Choose the Mobelo plan that fits your business. Build a professional e-commerce mobile app from $49/month. No coding required. 14-day free trial included.',
  alternates: {
    canonical: 'https://mobelo.dev/pricing',
  },
  openGraph: {
    type: 'website',
    url: 'https://mobelo.dev/pricing',
    title: 'Pricing – Mobelo No-Code Mobile App Builder',
    description: 'Build a professional e-commerce mobile app from $49/month. No coding required. All plans include a 14-day free trial.',
    images: [{ url: 'https://mobelo.dev/og-image.png', width: 1200, height: 630 }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
    },
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
