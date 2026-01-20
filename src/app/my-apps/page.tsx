'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Clock, Dumbbell, ChefHat, Heart, Globe, TrendingUp, Plane, Menu, X, ChevronDown, LogOut, Loader2, AlertCircle, Settings, Hammer, Eye, Trash2, CreditCard } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import Footer from '@/components/layout/Footer'
import { LogoutConfirmationModal, DeleteAppModal } from '@/components/modals'
import type { User } from '@/types'
import { hashId } from '@/lib/url-hash'

interface App {
  id: number
  createdAt: string
  updatedAt: string
  deletedAt: string | null
  app_name: string
  app_idea: string
  vertical_id?: number | null
  theme_id?: string | null
  status: string
  userId: number
  screens: Array<{
    id: number
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    step: number
    category: string
    title: string
    description: string
    html_page: string
    color_json: {
      primary?: string
      secondary?: string
      [key: string]: any
    }
    font_json: {
      family?: string
      [key: string]: any
    }
    theme_json: {
      style?: string
      [key: string]: any
    }
    appId: number
  }>
}

export default function MyApps() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement | null>(null)
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appToDelete, setAppToDelete] = useState<App | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [apps, setApps] = useState<App[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuthStatus = useCallback(() => {
    const accessToken = localStorage.getItem('access_token')
    const userData = localStorage.getItem('user')
    
    if (accessToken && userData) {
      setIsAuthenticated(true)
      setUser(JSON.parse(userData))
    } else {
      // Redirect to home if not authenticated
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  // Close user dropdown when clicking outside (desktop)
  useEffect(() => {
    if (!showUserMenu) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node | null
      if (!target) return

      const menuEl = userMenuRef.current
      const buttonEl = userMenuButtonRef.current

      if (menuEl && menuEl.contains(target)) return
      if (buttonEl && buttonEl.contains(target)) return

      setShowUserMenu(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const fetchApps = useCallback(async () => {
    const accessToken = localStorage.getItem('access_token')
    
    if (!accessToken) {
      setError('No access token found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await apiService.getApps()

      if (response.status === 401) {
        // Token is invalid or expired - sign out and redirect to home
        logger.warn('Token expired or invalid, signing out user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
        setUser(null)
        router.push('/')
        return
      }

      if (response.status === 403) {
        setError('You do not have permissions to access this feature')
        setApps([])
        return
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch apps: ${response.status}`)
      }

      const appsData: App[] = response.data
      setApps(appsData)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.error('Error fetching apps:', { error: message, stack: error instanceof Error ? error.stack : undefined })
      // Distinguish between timeout and cancellation vs other errors
      if (message?.toLowerCase().includes('timeout')) {
        setError('Request timeout after 15000ms')
      } else if (message?.toLowerCase().includes('cancelled') || message?.toLowerCase().includes('canceled')) {
        setError('Request was cancelled. Please retry.')
      } else {
        setError(message || 'Failed to fetch apps')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (isAuthenticated) {
      fetchApps()
    }
  }, [isAuthenticated, fetchApps])

  const signOut = async () => {
    try {
      const accessToken = localStorage.getItem('access_token')
      if (accessToken) {
        const logoutPromise = apiService.logout()
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Logout timeout')), 3000))
        await Promise.race([logoutPromise, timeoutPromise]).catch(() => {})
      }
    } catch {}
    try {
      const { clearOwnerAuthData, clearStaffAuthData } = await import('@/lib/auth-utils')
      clearOwnerAuthData()
      clearStaffAuthData()
    } catch {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('userApiKey')
      localStorage.removeItem('appSecretKey')
      // Clear merchant panel section keys
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('merchant-panel-section-')) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    }
    setIsAuthenticated(false)
    setUser(null)
    setShowUserMenu(false)
    setIsMobileMenuOpen(false)
    try { router.replace('/') } catch {}
    setTimeout(() => { if (typeof window !== 'undefined' && window.location) window.location.replace('/') }, 50)
  }

  const handleLogout = () => {
    // Open confirmation modal first
    setShowUserMenu(false)
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => {
    // Kept for modal usages. Also navigate away.
    setIsAuthenticated(false)
    setUser(null)
    try { router.replace('/') } catch {}
    setTimeout(() => { if (typeof window !== 'undefined' && window.location) window.location.replace('/') }, 50)
  }

  const handleDeleteApp = async () => {
    if (!appToDelete) return

    try {
      const response = await apiService.deleteApp(appToDelete.id)

      if (response.ok) {
        // Remove the app from the list
        setApps(apps.filter(app => app.id !== appToDelete.id))
        setAppToDelete(null)
      } else {
        // Show error message
        const errorMessage = response.data?.message || 'Failed to delete app'
        alert(errorMessage)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while deleting the app'
      alert(message)
    }
  }

  const getUserInitials = (user: User | null) => {
    if (!user) return 'U'
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getAppIcon = (appName: string, appIdea: string) => {
    const text = (appName + ' ' + appIdea).toLowerCase()
    
    if (text.includes('fitness') || text.includes('health') || text.includes('workout') || text.includes('exercise')) return Dumbbell
    if (text.includes('food') || text.includes('recipe') || text.includes('cook') || text.includes('chef')) return ChefHat
    if (text.includes('pet') || text.includes('care') || text.includes('heart') || text.includes('medical')) return Heart
    if (text.includes('language') || text.includes('learn') || text.includes('education') || text.includes('global')) return Globe
    if (text.includes('finance') || text.includes('money') || text.includes('invest') || text.includes('wealth')) return TrendingUp
    if (text.includes('travel') || text.includes('trip') || text.includes('journey') || text.includes('tour')) return Plane
    
    // Default icon
    return Globe
  }

  const getAppStatus = (app: App) => {
    switch (app.status) {
      case 'published':
        return 'Production'
      case 'draft':
      default:
        return 'In Development'
    }
  }

  const getAppCategory = (app: App) => {
    // Category based on app name/idea
    const text = (app.app_name + ' ' + app.app_idea).toLowerCase()
    if (text.includes('fitness') || text.includes('health')) return 'Health & Fitness'
    if (text.includes('food') || text.includes('recipe') || text.includes('cook')) return 'Food & Cooking'
    if (text.includes('education') || text.includes('learn')) return 'Education'
    if (text.includes('finance') || text.includes('money')) return 'Finance'
    if (text.includes('travel') || text.includes('trip')) return 'Travel & Tourism'
    if (text.includes('test')) return 'Test App'
    if (text.includes('default')) return 'Default App'

    return 'Mobile App'
  }

  const formatLastUpdated = (updatedAt: string) => {
    const now = new Date()
    const updated = new Date(updatedAt)
    const diffInSeconds = Math.floor((now.getTime() - updated.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
    return `${Math.floor(diffInSeconds / 2592000)} months ago`
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Production') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Production
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
        In Development
      </span>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  const totalApps = apps.length
  const productionApps = apps.filter(app => getAppStatus(app) === 'Production').length
  const developmentApps = apps.filter(app => getAppStatus(app) === 'In Development').length

  return (
    <>
    <div className="bg-white min-h-screen flex flex-col">
      {/* Simplified Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/50 backdrop-blur-md border-b border-orange-100/50 px-4 md:px-6 py-1.5 md:py-2 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" aria-label="Go to home" className="flex items-center group">
                <Image
                  src="/Logo-new.png"
                  alt="mobelo logo"
                  width={120}
                  height={40}
                  className="h-8 md:h-9 lg:h-10 w-auto transition-transform duration-150 group-hover:scale-105"
                />
              </Link>

              {/* Page title */}
              <div className="hidden lg:block">
                <span className="text-sm text-gray-500">My Apps</span>
              </div>
            </div>

            {/* User menu + Mobile menu button */}
            <div className="flex items-center space-x-3">
              {/* Desktop User menu */}
              <div className="hidden md:block relative" ref={userMenuRef}>
                <button
                  ref={userMenuButtonRef}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-md"
                >
                  <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                    {getUserInitials(user)}
                  </div>
                  <span className="text-sm">{user?.firstName || user?.email?.split('@')[0] || 'User'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                        <div className="font-medium">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                        <div className="text-gray-500 text-xs">{user?.email}</div>
                      </div>
                      <Link
                        href="/account/plan"
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Plan</span>
                      </Link>
                      <Link
                        href="/account/billing"
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Billing</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 rounded-md"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-6 py-4 space-y-4">
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="px-4 py-2 text-sm text-gray-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {getUserInitials(user)}
                    </div>
                    <div>
                      <div className="font-medium">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User'}</div>
                      <div className="text-gray-500 text-xs">{user?.email}</div>
                    </div>
                  </div>
                </div>
                <Link
                  href="/account/plan"
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  <span>Plan</span>
                </Link>
                <Link
                  href="/account/billing"
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Billing</span>
                </Link>
                <button
                  onClick={() => {signOut(); setIsMobileMenuOpen(false)}}
                  className="flex items-center space-x-2 w-full px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium transition-all duration-200 rounded-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content */}
      <main className="pt-20 md:pt-24 flex-1">
        <div className="bg-white py-6 px-4">
          <div className="max-w-6xl mx-auto">

            {/* Stats Section - moved above Apps Grid */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <div className="text-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">My App Overview</h2>
                <p className="text-gray-600 text-xs md:text-sm">Track your mobile app development progress</p>
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4 lg:gap-6">
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-orange-600">{totalApps}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">Total Apps</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-green-600">{productionApps}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">In Production</div>
                </div>
                <div className="text-center">
                  <div className="text-xl md:text-2xl font-bold text-orange-600">{developmentApps}</div>
                  <div className="text-[10px] md:text-xs text-gray-600 font-medium">In Development</div>
                </div>
              </div>
            </div>

            {/* Apps Grid */}
            <div className="mb-16">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center space-x-3">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
                    <span className="text-gray-600">Loading your apps...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load apps</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                      onClick={fetchApps}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : apps.length === 0 ? (
                <div className="text-center py-16">
                  <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No apps yet</h3>
                  <p className="text-gray-600 mb-6">Start building your first mobile app today!</p>
                  <button
                    onClick={() => router.push('/')}
                    className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Create Your First App
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
                  {apps.map((app) => {
                    const IconComponent = getAppIcon(app.app_name, app.app_idea)
                    const status = getAppStatus(app)
                    const category = getAppCategory(app)
                    const lastUpdated = formatLastUpdated(app.updatedAt)

                    return (
                      <div
                        key={app.id}
                        className="group bg-white p-4 md:p-5 lg:p-6 rounded-xl md:rounded-2xl hover:shadow-xl transition-all duration-300 text-left border border-gray-200 relative overflow-hidden hover:border-orange-200 flex flex-col h-full"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-gray-100 rounded-xl">
                            <IconComponent className="w-6 h-6 text-gray-700" />
                          </div>
                          {getStatusBadge(status)}
                        </div>
                        
                        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-orange-600 transition-colors">
                          {app.app_name}
                        </h3>
                        
                        <p className="text-gray-500 text-sm mb-3 font-medium">
                          {category}
                        </p>
                        
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-grow">
                          {app.app_idea}
                        </p>

                        <div className="flex items-center text-xs text-gray-500 mb-4">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Updated {lastUpdated}</span>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 pt-4 mt-auto">
                          <button
                            onClick={() => {
                              const hashedId = hashId(app.id)
                              console.log('[MyApps] Merchant Panel button clicked for app:', app.id)
                              console.log('[MyApps] Navigating to:', `/merchant-panel/${hashedId}`)
                              router.push(`/merchant-panel/${hashedId}`)
                            }}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-orange-600 hover:text-white transition-all duration-200 transform hover:scale-105 hover:shadow-md group"
                          >
                            <Settings className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                            <span>Merchant Panel</span>
                          </button>
                          <button
                            onClick={() => {
                              const hashedId = hashId(app.id)
                              router.push(`/app-builder?appId=${hashedId}`)
                            }}
                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-orange-600 hover:text-white transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                          >
                            <Hammer className="w-4 h-4" />
                            <span>Mobile App Builder</span>
                          </button>
                          {app.status !== 'published' && (
                            <button
                              onClick={() => {
                                setAppToDelete(app)
                                setShowDeleteModal(true)
                              }}
                              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-600 hover:text-white transition-all duration-200 transform hover:scale-105 hover:shadow-md"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Mobile App</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>

    {/* Logout Confirmation Modal */}
    <LogoutConfirmationModal
      isOpen={showLogoutModal}
      onClose={() => setShowLogoutModal(false)}
      onLogoutSuccess={signOut}
    />

    {/* Delete App Confirmation Modal */}
    <DeleteAppModal
      isOpen={showDeleteModal}
      onClose={() => {
        setShowDeleteModal(false)
        setAppToDelete(null)
      }}
      onConfirm={handleDeleteApp}
      appName={appToDelete?.app_name || ''}
    />
    </>
  )
}
