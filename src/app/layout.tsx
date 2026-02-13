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
  title: 'Mobelo - No-Code Mobile App Builder for E-Commerce',
  description: 'Build professional iOS & Android e-commerce apps without coding. AI-powered platform with Stripe payments, merchant panel, and unlimited products.',
  keywords: [
    'mobile app builder',
    'e-commerce app creator',
    'no-code app builder',
    'iOS app builder',
    'Android app builder',
    'AI app generator',
    'mobile shopping app',
    'create mobile app without coding',
    'ecommerce app builder',
    'Stripe mobile app',
    'mobile commerce platform',
    'app maker',
    'build shopping app',
    'react native app builder',
    'expo app creator',
    'merchant mobile app',
    'online store app',
    'retail app builder',
    'mobile app generator'
  ],
  authors: [{ name: 'Mobelo' }],
  creator: 'Mobelo',
  publisher: 'Mobelo',
  applicationName: 'Mobelo',
  category: 'Technology',
  classification: 'Mobile App Development Platform',
  referrer: 'origin-when-cross-origin',
  robots: {
    index: true,
    follow: true,
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
    url: 'https://mobelo.dev',
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
    canonical: 'https://mobelo.dev',
  },
  verification: {
    google: 'google-site-verification-code',
    // yandex: 'yandex-verification-code',
    // bing: 'bing-verification-code',
  },
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="https://api.mobelo.dev" />
        <link rel="preconnect" href="https://api.mobelo.dev" crossOrigin="anonymous" />

        {/* Preload critical resources */}
        <link rel="preload" as="image" href="/logo.webp" />
        <link rel="preload" as="image" href="/logo.png" />

        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#fb923c" />

        {/* Security headers - disable CSP in development to avoid blocking Next dev assets */}
        {process.env.NODE_ENV === 'production' && (
          <meta
            httpEquiv="Content-Security-Policy"
            content="default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://localhost:* http://localhost:* https://cdnjs.cloudflare.com https://connect.facebook.net;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: blob: https: http: https://www.facebook.com;
              font-src 'self' data: https://fonts.gstatic.com;
              connect-src 'self' https://api.mobelo.dev wss://api.mobelo.dev https://worker.mobelo.dev wss://worker.mobelo.dev https://publish.mobelo.dev wss://publish.mobelo.dev https://localhost:* http://localhost:* ws://localhost:* wss://localhost:* http://13.51.2.100:* ws://13.51.2.100:* https://www.facebook.com https://connect.facebook.net;
              frame-src 'self' https://e1.mobelo.xyz https://*.mobelo.dev http://*.mobelo.dev https://app-*.mobelo.dev http://app-*.mobelo.dev https://localhost:* http://localhost:*;"
          />
        )}
        <meta name="referrer" content="no-referrer-when-downgrade" />

        {/* Structured Data - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Mobelo',
              url: 'https://mobelo.dev',
              logo: 'https://mobelo.dev/logo.png',
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
                email: 'support@mobelo.com',
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
              applicationCategory: 'DeveloperApplication',
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
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                ratingCount: '5000'
              },
              description: 'Build professional e-commerce mobile apps for iOS and Android without coding. AI-powered platform with integrated Stripe payments, merchant panel, and unlimited products.'
            })
          }}
        />

        {/* Structured Data - BreadcrumbList */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://mobelo.dev'
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Pricing',
                  item: 'https://mobelo.dev/pricing'
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: 'Features',
                  item: 'https://mobelo.dev/features'
                },
                {
                  '@type': 'ListItem',
                  position: 4,
                  name: 'App Builder',
                  item: 'https://mobelo.dev/app-builder'
                }
              ]
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
                },
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.9',
                  reviewCount: '5000'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mobelo Growth Plan',
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
                },
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.9',
                  reviewCount: '5000'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'Product',
                name: 'Mobelo Custom Plan',
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
                },
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: '4.9',
                  reviewCount: '5000'
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
              url: 'https://mobelo.dev',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://mobelo.dev/search?q={search_term_string}',
                'query-input': 'required name=search_term_string'
              }
            })
          }}
        />

        {/* Structured Data - FAQPage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How long does it take to launch?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Mobelo generates your complete mobile app in 4-8 minutes. You can refine it using simple prompts and publish with a few clicks. App Store and Play Store approvals may take a few days and are subject to their review processes, which are outside Mobelo\'s control.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Do I need design or coding skills?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No design or coding skills are required. Mobelo uses premium layouts, follows industry standards, and builds fully functional features, so you can launch without any technical expertise.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Can I publish to both iOS and Android?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. You can publish your app to both iOS and Android, and book a support session with our team for hands-on assistance if needed.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Who owns the app and source code?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'You own your mobile app and its source code. You can export the full source code at any time.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Are there any hidden or upfront costs?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. There are no hidden or upfront costs. You only pay a monthly fee plus a sales-based commission, ranging from 0.4% to a maximum of 1%, depending on your plan.'
                  }
                },
                {
                  '@type': 'Question',
                  name: 'Does Mobelo handle hosting and infrastructure?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes. Mobelo provides fully managed infrastructure, including hosting, updates, monitoring, and maintenance.'
                  }
                }
              ]
            })
          }}
        />

        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1642961110194498');
              fbq('track', 'PageView');
            `
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=1642961110194498&ev=PageView&noscript=1"
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body className={cn(manrope.variable, inter.variable, 'font-sans antialiased overflow-x-hidden')} style={{ fontFamily: 'var(--font-manrope), var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {/* Global error handler for browser extension errors */}
        <Script id="error-handler" strategy="beforeInteractive">
          {`
            (function() {
              'use strict';
              
              // List of known extension/external script patterns
              const extensionPatterns = [
                'extension://',
                'chrome-extension://',
                'moz-extension://',
                'safari-extension://',
                'features.js',
                'webpack.js',
                'main.js',
                'react-refresh.js',
                '_app.js',
                '_error.js',
                'express-fte',
                'local-storage.js',
                'fte-utils.js',
                'frame_start.js',
                'frame_ant.js',
                'sidePanelUtil.js',
                'express-fte-utils.js',
                'content-script-utils.js',
                'EmbeddedPDFTouchPointController',
                'ShowOneChild.js',
                'features:0',
                'my-apps:0',
                'content-script-utils.js:18',
                'EmbeddedPDFTouchPointController',
                'GenAIWebpageEligibilitySet',
                'ShowOneChild.js:18',
                'frame_start.js:2',
                'express-fte-utils.js:18',
                'main-app.js',
                'app-pages-internals.js',
                'page.js',
                'layout.js',
                'readability.js',
                'sidePanelUtil.js',
                'webpack.js?v=',
                'main-app.js?v=',
                'layout.css?v=',
                'html2canvas.min.js',
                'e4af272ccee01ff0-s.p.woff2'
              ];
              
              // Additional patterns for URL-based filtering
              const urlPatterns = [
                '/my-apps:0',
                '/content-script-utils.js',
                '/frame_start.js',
                '/express-fte-utils.js'
              ];
              
              // More aggressive error suppression
              window.addEventListener('error', function(e) {
                const errorText = (e.message || '') + ' ' + (e.filename || '') + ' ' + (e.source || '');
                const filename = e.filename || '';
                
                // Block any error containing extension patterns
                if (extensionPatterns.some(pattern => errorText.toLowerCase().includes(pattern.toLowerCase()))) {
                  e.preventDefault();
                  e.stopPropagation();
                  return true;
                }
                
                // Block URL-based patterns
                if (urlPatterns.some(pattern => filename.includes(pattern))) {
                  e.preventDefault();
                  e.stopPropagation();
                  return true;
                }
                
                // Block errors with specific HTTP status codes from extensions
                if (e.message && (
                  e.message.includes('500 (Internal Server Error)') ||
                  e.message.includes('404 (Not Found)') ||
                  e.message.includes('403 (Forbidden)')
                ) && (
                  filename.includes('extension') || 
                  filename.includes('chrome-') || 
                  filename.includes('moz-') ||
                  extensionPatterns.some(pattern => filename.includes(pattern))
                )) {
                  e.preventDefault();
                  e.stopPropagation();
                  return true;
                }
                
                // Block errors with no filename (often from extensions)
                if (!e.filename || e.filename === '' || e.filename === 'undefined') {
                  e.preventDefault();
                  e.stopPropagation();
                  return true;
                }
                
                // Block network errors often caused by ad blockers
                if (e.message && (
                  e.message.includes('Failed to load resource') ||
                  e.message.includes('net::ERR_BLOCKED_BY_CLIENT') ||
                  e.message.includes('net::ERR_FAILED') ||
                  e.message.includes('ERR_INTERNET_DISCONNECTED')
                )) {
                  e.preventDefault();
                  e.stopPropagation();
                  return true;
                }
              }, true); // Use capture phase
              
              // Suppress unhandled promise rejections from extensions
              window.addEventListener('unhandledrejection', function(e) {
                const reason = e.reason ? e.reason.toString() : '';
                const stack = e.reason && e.reason.stack ? e.reason.stack.toString() : '';
                const combined = reason + ' ' + stack;
                
                if (extensionPatterns.some(pattern => combined.includes(pattern))) {
                  e.preventDefault();
                  e.stopPropagation();
                  return true;
                }
              }, true);
              
              // Temporarily disabled fetch override to prevent API interference
              // const originalFetch = window.fetch;
              // window.fetch = function(...args) {
              //   const url = args[0];
              //   if (typeof url === 'string' && extensionPatterns.some(pattern => url.includes(pattern))) {
              //     return Promise.reject(new Error('Blocked extension request'));
              //   }
              //   return originalFetch.apply(this, args);
              // };
              
              // Temporarily disabled createElement override to prevent issues
              // const originalCreateElement = document.createElement;
              // document.createElement = function(tagName) {
              //   const element = originalCreateElement.apply(this, arguments);
              //   if (tagName.toLowerCase() === 'script') {
              //     const originalSrc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src');
              //     Object.defineProperty(element, 'src', {
              //       set: function(value) {
              //         if (extensionPatterns.some(pattern => value.includes(pattern))) {
              //           return; // Block the src assignment
              //         }
              //         originalSrc.set.call(this, value);
              //       },
              //       get: originalSrc.get
              //     });
              //   }
              //   return element;
              // };
              
              // Override console methods to filter extension errors
              const originalConsoleError = console.error;
              const originalConsoleWarn = console.warn;
              
              console.error = function(...args) {
                const message = args.join(' ');
                if (extensionPatterns.some(pattern => message.includes(pattern)) ||
                    urlPatterns.some(pattern => message.includes(pattern)) ||
                    message.includes('500 (Internal Server Error)') ||
                    message.includes('404 (Not Found)') ||
                    message.includes('Failed to load resource')) {
                  return; // Suppress extension-related errors
                }
                return originalConsoleError.apply(this, args);
              };
              
              console.warn = function(...args) {
                const message = args.join(' ');
                if (extensionPatterns.some(pattern => message.includes(pattern)) ||
                    urlPatterns.some(pattern => message.includes(pattern))) {
                  return; // Suppress extension-related warnings
                }
                return originalConsoleWarn.apply(this, args);
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
      </body>
    </html>
  )
}
