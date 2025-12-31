'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FeaturesNavigation from '@/components/layout/FeaturesNavigation'
import { FeatureSelection } from '@/components/forms'
import { apiService } from '@/lib/api-service'
import Script from 'next/script'

function FeaturesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [appIdea, setAppIdea] = useState<string>('')
  const [isFeatureLoading, setIsFeatureLoading] = useState(true)

  useEffect(() => {
    // Get app idea from URL params or localStorage
    const ideaFromParams = searchParams.get('idea')
    const ideaFromStorage = localStorage.getItem('mobile_app_idea') || localStorage.getItem('app_idea')
    
    if (ideaFromParams) {
      setAppIdea(ideaFromParams)
      // Store in both keys for compatibility
      localStorage.setItem('mobile_app_idea', ideaFromParams)
      localStorage.setItem('app_idea', ideaFromParams)
    } else if (ideaFromStorage) {
      setAppIdea(ideaFromStorage)
      // Ensure both keys are set
      localStorage.setItem('mobile_app_idea', ideaFromStorage)
      localStorage.setItem('app_idea', ideaFromStorage)
    } else {
      // If no app idea found, redirect to home page
      router.push('/')
    }
  }, [searchParams, router])

  const handleFeatureSelectionComplete = async (selectedFeatures: string[]) => {
    // Create app data similar to main page logic
    const appData = {
      title: appIdea.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' App',
      description: `A mobile application for ${appIdea.toLowerCase()}`,
      appIdea: appIdea,
      selectedFeatures: selectedFeatures,
      screens: [
        {
          id: 1,
          name: 'Welcome Screen',
          description: 'Initial onboarding screen',
          status: 'completed' as const,
          active: true
        },
        {
          id: 2,
          name: 'Main Dashboard',
          description: 'Primary app interface',
          status: 'pending' as const,
          active: false
        },
        {
          id: 3,
          name: 'Settings',
          description: 'User preferences',
          status: 'pending' as const,
          active: false
        }
      ],
      timestamp: new Date().toISOString()
    }
    
    // Store in session storage and localStorage for persistence
    sessionStorage.setItem('appSummaryData', JSON.stringify(appData))
    localStorage.setItem('selected_features', JSON.stringify(selectedFeatures))
    
    // Try to create app via API if authenticated
    const accessToken = localStorage.getItem('access_token')
    if (accessToken) {
      try {
        const response = await apiService.createApp({
          app_name: appData.title,
          app_idea: appIdea
        })

        if (response.ok) {
          const createdApp = response.data
          // Navigate to my-apps page after successful creation
          router.push('/my-apps')
          return
        }
      } catch (error) {
        logger.error('Failed to create app via API:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      }
    }
    
    // Fallback: Navigate to my-apps page
    router.push('/my-apps')
  }

  // Don't render anything until we have an app idea
  if (!appIdea) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script id="features-error-suppression" strategy="beforeInteractive">
        {`
          // Additional error suppression specifically for features page
          (function() {
            const originalConsoleError = console.error;
            const originalConsoleWarn = console.warn;
            
            console.error = function(...args) {
              const message = args.join(' ');
              if (message.includes('features') || 
                  message.includes('webpack') || 
                  message.includes('express-fte') ||
                  message.includes('frame_ant') ||
                  message.includes('local-storage') ||
                  message.includes('content-script-utils')) {
                return; // Suppress these errors
              }
              originalConsoleError.apply(this, args);
            };
            
            console.warn = function(...args) {
              const message = args.join(' ');
              if (message.includes('features') || 
                  message.includes('webpack') || 
                  message.includes('extension')) {
                return; // Suppress these warnings
              }
              originalConsoleWarn.apply(this, args);
            };
          })();
        `}
      </Script>
      <FeaturesNavigation isLoading={isFeatureLoading} />
      
      <main className="flex-1">
        <FeatureSelection
          appIdea={appIdea}
          onComplete={handleFeatureSelectionComplete}
          onLoadingChange={setIsFeatureLoading}
        />
      </main>
    </div>
  )
}

export default function FeaturesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <FeaturesContent />
    </Suspense>
  )
}