import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import Script from 'next/script'
import ErrorBoundary from '@/components/ErrorBoundary'
import { NetworkErrorFilter, ResourceLoadingOptimizer } from '@/components'
import { cn } from '@/lib/css-utils'
import { QueryProvider } from '@/providers/QueryProvider'
import { StaffUserProvider } from '@/contexts/StaffUserContext'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Mobelo – No-Code Mobile App Builder for E-Commerce | Free Trial',
  description: 'Build professional iOS & Android e-commerce apps without coding. AI-powered platform with Stripe payments, merchant panel, and unlimited products.',
  keywords: [
    'mobile app builder',
    'ecommerce app builder',
    'no-code app builder',
    'e-commerce app creator',
    'iOS app builder',
    'Android app builder',
    'AI app generator',
    'mobile shopping app',
    'create mobile app without coding',
    'launch mobile app without coding',
    'Stripe mobile app',
    'mobile commerce platform',
    'mobile app for online store',
    'shopify alternative',
    'merchant mobile app',
    'online store app',
    'retail app builder',
    'mobile commerce app',
    'ecommerce app creator',
    'mobile app generator'
  ],
  authors: [{ name: 'Mobelo' }],
  creator: 'Mobelo',
  publisher: 'Mobelo',
  applicationName: 'Mobelo',
  category: 'Technology',
  classification: 'Mobile App Development Platform',
  robots: {
    index: true,
    follow: true,
    'max-snippet': -1,
    'max-image-preview': 'large',
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://mobelo.dev/',
    siteName: 'Mobelo',
    title: 'Mobelo - AI-Powered Mobile App Builder for E-Commerce',
    description: 'Create professional iOS and Android e-commerce apps in minutes. No coding required. AI-powered design, integrated payments, and unlimited products. Start building your mobile store today!',
    images: [
      {
        url: 'https://mobelo.dev/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mobelo - Build Professional E-Commerce Mobile Apps Without Coding',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mobelo - AI-Powered Mobile App Builder for E-Commerce',
    description: 'Build professional e-commerce mobile apps for iOS and Android without coding. AI-powered platform with integrated Stripe payments.',
    images: ['https://mobelo.dev/og-image.png'],
    creator: '@mobelo',
    site: '@mobelo',
  },
  alternates: {
    canonical: 'https://mobelo.dev/',
  },
  // verification: {
  //   google: 'YOUR_REAL_VERIFICATION_CODE',
  // },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <head>
        {/* Resource hints for performance */}
        <link rel="dns-prefetch" href="https://api.mobelo.dev" />
        <link rel="preconnect" href="https://api.mobelo.dev" crossOrigin="anonymous" />

        {/* Preload critical logo used in navigation */}
        <link rel="preload" as="image" href="/logo-new.png" />
        {/* Language targeting */}
        <link rel="alternate" hrefLang="en" href="https://mobelo.dev/" />
        <link rel="alternate" hrefLang="x-default" href="https://mobelo.dev/" />
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#fb923c" />

        {/* CSP is set via next.config.js headers() — single source of truth, no meta tag needed */}

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Mobelo',
              url: 'https://mobelo.dev/',
              logo: 'https://mobelo.dev/logo-new.png',
              description: 'AI-powered mobile app builder for e-commerce. Create professional iOS and Android shopping apps without coding.',
              foundingDate: '2024',
              sameAs: [
                'https://twitter.com/mobelo',
                'https://facebook.com/mobelo',
                'https://linkedin.com/company/mobelo',
                'https://instagram.com/mobelo',
                'https://tiktok.com/@mobelo'
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                email: 'support@mobelo.dev',
                availableLanguage: ['English']
              }
            })
          }}
        />

        {/* Structured Data - SoftwareApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Mobelo',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web, iOS, Android',
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Starter Plan',
                  price: '49',
                  priceCurrency: 'USD',
                  priceValidUntil: '2026-12-31',
                  availability: 'https://schema.org/InStock'
                },
                {
                  '@type': 'Offer',
                  name: 'Growth Plan',
                  price: '99',
                  priceCurrency: 'USD',
                  priceValidUntil: '2026-12-31',
                  availability: 'https://schema.org/InStock'
                },
                {
                  '@type': 'Offer',
                  name: 'Custom Plan',
                  price: '199',
                  priceCurrency: 'USD',
                  priceValidUntil: '2026-12-31',
                  availability: 'https://schema.org/InStock'
                }
              ],
              url: 'https://mobelo.dev/',
              description: 'Build professional e-commerce mobile apps for iOS and Android without coding. AI-powered platform with integrated Stripe payments, merchant panel, and unlimited products.'
            })
          }}
        />

        {/* Structured Data - Product Schema for Pricing Plans */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mobelo Starter Plan',
                image: 'https://mobelo.dev/og-image.png',
                description: 'Perfect for testing and small projects. Production-ready mobile app with full merchant dashboard, unlimited products and orders.',
                brand: {
                  '@type': 'Brand',
                  name: 'Mobelo'
                },
                offers: {
                  '@type': 'Offer',
                  price: '49',
                  priceCurrency: 'USD',
                  priceValidUntil: '2026-12-31',
                  availability: 'https://schema.org/InStock',
                  url: 'https://mobelo.dev/pricing'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mobelo Growth Plan',
                image: 'https://mobelo.dev/og-image.png',
                description: 'For growing businesses. Advanced merchant dashboard with unlimited products, orders, and advanced analytics. Includes custom integrations and source code export.',
                brand: {
                  '@type': 'Brand',
                  name: 'Mobelo'
                },
                offers: {
                  '@type': 'Offer',
                  price: '99',
                  priceCurrency: 'USD',
                  priceValidUntil: '2026-12-31',
                  availability: 'https://schema.org/InStock',
                  url: 'https://mobelo.dev/pricing'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mobelo Custom Plan',
                image: 'https://mobelo.dev/og-image.png',
                description: 'For large-scale operations. Production-ready mobile app and website with unlimited products, orders, custom features and integrations.',
                brand: {
                  '@type': 'Brand',
                  name: 'Mobelo'
                },
                offers: {
                  '@type': 'Offer',
                  price: '199',
                  priceCurrency: 'USD',
                  priceValidUntil: '2026-12-31',
                  availability: 'https://schema.org/InStock',
                  url: 'https://mobelo.dev/pricing'
                }
              }
            ])
          }}
        />

        {/* Structured Data - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Mobelo',
              url: 'https://mobelo.dev/'
            })
          }}
        />


      </head>
      <body className={cn(manrope.variable, inter.variable, 'font-sans antialiased overflow-x-hidden')} style={{ fontFamily: 'var(--font-manrope), var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {/* Critical error suppression — beforeInteractive keeps only event listeners (small, ~1KB) */}
        <Script id="error-handler" strategy="beforeInteractive">
          {`
            (function() {
              'use strict';
              var EP = ['extension://','chrome-extension://','moz-extension://','safari-extension://','features.js','frame_start.js','frame_ant.js','sidePanelUtil.js','express-fte','content-script-utils.js','EmbeddedPDFTouchPointController','ShowOneChild.js','my-apps:0','readability.js','html2canvas.min.js','e4af272ccee01ff0-s.p.woff2'];
              var UP = ['/my-apps:0','/content-script-utils.js','/frame_start.js','/express-fte-utils.js'];
              window.addEventListener('error', function(e) {
                var t = (e.message||'') + ' ' + (e.filename||'');
                var f = e.filename || '';
                if (EP.some(function(p){return t.toLowerCase().indexOf(p.toLowerCase())!==-1;})) { e.preventDefault(); e.stopPropagation(); return true; }
                if (UP.some(function(p){return f.indexOf(p)!==-1;})) { e.preventDefault(); e.stopPropagation(); return true; }
                if (!e.filename || e.filename === '' || e.filename === 'undefined') { e.preventDefault(); e.stopPropagation(); return true; }
              }, true);
              window.addEventListener('unhandledrejection', function(e) {
                var c = (e.reason ? e.reason.toString() : '') + ' ' + (e.reason && e.reason.stack ? e.reason.stack.toString() : '');
                if (EP.some(function(p){return c.indexOf(p)!==-1;})) { e.preventDefault(); e.stopPropagation(); return true; }
              }, true);
            })();
          `}
        </Script>

        {/* Console filter — afterInteractive, non-blocking */}
        <Script id="console-filter" strategy="afterInteractive">
          {`
            (function() {
              var EP = ['extension://','chrome-extension://','moz-extension://','safari-extension://','features.js','frame_start.js','frame_ant.js','sidePanelUtil.js','express-fte','content-script-utils.js','EmbeddedPDFTouchPointController','ShowOneChild.js','my-apps:0','readability.js','html2canvas.min.js'];
              var UP = ['/my-apps:0','/content-script-utils.js','/frame_start.js','/express-fte-utils.js'];
              var ce = console.error, cw = console.warn;
              console.error = function() {
                var m = Array.prototype.join.call(arguments, ' ');
                if (EP.some(function(p){return m.indexOf(p)!==-1;}) || UP.some(function(p){return m.indexOf(p)!==-1;}) || m.indexOf('Failed to load resource')!==-1) return;
                return ce.apply(this, arguments);
              };
              console.warn = function() {
                var m = Array.prototype.join.call(arguments, ' ');
                if (EP.some(function(p){return m.indexOf(p)!==-1;}) || UP.some(function(p){return m.indexOf(p)!==-1;})) return;
                return cw.apply(this, arguments);
              };
            })();
          `}
        </Script>

        <ErrorBoundary>
          <QueryProvider>
            <StaffUserProvider>
              {/* <ConsoleErrorFilter /> */}
              <NetworkErrorFilter />
              <ResourceLoadingOptimizer />
              {children}
            </StaffUserProvider>
          </QueryProvider>
          <Toaster
            position="top-right"
            containerStyle={{
              top: '80px', // Position below the main header (64px) + extra padding
            }}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ErrorBoundary>

        {/* Meta Pixel — loaded after page is interactive to avoid render blocking */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','1642961110194498');
            fbq('track','PageView');
          `}
        </Script>
      </body>
    </html>
  )
}
