'use client'
import { logger } from '@/lib/logger'

import React from 'react'

interface AppScreen {
  id: number
  title: string
  description: string
  category: string
  color_json?: {
    primary?: string
    secondary?: string
    [key: string]: any
  } | null
}

interface JSXRendererProps {
  jsxCode: string
  screenData?: AppScreen
  className?: string
}

// Safe JSX renderer that can handle specific patterns
export default function JSXRenderer({ jsxCode, screenData, className = '' }: JSXRendererProps) {
  
  // Parse JSX patterns and render accordingly
  const renderComponent = () => {
    if (!jsxCode) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="font-semibold mb-2">No Content</h3>
            <p className="text-sm">No component to display</p>
          </div>
        </div>
      )
    }

    try {
      // Check if this is the Wildlife Explorer component
      if (jsxCode.includes('Wildlife Explorer') || jsxCode.includes('WildlifeHome')) {
        return <WildlifeExplorerComponent />
      }

      // Check for other component patterns
      if (jsxCode.includes('Fitness') || jsxCode.includes('workout')) {
        return <FitnessAppComponent />
      }

      if (jsxCode.includes('Recipe') || jsxCode.includes('food')) {
        return <RecipeAppComponent />
      }

      if (jsxCode.includes('Pet') || jsxCode.includes('animal')) {
        return <PetCareComponent />
      }

      // Generic component based on screen data
      return <GenericMobileComponent screenData={screenData} jsxCode={jsxCode} />

    } catch (error) {
      logger.error('Error rendering component:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-red-600">
            <h3 className="font-semibold mb-2">Render Error</h3>
            <p className="text-sm">Failed to render component</p>
            <div className="mt-3 p-3 bg-red-50 rounded-lg text-left max-w-sm">
              <pre className="text-xs text-red-700 overflow-auto max-h-24">
                {jsxCode.slice(0, 200)}...
              </pre>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className={className}>
      {renderComponent()}
    </div>
  )
}

// Wildlife Explorer Component
function WildlifeExplorerComponent() {
  return (
    <div className="w-full h-full bg-[#f6f7fb]" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
      <div className="w-full h-full bg-white">
        {/* Header */}
        <header className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-[8px]" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }} />
            <div className="leading-tight">
              <h1 className="text-[15px] font-semibold tracking-[-0.2px]">Wildlife Explorer</h1>
              <p className="text-[12px] text-[#6b7280]">Spot • Learn • Protect</p>
            </div>
          </div>
        </header>

        {/* Search / CTA Row */}
        <div className="px-5 pb-4">
          <div className="flex gap-3">
            <button className="flex-1 rounded-[6px] border border-black/10 bg-white px-3 py-2 text-left text-[13px] text-[#6b7280]">
              Search parks, species…
            </button>
            <button className="rounded-[6px] bg-black px-3 py-2 text-white text-[13px] font-semibold">Go</button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 bg-[#f6f7fb]">
          {/* Progress Card */}
          <section className="mb-4 rounded-[12px] border border-[#efefef] bg-white p-4 shadow-[0_1px_0_rgba(0,0,0,.04),_0_8px_24px_rgba(0,0,0,.06)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-semibold tracking-[-0.2px]">Your Week</h3>
                <p className="text-[12px] text-[#6b7280]">3/5 trail goals completed</p>
              </div>
              <span className="rounded-full bg-[#f59e0b]/10 px-2 py-1 text-[11px] font-semibold text-[#7a4a00]">Level 4</span>
            </div>
            <div className="mt-3 h-[6px] w-full overflow-hidden rounded-full bg-[#efefef]">
              <div className="h-full w-3/5 rounded-full bg-[#0b0f1a]" />
            </div>
          </section>

          {/* 2-col Grid Tiles */}
          <section className="grid grid-cols-2 gap-3">
            <WildlifeTile title="Species Guide" subtitle="Birds, mammals, insects" bg="#fde68a" badge="Learn" />
            <WildlifeTile title="Nearby Trails" subtitle="Routes & difficulty" bg="#facc15" badge="Map" />
            <WildlifeTile title="Photo ID" subtitle="Snap to identify" bg="#fff7cc" badge="AI" />
            <WildlifeTile title="Conservation" subtitle="Projects & tips" bg="#ffedd5" badge="Act" />
            <WildlifeTile title="Sightings" subtitle="Community feed" bg="#fde68a" badge="Live" />
            <WildlifeTile title="Field Notes" subtitle="Logs & checklists" bg="#facc15" badge="Journal" />
          </section>
        </div>

        {/* Bottom Navigation */}
        <nav className="grid h-16 grid-cols-4 border-t border-[#efefef] bg-white text-[12px]">
          <NavButton label="Home" active />
          <NavButton label="Explore" />
          <NavButton label="Camera" />
          <NavButton label="Profile" />
        </nav>
      </div>
    </div>
  )
}

function WildlifeTile({ title, subtitle, bg, badge }: { title: string, subtitle: string, bg: string, badge: string }) {
  return (
    <div
      className="relative flex min-h-[140px] flex-col justify-end rounded-[8px] border border-[#efefef] p-3 shadow-[0_1px_0_rgba(0,0,0,.04),_0_8px_24px_rgba(0,0,0,.06)]"
      style={{ backgroundColor: bg }}
    >
      <span className="absolute left-2 top-2 rounded-[6px] bg-black px-2 py-0.5 text-[11px] font-semibold text-white">
        {badge}
      </span>
      <div>
        <h3 className="text-[14px] font-semibold tracking-[-0.2px] text-[#0b0f1a]">{title}</h3>
        <p className="text-[12px] text-[#6b7280]">{subtitle}</p>
      </div>
    </div>
  )
}

function NavButton({ label, active = false }: { label: string, active?: boolean }) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 text-[#0b0f1a]">
      <div className={`h-5 w-5 ${active ? 'text-[#f59e0b]' : 'text-[#6b7280]'}`}>
        <div className="w-full h-full bg-current rounded opacity-60" />
      </div>
      <span className={`text-[11px] ${active ? 'text-[#f59e0b] font-semibold' : 'text-[#6b7280]'}`}>
        {label}
      </span>
    </button>
  )
}

// Fitness App Component
function FitnessAppComponent() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">💪</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">FitTracker Pro</h1>
              <p className="text-gray-600 text-sm">Your fitness journey starts here</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Today's Workout</h3>
              <p className="text-gray-600 text-sm">45 min • Full Body Strength</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">2.5k</div>
                <div className="text-xs text-gray-600">Steps Today</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">340</div>
                <div className="text-xs text-gray-600">Calories Burned</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Recipe App Component  
function RecipeAppComponent() {
  return (
    <div className="w-full h-full bg-orange-50">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🍳</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Recipe Master</h1>
              <p className="text-gray-600 text-sm">Delicious recipes at your fingertips</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Featured Recipe</h3>
              <p className="text-gray-600 text-sm">Spicy Thai Basil Chicken</p>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">25</div>
                <div className="text-xs text-gray-600">Minutes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-red-600">4</div>
                <div className="text-xs text-gray-600">Servings</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-green-600">★★★★★</div>
                <div className="text-xs text-gray-600">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Pet Care Component
function PetCareComponent() {
  return (
    <div className="w-full h-full bg-green-50">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🐕</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PetCare+</h1>
              <p className="text-gray-600 text-sm">Complete care for your furry friends</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Max's Profile</h3>
              <p className="text-gray-600 text-sm">Golden Retriever • 3 years old</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-xs text-gray-600">Vaccinated</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">5</div>
                <div className="text-xs text-gray-600">Days Until Checkup</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generic Mobile Component
function GenericMobileComponent({ screenData, jsxCode }: { screenData?: AppScreen, jsxCode: string }) {
  const colors = screenData?.color_json || { primary: '#3B82F6', secondary: '#F3F4F6' }
  const title = screenData?.title || 'Mobile App Screen'
  const description = screenData?.description || 'Dynamic content from API'
  
  return (
    <div className="w-full h-full bg-gray-50">
      <div className="flex flex-col h-full">
        <header className="px-4 py-4" style={{ backgroundColor: colors.primary || '#3B82F6' }}>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <p className="text-sm text-white/80">{description}</p>
        </header>
        
        <div className="flex-1 p-4 overflow-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <div className="text-sm font-medium text-gray-900 mb-2">Screen Content</div>
            <div className="text-xs text-gray-600">Category: {screenData?.category || 'Unknown'}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-900 mb-3">Component Code</div>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-64 overflow-auto">
              {jsxCode}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}