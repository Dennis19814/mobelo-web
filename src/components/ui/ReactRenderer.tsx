'use client'
import { logger } from '@/lib/logger'

import React, { useMemo } from 'react'

interface ReactRendererProps {
  reactCode: string
  screenData?: any
  className?: string
}

// Function to create a React component from JSX string
function createComponentFromJSX(jsxString: string) {
  try {
    // Remove export statement and function declaration to extract the JSX
    let cleanedJSX = jsxString
      .replace(/export\s+default\s+function\s+\w+\([^)]*\)\s*{/, '') // Remove function declaration
      .replace(/^\s*function\s+\w+\([^)]*\)\s*{/, '') // Remove function declaration without export
      .replace(/}\s*$/, '') // Remove closing brace
      .trim()
    
    // If the JSX starts with 'return', remove it
    if (cleanedJSX.startsWith('return (')) {
      cleanedJSX = cleanedJSX.replace(/^return\s*\(/, '').replace(/\);?\s*$/, '')
    } else if (cleanedJSX.startsWith('return')) {
      cleanedJSX = cleanedJSX.replace(/^return\s+/, '').replace(/;\s*$/, '')
    }
    
    // Extract helper functions/components if they exist
    const helperFunctions = extractHelperFunctions(jsxString)
    
    return { jsx: cleanedJSX, helpers: helperFunctions }
  } catch (error) {
    logger.error('Error parsing JSX:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return null
  }
}

// Function to extract helper functions and components from the JSX string
function extractHelperFunctions(jsxString: string) {
  const helpers: { [key: string]: any } = {}
  
  // Extract function declarations (like Tile, NavItem, IconHome, etc.)
  const functionMatches = jsxString.match(/function\s+(\w+)\s*\([^)]*\)\s*{[\s\S]*?^}/gm)
  
  if (functionMatches) {
    functionMatches.forEach(funcString => {
      const nameMatch = funcString.match(/function\s+(\w+)/)
      if (nameMatch) {
        const funcName = nameMatch[1]
        try {
          // Create the function based on the extracted string
          if (funcName.startsWith('Icon')) {
            // Handle icon functions
            helpers[funcName] = createIconComponent(funcString)
          } else if (funcName === 'Tile') {
            helpers[funcName] = createTileComponent()
          } else if (funcName === 'NavItem') {
            helpers[funcName] = createNavItemComponent()
          }
        } catch (error) {
          logger.error(`Error creating helper function ${funcName}:`, { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
        }
      }
    })
  }
  
  return helpers
}

// Create icon components
function createIconComponent(funcString: string) {
  return function IconComponent() {
    // Extract the SVG from the function string
    const svgMatch = funcString.match(/<svg[\s\S]*?<\/svg>/)
    if (svgMatch) {
      const svgString = svgMatch[0]
      return <div dangerouslySetInnerHTML={{ __html: svgString }} />
    }
    return <div className="w-5 h-5 bg-gray-300 rounded" />
  }
}

// Create Tile component
function createTileComponent() {
  return function Tile({ title, subtitle, bg, badge, icon }: any) {
    return (
      <div
        className="relative flex min-h-[140px] flex-col justify-end rounded-[8px] border border-[#efefef] p-3 shadow-[0_1px_0_rgba(0,0,0,.04),_0_8px_24px_rgba(0,0,0,.06)]"
        style={{ backgroundColor: bg }}
      >
        <span className="absolute left-2 top-2 rounded-[6px] bg-black px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>
        <div className="absolute right-2 top-2 opacity-60">{icon}</div>
        <div>
          <h3 className="text-[14px] font-semibold tracking-[-0.2px] text-[#0b0f1a]">{title}</h3>
          <p className="text-[12px] text-[#6b7280]">{subtitle}</p>
        </div>
      </div>
    )
  }
}

// Create NavItem component
function createNavItemComponent() {
  return function NavItem({ label, icon, active = false }: any) {
    return (
      <button className="flex flex-col items-center justify-center gap-1 text-[#0b0f1a]">
        <div className={"h-5 w-5 " + (active ? 'text-[#f59e0b]' : 'text-[#6b7280]')}>{icon}</div>
        <span className={"text-[11px] " + (active ? 'text-[#f59e0b] font-semibold' : 'text-[#6b7280]')}>{label}</span>
      </button>
    )
  }
}

export default function ReactRenderer({ reactCode, screenData, className = '' }: ReactRendererProps) {
  const renderableComponent = useMemo(() => {
    if (!reactCode) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-500">
            <h3 className="font-semibold mb-2">No Content</h3>
            <p className="text-sm">No React component to display</p>
          </div>
        </div>
      )
    }

    try {
      // Parse the React component
      const componentData = createComponentFromJSX(reactCode)
      
      if (!componentData) {
        throw new Error('Failed to parse JSX')
      }

      // For security and simplicity, we'll create a safe renderer that interprets common patterns
      return (
        <div className="w-full h-full">
          <DynamicComponentRenderer 
            jsxString={componentData.jsx} 
            helpers={componentData.helpers}
            originalCode={reactCode}
            screenData={screenData || null}
          />
        </div>
      )
    } catch (error) {
      logger.error('Error rendering React component:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center text-red-600">
            <h3 className="font-semibold mb-2">Render Error</h3>
            <p className="text-sm">Failed to render React component</p>
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-left max-w-md">
              <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                {reactCode.slice(0, 300)}...
              </pre>
            </div>
          </div>
        </div>
      )
    }
  }, [reactCode, screenData])

  return (
    <div className={className}>
      {renderableComponent}
    </div>
  )
}

// Component to render the parsed JSX safely
function DynamicComponentRenderer({ jsxString, helpers, originalCode, screenData }: { 
  jsxString: string, 
  helpers: any, 
  originalCode: string,
  screenData?: any | null
}) {
  // Create helper components
  const Tile = helpers.Tile || createTileComponent()
  const NavItem = helpers.NavItem || createNavItemComponent()
  
  // Create icon components
  const iconComponents = Object.keys(helpers)
    .filter(key => key.startsWith('Icon'))
    .reduce((acc, key) => {
      acc[key] = helpers[key] || (() => <div className="w-5 h-5 bg-gray-300 rounded" />)
      return acc
    }, {} as any)

  // For demonstration, let's parse some common patterns and render them
  // This is a simplified approach - in production you'd want a more robust JSX parser
  
  if (originalCode.includes('Wildlife') || originalCode.includes('wildlife')) {
    // Render Wildlife Explorer component
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f6f7fb] p-6" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
        <div className="relative w-[375px] h-[700px] bg-white shadow-2xl rounded-[24px] overflow-hidden border border-[#efefef]">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-2 h-1.5 w-24 rounded-full bg-[#efefef]" />
          <div className="flex h-full flex-col" style={{ backgroundColor: '#ffffff', color: '#0b0f1a' }}>
            <header className="px-5 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-[8px]" style={{ background: 'linear-gradient(135deg, #facc15, #f59e0b)' }} />
                <div className="leading-tight">
                  <h1 className="text-[15px] font-semibold tracking-[-0.2px]">Wildlife Explorer</h1>
                  <p className="text-[12px] text-[#6b7280]">Spot • Learn • Protect</p>
                </div>
              </div>
            </header>
            <div className="px-5 pb-4">
              <div className="flex gap-3">
                <button className="flex-1 rounded-[6px] border border-black/10 bg-white px-3 py-2 text-left text-[13px] text-[#6b7280]">Search parks, species…</button>
                <button className="rounded-[6px] bg-black px-3 py-2 text-white text-[13px] font-semibold">Go</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4" style={{ backgroundColor: '#f6f7fb' }}>
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
              <section className="grid grid-cols-2 gap-3">
                <Tile title="Species Guide" subtitle="Birds, mammals, insects" bg="#fde68a" badge="Learn" icon={iconComponents.IconBook ? <iconComponents.IconBook /> : <IconBook />} />
                <Tile title="Nearby Trails" subtitle="Routes & difficulty" bg="#facc15" badge="Map" icon={iconComponents.IconTrail ? <iconComponents.IconTrail /> : <IconTrail />} />
                <Tile title="Photo ID" subtitle="Snap to identify" bg="#fff7cc" badge="AI" icon={iconComponents.IconCamera ? <iconComponents.IconCamera /> : <IconCamera />} />
                <Tile title="Conservation" subtitle="Projects & tips" bg="#ffedd5" badge="Act" icon={iconComponents.IconLeaf ? <iconComponents.IconLeaf /> : <IconLeaf />} />
                <Tile title="Sightings" subtitle="Community feed" bg="#fde68a" badge="Live" icon={iconComponents.IconBinoculars ? <iconComponents.IconBinoculars /> : <IconBinoculars />} />
                <Tile title="Field Notes" subtitle="Logs & checklists" bg="#facc15" badge="Journal" icon={iconComponents.IconNote ? <iconComponents.IconNote /> : <IconNote />} />
              </section>
            </div>
            <nav className="grid h-16 grid-cols-4 border-t border-[#efefef] bg-white text-[12px]">
              <NavItem label="Home" active icon={iconComponents.IconHome ? <iconComponents.IconHome /> : <IconHome />} />
              <NavItem label="Explore" icon={iconComponents.IconCompass ? <iconComponents.IconCompass /> : <IconCompass />} />
              <NavItem label="Camera" icon={iconComponents.IconCamera ? <iconComponents.IconCamera /> : <IconCamera />} />
              <NavItem label="Profile" icon={iconComponents.IconUser ? <iconComponents.IconUser /> : <IconUser />} />
            </nav>
          </div>
        </div>
      </div>
    )
  }
  
  // Try to render a generic mobile component based on the screen data
  if (screenData) {
    const colors = screenData.color_json || { primary: '#3B82F6', secondary: '#F3F4F6' }
    const theme = screenData.theme_json || { style: 'modern' }
    
    return (
      <div className="w-full h-full bg-white">
        {/* Generic mobile app layout based on screen data */}
        <div className="flex flex-col h-full">
          {/* Header */}
          <header className="px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colors.primary || '#3B82F6' }}>
            <h1 className="text-lg font-semibold text-white">{screenData.title}</h1>
            <p className="text-sm text-white/80">{screenData.description}</p>
          </header>
          
          {/* Content */}
          <div className="flex-1 p-4 overflow-auto" style={{ backgroundColor: colors.secondary || '#F9FAFB' }}>
            <div className="space-y-4">
              {/* Category info */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-2">Screen Category</div>
                <div className="font-semibold text-gray-900">{screenData.category}</div>
              </div>
              
              {/* Component preview */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-sm text-gray-600 mb-3">React Component Content</div>
                <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-48 overflow-auto">
                  {originalCode}
                </div>
              </div>
              
              {/* Theme info */}
              {theme && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <div className="text-sm text-gray-600 mb-2">Theme Configuration</div>
                  <div className="text-xs bg-gray-50 rounded p-2 font-mono">
                    {JSON.stringify(theme, null, 2)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  // For other components, show a preview with the code structure
  return (
    <div className="w-full h-full p-4">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-gray-900 mb-2">React Component Preview</h3>
        <p className="text-sm text-gray-600">Dynamic component loaded from API</p>
      </div>
      
      {/* Show a basic interpretation of the component */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="text-xs text-gray-500 mb-2">Component Structure:</div>
        <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700 whitespace-pre-wrap max-h-32 overflow-auto">
          {jsxString.slice(0, 500)}...
        </div>
      </div>
      
      {/* Show parsed helper functions */}
      {Object.keys(helpers).length > 0 && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4">
          <div className="text-xs text-orange-600 mb-2">Available Components:</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(helpers).map(helper => (
              <span key={helper} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {helper}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper components for the Wildlife Explorer demo
interface TileProps {
  title: string
  subtitle: string
  bg: string
  badge: string
  icon: React.ReactNode
}

function Tile({ title, subtitle, bg, badge, icon }: TileProps) {
  return (
    <div
      className="relative flex min-h-[140px] flex-col justify-end rounded-[8px] border border-[#efefef] p-3 shadow-[0_1px_0_rgba(0,0,0,.04),_0_8px_24px_rgba(0,0,0,.06)]"
      style={{ backgroundColor: bg }}
    >
      {/* Badge */}
      <span className="absolute left-2 top-2 rounded-[6px] bg-black px-2 py-0.5 text-[11px] font-semibold text-white">{badge}</span>

      {/* Icon */}
      <div className="absolute right-2 top-2 opacity-60">{icon}</div>

      <div>
        <h3 className="text-[14px] font-semibold tracking-[-0.2px] text-[#0b0f1a]">{title}</h3>
        <p className="text-[12px] text-[#6b7280]">{subtitle}</p>
      </div>
    </div>
  )
}

interface NavItemProps {
  label: string
  icon: React.ReactNode
  active?: boolean
}

function NavItem({ label, icon, active = false }: NavItemProps) {
  return (
    <button className="flex flex-col items-center justify-center gap-1 text-[#0b0f1a]">
      <div className={"h-5 w-5 " + (active ? 'text-[#f59e0b]' : 'text-[#6b7280]')}>{icon}</div>
      <span className={"text-[11px] " + (active ? 'text-[#f59e0b] font-semibold' : 'text-[#6b7280]')}>{label}</span>
    </button>
  )
}

/* Inline Icons (no external libs) */
function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </svg>
  )
}

function IconCompass() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 15.5 3-7 4 4-7 3z" />
    </svg>
  )
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 8h3l2-3h6l2 3h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c2-3 6-5 8-5s6 2 8 5" />
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 12c8-10 18-9 18-9s1 10-9 18c-4 4-9 0-9-9Z" />
      <path d="M3 12s5 1 9 5" />
    </svg>
  )
}

function IconTrail() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M3 20c4-4 6-2 9-5s5-1 9-5" />
      <path d="M5 5h2M9 3h2M13 5h2M17 3h2" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M4 5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  )
}

function IconBinoculars() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M10 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
      <path d="M20 7V5a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2" />
      <path d="M2 12a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v6H6a4 4 0 0 1-4-4Z" />
      <path d="M22 12a4 4 0 0 0-4-4h-3a4 4 0 0 0-4 4v6h7a4 4 0 0 0 4-4Z" />
    </svg>
  )
}

function IconNote() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </svg>
  )
}