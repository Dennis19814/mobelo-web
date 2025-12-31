'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  LayoutDashboard, Package, DollarSign, FolderTree, ShoppingCart, 
  Activity, Settings, Menu, X, ChevronDown, LogOut, ArrowLeft,
  Loader2, AlertCircle 
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { LogoutConfirmationModal } from '@/components/modals'
import { MerchantSidebar, MerchantHeader } from '@/components/merchant'
import type { User } from '@/types'
import { unhashId, hashId } from '@/lib/url-hash'

// Lazy load sections for better performance with preload capability
const ProductsSectionImport = () => import('@/components/merchant/sections/ProductsSection')
const DashboardSection = lazy(() => import('@/components/merchant/sections/DashboardSection'))
const ProductsSection = lazy(ProductsSectionImport)
const CategoriesSection = lazy(() => import('@/components/merchant/sections/CategoriesSection'))
const OrdersSection = lazy(() => import('@/components/merchant/sections/OrdersSection'))
const ActivitySection = lazy(() => import('@/components/merchant/sections/ActivitySection'))
const SettingsSection = lazy(() => import('@/components/merchant/sections/SettingsSection'))
const InventorySection = lazy(() => import('@/components/merchant/sections/InventorySection'))
const ReviewsSection = lazy(() => import('@/components/merchant/sections/ReviewsSection'))
const BrandsSection = lazy(() => import('@/components/merchant/sections/BrandsSection'))
const AppUsersSection = lazy(() => import('@/components/merchant/sections/AppUsersSection'))
const TaxCategoriesSection = lazy(() => import('@/components/merchant/sections/TaxCategoriesSection'))
const TaxRulesSection = lazy(() => import('@/components/merchant/sections/TaxRulesSection'))
const CouponsSection = lazy(() => import('@/components/merchant/sections/CouponsSection'))
const TeamSection = lazy(() => import('@/components/merchant/sections/TeamSection'))
const RolesSection = lazy(() => import('@/components/merchant/sections/RolesSection'))
const HelpCenterSection = lazy(() => import('@/components/merchant/sections/HelpCenterSection'))
const HelpFaqSection = lazy(() => import('@/components/merchant/sections/HelpFaqSection'))
const HelpTutorialsSection = lazy(() => import('@/components/merchant/sections/HelpTutorialsSection'))

interface App {
  id: number
  app_name: string
  app_idea: string
  status: string
  userId: number
  appSecretKey?: string
  logoUrl?: string
  logoMetadata?: {
    original: string
    sizes: {
      [key: string]: string
    }
    cdnUrl?: string
    uploadedAt: Date
  }
}

interface ApiKeysData {
  userApiKey: string | null
  apps: Array<{
    id: number
    app_name: string
    appSecretKey: string | null
    status: string
  }>
}

type SectionType = 'dashboard' | 'products' | 'product-reviews' | 'brands' | 'inventory' | 'categories' | 'orders' | 'app-users' | 'activity' | 'settings' | 'taxes' | 'tax-categories' | 'tax-rules' | 'coupons' | 'team' | 'team-members' | 'team-roles' | 'help-center' | 'help-faq' | 'help-tutorials'

export default function MerchantPanel() {
  const params = useParams()
  const router = useRouter()
  const hashedId = params.id as string
  const appId = unhashId(hashedId)

  // Redirect to home if appId is invalid
  useEffect(() => {
    if (hashedId && appId === null) {
      console.error('[MerchantPanel] Invalid hashed appId, redirecting to home')
      router.push('/')
    }
  }, [hashedId, appId, router])
  
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [apps, setApps] = useState<App[]>([])
  const [currentApp, setCurrentApp] = useState<App | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKeysData | null>(null)

  // Preload ProductsSection to prevent flash when clicking Product Catalog
  useEffect(() => {
    // Preload the component to avoid flash on first click
    ProductsSectionImport()
  }, [])

  // Check authentication status (supports both app owner and staff login)
  // This runs ONLY on initial mount - not on every re-render
  useEffect(() => {
    // Check for app owner authentication
    const ownerAccessToken = localStorage.getItem('access_token')
    const ownerUserData = localStorage.getItem('user')

    // Check for staff authentication
    const staffAccessToken = localStorage.getItem('staff_access_token')
    const staffUserData = localStorage.getItem('staff_user')

    console.log('Auth check (initial mount):', {
      ownerAccessToken: !!ownerAccessToken,
      ownerUserData: !!ownerUserData,
      staffAccessToken: !!staffAccessToken,
      staffUserData: !!staffUserData
    })

    if (ownerAccessToken && ownerUserData) {
      // App owner login
      setIsAuthenticated(true)
      setUser(JSON.parse(ownerUserData))
    } else if (staffAccessToken && staffUserData) {
      // Staff login
      setIsAuthenticated(true)
      setUser(JSON.parse(staffUserData))
    } else {
      // No valid authentication found - redirect to home
      console.log('No valid auth found, redirecting to /')
      router.push('/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Empty dependency array - only runs on mount

  // Fetch API keys for authentication (only for app owners, not staff)
  const fetchApiKeys = useCallback(async () => {
    const ownerAccessToken = localStorage.getItem('access_token')
    const staffAccessToken = localStorage.getItem('staff_access_token')
    const staffAppData = localStorage.getItem('staff_app')

    // Staff users: use app data from staff_app localStorage
    if (staffAccessToken && staffAppData) {
      try {
        const staffApp = JSON.parse(staffAppData)
        // Create a mock API keys response for staff users
        const staffApiKeys = {
          userApiKey: null, // Staff don't need user API key
          apps: [{
            id: staffApp.id,
            app_name: staffApp.app_name,
            appSecretKey: staffApp.appSecretKey || null,
            status: staffApp.status
          }]
        }
        setApiKeys(staffApiKeys)
        return staffApiKeys
      } catch (error) {
        logger.error('Error parsing staff app data:', { error: error instanceof Error ? error.message : String(error) })
        return null
      }
    }

    // App owners: fetch API keys from backend
    if (!ownerAccessToken) {
      return null
    }

    try {
      const response = await apiService.getApiKeys()

      logger.debug('API Keys Response:', { value: response })

      if (response.ok && response.data) {
        logger.debug('API Keys Data:', { value: response.data })
        setApiKeys(response.data)
        return response.data
      }

      // If API call failed but we can still proceed, set empty API keys
      logger.warn('Failed to fetch API keys, proceeding with limited functionality')
      setApiKeys({ userApiKey: null, apps: [] })
      return null
    } catch (error) {
      logger.error('Error fetching API keys:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      // On error, set empty API keys to allow page to load
      logger.warn('Setting empty API keys due to fetch error')
      setApiKeys({ userApiKey: null, apps: [] })
      return null
    }
  }, [])

  // Fetch all apps for the dropdown (supports both app owner and staff)
  const fetchApps = useCallback(async () => {
    const ownerAccessToken = localStorage.getItem('access_token')
    const staffAccessToken = localStorage.getItem('staff_access_token')
    const staffAppData = localStorage.getItem('staff_app')

    if (!ownerAccessToken && !staffAccessToken) {
      setError('No access token found')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      let appsData: App[] = []

      if (staffAccessToken && staffAppData) {
        // Staff member: Use the single app from staff_app
        const staffApp = JSON.parse(staffAppData)
        appsData = [staffApp]
      } else if (ownerAccessToken) {
        // App owner: Fetch all apps
        const response = await apiService.getApps()

        if (response.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          router.push('/')
          return
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch apps: ${response.status}`)
        }

        appsData = response.data
      }

      setApps(appsData)

      // Find and set the current app
      const selectedApp = appsData.find(app => app.id === appId)
      if (selectedApp) {
        setCurrentApp(selectedApp)
      } else {
        setError('App not found or you don\'t have access to this app')
      }
    } catch (error) {
      logger.error('Error fetching apps:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setError(error instanceof Error ? error.message : 'Failed to fetch apps')
    } finally {
      setLoading(false)
    }
  }, [appId, router])

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch both apps and API keys
      Promise.all([
        fetchApps(),
        fetchApiKeys()
      ]).then(([_, apiKeysData]) => {
        // Store API keys in localStorage for components to use
        if (apiKeysData) {
          // Store user API key
          if (apiKeysData.userApiKey) {
            localStorage.setItem('userApiKey', apiKeysData.userApiKey)
            logger.debug('Stored userApiKey in localStorage')
          }

          // Find and store current app's secret key
          const currentAppKeys = apiKeysData.apps.find((app: any) => Number(app.id) === Number(appId))
          if (currentAppKeys?.appSecretKey) {
            localStorage.setItem('appSecretKey', currentAppKeys.appSecretKey)
            logger.debug('API Keys stored in localStorage:', {
              userApiKey: apiKeysData.userApiKey ? 'Set' : 'Missing',
              appSecretKey: currentAppKeys.appSecretKey ? 'Set' : 'Missing',
              appId: appId
            })
          } else {
            logger.debug('No app secret key found for appId:', {
              appId,
              availableApps: apiKeysData.apps.map((a: any) => a.id)
            })
          }
        }
      }).catch(error => {
        logger.error('Error fetching apps or API keys:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      })
    }
  }, [isAuthenticated, fetchApps, fetchApiKeys, appId])

  const handleAppSwitch = (newAppId: string) => {
    const hashedId = hashId(newAppId)
    router.push(`/merchant-panel/${hashedId}`)
  }

  const handleLogoutConfirm = () => {
    setIsAuthenticated(false)
    setUser(null)
  }

  if (!isAuthenticated) {
    return null
  }

  // Check if this is a staff login (staff don't need API keys)
  const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false

  // Show loading until we have API keys (for owner login) or staff token is present
  if (loading || (!hasStaffToken && !apiKeys)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          <span className="text-gray-600">Loading Merchant Panel...</span>
        </div>
      </div>
    )
  }

  if (error || !currentApp) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Error</h3>
          <p className="text-gray-600 mb-4">{error || 'Unable to access this app'}</p>
          <button
            onClick={() => router.push('/my-apps')}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to My Apps
          </button>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        // Pass API keys so dashboard waits for auth readiness
        const dashboardAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const dashboardFinalAppSecretKey = dashboardAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <DashboardSection
          app={currentApp}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={dashboardFinalAppSecretKey || undefined}
          onSectionChange={(section) => setActiveSection(section as SectionType)}
        />
      case 'products':
        const appFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const finalAppSecretKey = appFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <ProductsSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={finalAppSecretKey || undefined}
        />
      case 'product-reviews':
        // Use same API key logic as products section
        const reviewsAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const reviewsFinalAppSecretKey = reviewsAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <ReviewsSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={reviewsFinalAppSecretKey || undefined}
        />
      case 'brands':
        const brandsAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const brandsFinalAppSecretKey = brandsAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <BrandsSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={brandsFinalAppSecretKey || ''}
        />
      case 'inventory':
        // Use same API key logic as products section
        const inventoryAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const inventoryFinalAppSecretKey = inventoryAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <InventorySection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={inventoryFinalAppSecretKey || undefined}
        />
      case 'categories':
        // Use same API key logic as other sections
        const categoriesAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const categoriesFinalAppSecretKey = categoriesAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <CategoriesSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={categoriesFinalAppSecretKey || ''}
        />
      case 'orders':
        // Use same API key logic as other sections
        const ordersAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const ordersFinalAppSecretKey = ordersAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <OrdersSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={ordersFinalAppSecretKey || undefined}
        />
      case 'app-users':
        // Use same API key logic as other sections
        const usersAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const usersFinalAppSecretKey = usersAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <AppUsersSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={usersFinalAppSecretKey || ''}
        />
      case 'tax-categories':
        // Use same API key logic as other sections
        const taxCategoriesAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const taxCategoriesFinalAppSecretKey = taxCategoriesAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <TaxCategoriesSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={taxCategoriesFinalAppSecretKey || ''}
        />
      case 'tax-rules':
        // Use same API key logic as other sections
        const taxRulesAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const taxRulesFinalAppSecretKey = taxRulesAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <TaxRulesSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={taxRulesFinalAppSecretKey || ''}
        />
      case 'coupons':
        // Use same API key logic as other sections
        const couponsAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const couponsFinalAppSecretKey = couponsAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <CouponsSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={couponsFinalAppSecretKey || ''}
        />
      case 'team-members':
        return <TeamSection appId={currentApp.id} />
      case 'team-roles':
        return <RolesSection />
      case 'help-center':
        return <HelpCenterSection onNavigate={(section) => setActiveSection(section as SectionType)} />
      case 'help-faq':
        return <HelpFaqSection onNavigate={(section) => setActiveSection(section as SectionType)} />
      case 'help-tutorials':
        return <HelpTutorialsSection onNavigate={(section) => setActiveSection(section as SectionType)} />
      case 'activity':
        return <ActivitySection appId={currentApp.id} />
      case 'settings':
        // Use same API key logic as other sections
        const settingsAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const settingsFinalAppSecretKey = settingsAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <SettingsSection
          app={currentApp}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={settingsFinalAppSecretKey || ''}
          onAppUpdated={(patch) => {
            // Update currentApp state
            setCurrentApp(prev => prev ? ({ ...prev, ...patch } as any) : prev)
            // Also update the local apps list so dropdown stays in sync
            setApps(prev => prev.map(a => a.id === currentApp.id ? ({ ...a, ...patch } as any) : a))
            // If staff session, keep localStorage 'staff_app' aligned
            try {
              const staffAppData = typeof window !== 'undefined' ? localStorage.getItem('staff_app') : null
              if (staffAppData) {
                const staffApp = JSON.parse(staffAppData)
                if (staffApp && staffApp.id === currentApp.id) {
                  localStorage.setItem('staff_app', JSON.stringify({ ...staffApp, ...patch }))
                }
              }
            } catch { /* noop */ }
          }}
        />
      default:
        return <DashboardSection app={currentApp} onSectionChange={(section) => setActiveSection(section as SectionType)} />
    }
  }

  return (
    <>
      <div className="merchant-panel-compact min-h-screen bg-gray-50">
        {/* Header - fixed at top */}
        <MerchantHeader
          currentApp={currentApp}
          user={user}
          onLogout={() => setShowLogoutModal(true)}
        />

        {/* Main Layout Container - responsive flex */}
        <div className="flex pt-16">
          {/* Sidebar - fixed position, responsive width */}
          <MerchantSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            currentApp={currentApp}
            apps={apps}
            onAppSwitch={handleAppSwitch}
          />

          {/* Main Content Area - responsive margin and padding */}
          <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)]">
            <div className="px-3 sm:px-4 md:px-4 lg:px-5 py-3 md:py-4 lg:py-5 max-w-7xl mx-auto">
              <Suspense fallback={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              }>
                {renderSection()}
              </Suspense>
            </div>
          </main>
        </div>

        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onLogoutSuccess={handleLogoutConfirm}
      />
    </>
  )
}
