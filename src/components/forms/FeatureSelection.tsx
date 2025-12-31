'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Smartphone, CreditCard, Calendar, Users, Shield, Star, Loader2, Key, Lock, AlertCircle, Heart, Camera, MapPin, ShoppingCart, MessageCircle, Bell, Search, Settings, Music, Video, Mail, Phone, Clock, Award, Target, TrendingUp, BookOpen, Gamepad2, Zap, Headphones, Globe, Home, User, Database, BarChart3, FileText, Image, Mic, Share2, Filter, Download, Upload, Edit, Trash2, Play, Pause, Volume2, Wifi, Battery, Sun, Moon, Coffee, Car, Plane, Train, Bike, Building, Store, PlusCircle, MinusCircle, Eye, RotateCcw, RefreshCw } from 'lucide-react'
import { SigninModal } from '@/components/modals'
import { apiService } from '@/lib/api-service'

interface Feature {
  id: string
  name: string
  description: string
  structure?: string
  icon: React.ComponentType<{ className?: string }>
  recommended?: boolean
  isDefault?: boolean
}

interface APIFeatureResponse {
  category: string
  core_features: Array<{
    name: string
    description: string
    structure?: string
  }>
  bottom_navigation_features: string[]
  design_preferences: {
    image_category: string
    icon_category: string
    font_family: string
    color_theme: {
      primary: string
      secondary: string
      accent: string
    }
    theme_preference: string
    button_style: string
  }
  app_idea_one_sentence: string
  hero_image_keyword: string
}

interface FeatureSelectionProps {
  appIdea: string
  onComplete: (selectedFeatures: string[]) => void
  onBack?: () => void
  onLoadingChange?: (isLoading: boolean) => void
}

const getDefaultFeatures = (): Feature[] => {
  return [
    {
      id: 'auth',
      name: 'Signup/Login/Forgot Password',
      description: 'Complete authentication system with user registration, login, and password recovery',
      icon: Key,
      recommended: true,
      isDefault: true
    },
    {
      id: 'payment',
      name: 'Purchase Flow with Stripe',
      description: 'Secure payment processing and subscription management with Stripe integration',
      icon: CreditCard,
      recommended: true,
      isDefault: true
    }
  ]
}

const getIconForFeature = (featureName: string): React.ComponentType<{ className?: string }> => {
  const name = featureName.toLowerCase()
  
  // Authentication & Security
  if (name.includes('signup') || name.includes('login') || name.includes('auth') || name.includes('password') || name.includes('sign in') || name.includes('sign up')) return Key
  if (name.includes('security') || name.includes('privacy') || name.includes('protection')) return Shield
  if (name.includes('permission') || name.includes('access') || name.includes('role')) return Lock
  
  // Payment & Commerce
  if (name.includes('payment') || name.includes('purchase') || name.includes('stripe') || name.includes('billing') || name.includes('subscription')) return CreditCard
  if (name.includes('shop') || name.includes('store') || name.includes('cart') || name.includes('buy') || name.includes('sell')) return ShoppingCart
  if (name.includes('marketplace') || name.includes('merchant') || name.includes('vendor')) return Store
  
  // Communication & Social
  if (name.includes('chat') || name.includes('message') || name.includes('conversation') || name.includes('dm')) return MessageCircle
  if (name.includes('social') || name.includes('community') || name.includes('friend') || name.includes('follow')) return Users
  if (name.includes('notification') || name.includes('alert') || name.includes('push')) return Bell
  if (name.includes('email') || name.includes('mail')) return Mail
  if (name.includes('phone') || name.includes('call') || name.includes('contact')) return Phone
  if (name.includes('share') || name.includes('sharing')) return Share2
  
  // Media & Content
  if (name.includes('photo') || name.includes('camera') || name.includes('picture') || name.includes('image')) return Camera
  if (name.includes('video') || name.includes('movie') || name.includes('film')) return Video
  if (name.includes('music') || name.includes('audio') || name.includes('sound')) return Music
  if (name.includes('record') || name.includes('voice') || name.includes('microphone')) return Mic
  if (name.includes('gallery') || name.includes('album')) return Image
  if (name.includes('podcast') || name.includes('headphone')) return Headphones
  
  // Health & Fitness
  if (name.includes('workout') || name.includes('exercise') || name.includes('fitness') || name.includes('gym')) return Target
  if (name.includes('health') || name.includes('medical') || name.includes('doctor') || name.includes('wellness')) return Heart
  if (name.includes('nutrition') || name.includes('calorie') || name.includes('diet') || name.includes('food')) return Coffee
  
  // Navigation & Location
  if (name.includes('map') || name.includes('location') || name.includes('gps') || name.includes('navigation')) return MapPin
  if (name.includes('travel') || name.includes('trip') || name.includes('journey')) return Plane
  if (name.includes('transport') || name.includes('vehicle') || name.includes('car')) return Car
  if (name.includes('bike') || name.includes('cycling')) return Bike
  if (name.includes('train') || name.includes('metro')) return Train
  
  // Productivity & Organization
  if (name.includes('calendar') || name.includes('schedule') || name.includes('appointment') || name.includes('event')) return Calendar
  if (name.includes('task') || name.includes('todo') || name.includes('reminder')) return Clock
  if (name.includes('note') || name.includes('document') || name.includes('file')) return FileText
  if (name.includes('setting') || name.includes('config') || name.includes('preference')) return Settings
  if (name.includes('search') || name.includes('find') || name.includes('lookup')) return Search
  if (name.includes('filter') || name.includes('sort') || name.includes('organize')) return Filter
  
  // Analytics & Reports
  if (name.includes('analytics') || name.includes('chart') || name.includes('graph') || name.includes('stats')) return BarChart3
  if (name.includes('report') || name.includes('dashboard') || name.includes('insight')) return TrendingUp
  if (name.includes('data') || name.includes('database') || name.includes('storage')) return Database
  if (name.includes('progress') || name.includes('track') || name.includes('monitor')) return Target
  
  // Gaming & Entertainment
  if (name.includes('game') || name.includes('gaming') || name.includes('play')) return Gamepad2
  if (name.includes('entertainment') || name.includes('fun') || name.includes('leisure')) return Star
  if (name.includes('book') || name.includes('reading') || name.includes('education')) return BookOpen
  
  // Utilities & Tools
  if (name.includes('download') || name.includes('import')) return Download
  if (name.includes('upload') || name.includes('export')) return Upload
  if (name.includes('edit') || name.includes('modify') || name.includes('update')) return Edit
  if (name.includes('delete') || name.includes('remove') || name.includes('trash')) return Trash2
  if (name.includes('wifi') || name.includes('internet') || name.includes('connection')) return Wifi
  if (name.includes('battery') || name.includes('power') || name.includes('energy')) return Battery
  if (name.includes('theme') || name.includes('appearance') || name.includes('dark') || name.includes('light')) return Sun
  
  // Business & Professional
  if (name.includes('business') || name.includes('corporate') || name.includes('office')) return Building
  if (name.includes('award') || name.includes('achievement') || name.includes('badge')) return Award
  if (name.includes('user') || name.includes('profile') || name.includes('account')) return User
  if (name.includes('globe') || name.includes('world') || name.includes('international')) return Globe
  
  // Home & Lifestyle
  if (name.includes('home') || name.includes('house') || name.includes('overview') || name.includes('dashboard') || name.includes('main')) return Home
  if (name.includes('landing') || name.includes('welcome') || name.includes('intro')) return Smartphone
  
  // Default fallback
  return Star
}

export default function FeatureSelection({ appIdea, onComplete, onBack, onLoadingChange }: FeatureSelectionProps) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSigninModal, setShowSigninModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        setIsLoading(true)
        onLoadingChange?.(true)
        setError(null)
        
        // Call the get-features API
        const response = await apiService.getFeatures(appIdea)
        
        if (response.ok && response.data) {
          const apiData = response.data as APIFeatureResponse
          
          // Get default features (auth + payment)
          const defaultFeatures = getDefaultFeatures()
          
          // Convert API core features to our Feature interface
          const coreFeatures: Feature[] = apiData.core_features.map((feature, index) => ({
            id: `core_${index}`,
            name: feature.name,
            description: feature.description,
            structure: feature.structure,
            icon: getIconForFeature(feature.name),
            recommended: index < 2 // Mark first 2 as recommended
          }))
          
          // Combine default + core features
          const allFeatures = [...defaultFeatures, ...coreFeatures]
          setFeatures(allFeatures)
          
          // Select first 4 features by default
          const defaultSelectedIds = allFeatures.slice(0, 4).map(f => f.id)
          setSelectedFeatures(defaultSelectedIds)
          
        } else {
          throw new Error('Failed to fetch features')
        }
      } catch (error) {
        logger.error('Error fetching features:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
        setError('Failed to load features. Please try again.')
        
        // Fallback to default features only
        const defaultFeatures = getDefaultFeatures()
        setFeatures(defaultFeatures)
        setSelectedFeatures(defaultFeatures.map(f => f.id))
      } finally {
        setIsLoading(false)
        onLoadingChange?.(false)
      }
    }

    if (appIdea) {
      fetchFeatures()
    }
  }, [appIdea, onLoadingChange])

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    )
  }

  const handleContinue = async () => {
    if (selectedFeatures.length === 0) {
      alert('Please select at least one feature')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Get feature names for the selected IDs
      const selectedFeatureNames = features
        .filter(f => selectedFeatures.includes(f.id))
        .map(f => f.name)
      
      await onComplete(selectedFeatureNames)
    } catch (error) {
      logger.error('Error completing feature selection:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      alert('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryFetch = () => {
    setError(null)
    window.location.reload() // Simple retry by reloading
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-orange-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Features</h2>
          <p className="text-gray-600">Creating personalized features for your app...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-600" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Features</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={retryFetch}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-6 px-4 min-h-[calc(100vh-80px)]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-sm font-medium mb-4">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
            AI-Powered Selection
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Choose Your App Features
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto mb-4">
            We've curated features based on your app idea. Select the ones you want to include.
          </p>
          <div className="max-w-xl mx-auto p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600 mb-1 font-bold">Your App Idea</p>
            <p className="text-sm text-gray-900">{appIdea}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {features.map((feature) => {
            const isSelected = selectedFeatures.includes(feature.id)
            const IconComponent = feature.icon

            return (
              <div
                key={feature.id}
                onClick={() => toggleFeature(feature.id)}
                className={`
                  group relative p-4 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                  ${isSelected 
                    ? 'bg-orange-50/70 border border-orange-200 shadow-sm' 
                    : 'bg-white border border-gray-200 hover:border-gray-300'
                  }
                  ${feature.recommended ? 'ring-1 ring-blue-200' : ''}
                `}
              >
                {feature.recommended && (
                  <div className="absolute -top-2 -right-2 bg-orange-50 border border-orange-200 rounded-full p-1.5 shadow-sm">
                    <Star className="w-3 h-3 text-blue-400 fill-blue-400" />
                  </div>
                )}
                
                <div className="flex items-start space-x-3">
                  <div className={`
                    p-2.5 rounded-lg flex-shrink-0 transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-100 shadow-sm' 
                      : 'bg-gray-100 group-hover:bg-orange-50'
                    }
                  `}>
                    <IconComponent className={`w-5 h-5 transition-colors duration-200 ${
                      isSelected ? 'text-orange-600' : 'text-gray-600 group-hover:text-blue-500'
                    }`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-semibold text-base transition-colors duration-200 ${
                        isSelected ? 'text-slate-900' : 'text-gray-900'
                      }`}>
                        {feature.name}
                      </h3>
                      <div className={`
                        w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-blue-400 bg-blue-400' 
                          : 'border-gray-300 bg-white group-hover:border-orange-300'
                        }
                      `}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    
                    <p className={`text-sm leading-relaxed transition-colors duration-200 ${
                      isSelected ? 'text-orange-700' : 'text-gray-600'
                    }`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {onBack && (
                <button
                  onClick={() => {
                    // Clear local storage
                    localStorage.removeItem('mobile_app_idea')
                    localStorage.removeItem('app_idea')
                    localStorage.removeItem('selected_features')
                    localStorage.removeItem('appSummaryData')
                    // Navigate to home page
                    window.location.href = '/'
                  }}
                  className="text-gray-600 hover:text-orange-600 font-medium transition-colors duration-200 text-sm"
                >
                  ← Back to App Idea
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {selectedFeatures.length} feature{selectedFeatures.length !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // Clear local storage
                  localStorage.removeItem('mobile_app_idea')
                  localStorage.removeItem('app_idea')
                  localStorage.removeItem('selected_features')
                  localStorage.removeItem('appSummaryData')
                  // Navigate to home page
                  window.location.href = '/'
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm flex items-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start Again New
              </button>
              <button
                onClick={() => {
                  // Refresh the page to regenerate features
                  window.location.reload()
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-orange-300 text-orange-700 bg-orange-50 rounded-lg hover:bg-blue-100 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Features
              </button>
              <button
                onClick={handleContinue}
                disabled={isSubmitting || selectedFeatures.length === 0}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm hover:shadow-md flex items-center text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating App...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Continue to Preview
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSigninModal && (
        <SigninModal 
          isOpen={showSigninModal}
          onClose={() => setShowSigninModal(false)}
          onSigninSuccess={() => {
            setShowSigninModal(false)
            handleContinue()
          }}
        />
      )}
    </div>
  )
}