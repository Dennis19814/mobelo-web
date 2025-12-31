'use client'

import Image from 'next/image'
import Link from 'next/link'

interface AppHeaderProps {
  title?: string
  showAppName?: boolean
  appName?: string
  children?: React.ReactNode
}

export default function AppHeader({ 
  title = "mobelo.dev", 
  showAppName = false, 
  appName,
  children 
}: AppHeaderProps) {

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-20 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Logo */}
          <Link href="/" aria-label="Go to home" className="flex items-center space-x-3 group">
            <Image 
              src="/logo.png" 
              alt="mobelo logo" 
              width={40} 
              height={40}
              className="w-10 h-10 transition-transform duration-150 group-hover:scale-105"
            />
            <div className="text-2xl font-bold text-gray-800 font-logo">
              {title}
            </div>
          </Link>
          
          {/* Center - App Name (if provided) */}
          {showAppName && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <div className="text-gray-900 text-lg font-semibold px-2 py-1">
                {appName || 'My App'}
              </div>
            </div>
          )}

          {/* Right Side - Children */}
          <div className="flex items-center space-x-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
