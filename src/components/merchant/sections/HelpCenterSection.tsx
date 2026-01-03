'use client'

import { useState, useEffect } from 'react'
import { MessageCircleQuestion, Video, ArrowRight, Clock, BookOpen, Calendar, Headset, ArrowLeft } from 'lucide-react'
import Intercom from '@intercom/messenger-js-sdk'

interface HelpCenterSectionProps {
  onNavigate: (section: 'help-faq' | 'help-tutorials') => void
}

export default function HelpCenterSection({ onNavigate }: HelpCenterSectionProps) {
  const [showCalendly, setShowCalendly] = useState(false)

  const trendingTopics = [
    'Publishing Apps',
    'Stripe Setup',
    'Product Variants'
  ]

  const quickLinks = [
    { icon: Calendar, label: 'Book a Meeting', color: 'from-sky-500 to-blue-500' },
    { icon: Headset, label: 'Contact Chat Support', color: 'from-emerald-600 to-teal-600' },
  ]

  // Initialize Intercom on component mount
  useEffect(() => {
    Intercom({
      app_id: 'parymzk6',
    })
  }, [])

  // If showing Calendly, replace entire content with iframe
  if (showCalendly) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-sky-500 to-blue-500">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCalendly(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <h3 className="text-xl font-bold text-white">Book a Meeting</h3>
            </div>
          </div>
          <div className="w-full h-[800px]">
            <iframe
              src="https://calendly.com/mobelo/need-help-building-my-mobile-app?back=1&month=2026-01"
              width="100%"
              height="100%"
              frameBorder="0"
              title="Book a Meeting"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-500 bg-clip-text text-transparent">
            Help Center
          </span>
        </h1>
        <p className="text-slate-600 text-lg mb-6">
          Everything you need to build and grow your mobile e-commerce app
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500 mb-8">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>41 Articles</span>
          </div>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-slate-400" />
            <span>18 Video Tutorials</span>
          </div>
        </div>
      </div>

      {/* Main Feature Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* FAQ Card */}
        <button
          onClick={() => onNavigate('help-faq')}
          className="group relative overflow-hidden bg-gradient-to-br from-slate-600 to-slate-500 rounded-2xl p-8 text-left text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <MessageCircleQuestion className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-slate-50 mb-6">
              Browse 41 articles across 8 categories covering all aspects of the platform
            </p>

            {/* Trending Topics */}
            <div className="flex flex-wrap gap-2 mb-4">
              {trendingTopics.map((topic, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
              Browse FAQs
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Video Tutorials Card */}
        <button
          onClick={() => onNavigate('help-tutorials')}
          className="group relative overflow-hidden bg-gradient-to-br from-teal-600 to-cyan-600 rounded-2xl p-8 text-left text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

          <div className="relative">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <div className="relative">
                <Video className="w-8 h-8" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-400 rounded-full animate-pulse"></div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">Video Tutorials</h2>
            <p className="text-teal-50 mb-6">
              Watch 18 step-by-step guides covering beginner to advanced topics
            </p>

            {/* Duration Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">2.8 hours total content</span>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium mt-4 group-hover:gap-3 transition-all">
              Watch Tutorials
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </button>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
        <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Links</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {quickLinks.map((link, index) => {
            const Icon = link.icon
            const handleClick = () => {
              if (link.label === 'Book a Meeting') {
                setShowCalendly(true)
              } else if (link.label === 'Contact Chat Support') {
                if (typeof window !== 'undefined' && (window as any).Intercom) {
                  (window as any).Intercom('show')
                }
              }
            }
            return (
              <button
                key={index}
                onClick={handleClick}
                className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-300 hover:scale-105 bg-slate-50 hover:bg-white"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors">
                    {link.label}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center">
        <p className="text-slate-500 text-sm">
          Can't find what you're looking for?{' '}
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && (window as any).Intercom) {
                (window as any).Intercom('show')
              }
            }}
            className="text-teal-600 hover:text-teal-700 font-medium underline"
          >
            Contact our support team
          </button>
        </p>
      </div>
    </div>
  )
}
