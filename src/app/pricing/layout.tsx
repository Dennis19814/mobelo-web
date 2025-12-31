import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing Plans - Mobelo',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
