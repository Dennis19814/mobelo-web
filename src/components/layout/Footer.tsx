'use client'
import { logger } from '@/lib/logger'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Twitter, Facebook, Linkedin, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  const router = useRouter()
  
  const handleLinkClick = (section: string) => {
    switch (section) {
      case 'terms':
        router.push('/terms')
        break
      case 'privacy':
        router.push('/privacy')
        break
      case 'features':
      case 'how-it-works':
      case 'faq':
        // Navigate to home page first if not already there
        if (window.location.pathname !== '/') {
          router.push(`/#${section}`)
        } else {
          // If already on home page, just scroll
          const element = document.getElementById(section)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }
        break
      default:
        logger.debug(`Navigating to: ${section}`)
    }
  }

  return (
    <footer className="bg-gradient-to-b from-white to-orange-50 border-t border-orange-100 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center space-y-4">

          {/* Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <a
              href="/#features"
              onClick={(e) => { e.preventDefault(); handleLinkClick('features') }}
              className="text-slate-600 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline underline-offset-4"
            >
              Features
            </a>
            <a
              href="/#how-it-works"
              onClick={(e) => { e.preventDefault(); handleLinkClick('how-it-works') }}
              className="text-slate-600 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline underline-offset-4"
            >
              How it works
            </a>
            <Link
              href="/pricing"
              className="text-slate-600 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline underline-offset-4"
            >
              Pricing
            </Link>
            <a
              href="/#faq"
              onClick={(e) => { e.preventDefault(); handleLinkClick('faq') }}
              className="text-slate-600 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline underline-offset-4"
            >
              FAQ
            </a>
            <Link
              href="/terms"
              className="text-slate-600 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline underline-offset-4"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-slate-600 hover:text-orange-600 transition-colors duration-200 font-medium hover:underline underline-offset-4"
            >
              Privacy
            </Link>
          </div>

          {/* Social Media Icons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <a
              href="https://www.instagram.com/mobelo_dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-500 transition-colors duration-200"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a
              href="https://web.facebook.com/profile.php?id=61577369432902"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-500 transition-colors duration-200"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.tiktok.com/@mobelo.dev?lang=en-GB"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-500 transition-colors duration-200 group"
              aria-label="Follow us on TikTok"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/mobelo-apps/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-500 transition-colors duration-200"
              aria-label="Connect with us on LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="https://x.com/Mobelo_Dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-500 transition-colors duration-200"
              aria-label="Follow us on X"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://www.youtube.com/@mobelo_dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-500 transition-colors duration-200"
              aria-label="Subscribe to our YouTube channel"
            >
              <Youtube className="w-5 h-5" />
            </a>
          </div>

          {/* Copyright */}
          <div className="text-center pt-3 border-t border-orange-200 w-full">
            <p className="text-slate-500 text-sm font-medium">
              © 2026 mobelo. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
