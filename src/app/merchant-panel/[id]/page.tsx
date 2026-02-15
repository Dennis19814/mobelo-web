'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
const InventoryManagementSection = lazy(() => import('@/components/merchant/sections/InventoryManagementSection'))
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
const AddProductSection = lazy(() => import('@/components/merchant/sections/AddProductSection'))
const EditProductSection = lazy(() => import('@/components/merchant/sections/EditProductSection'))
const LocationsSection = lazy(() => import('@/components/merchant/sections/LocationsSection'))
const SuppliersSection = lazy(() => import('@/components/merchant/sections/SuppliersSection'))
const PurchaseOrdersSection = lazy(() => import('@/components/merchant/sections/PurchaseOrdersSection'))
const CreatePurchaseOrderPage = lazy(() => import('@/components/merchant/sections/CreatePurchaseOrderPage'))
const EditPurchaseOrderPage = lazy(() => import('@/components/merchant/sections/EditPurchaseOrderPage'))
const ShippingZonesSection = lazy(() => import('@/components/merchant/sections/ShippingZonesSection'))
const ShippingRatesSection = lazy(() => import('@/components/merchant/sections/ShippingRatesSection'))

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

type SectionType = 'dashboard' | 'products' | 'product-reviews' | 'add-product' | 'edit-product' | 'brands' | 'inventory' | 'inventory-management' | 'categories' | 'orders' | 'app-users' | 'activity' | 'settings' | 'settings-general' | 'settings-api' | 'settings-social-auth' | 'settings-payments' | 'settings-sms' | 'settings-email' | 'settings-templates' | 'settings-appearance' | 'settings-store-origin' | 'settings-notifications' | 'taxes' | 'tax-categories' | 'tax-rules' | 'coupons' | 'shipping' | 'shipping-zones' | 'shipping-rates' | 'team' | 'team-members' | 'team-roles' | 'help-center' | 'help-faq' | 'help-tutorials' | 'purchasing' | 'locations' | 'suppliers' | 'purchase-orders' | 'create-purchase-order' | 'edit-purchase-order'

const validSections: SectionType[] = ['dashboard', 'products', 'product-reviews', 'add-product', 'edit-product', 'brands', 'inventory', 'inventory-management', 'categories', 'orders', 'app-users', 'activity', 'settings', 'settings-general', 'settings-api', 'settings-social-auth', 'settings-payments', 'settings-sms', 'settings-email', 'settings-templates', 'settings-appearance', 'settings-store-origin', 'settings-notifications', 'taxes', 'tax-categories', 'tax-rules', 'coupons', 'shipping', 'shipping-zones', 'shipping-rates', 'team', 'team-members', 'team-roles', 'help-center', 'help-faq', 'help-tutorials', 'purchasing', 'locations', 'suppliers', 'purchase-orders', 'create-purchase-order', 'edit-purchase-order']

export default function MerchantPanel() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
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
  
  // Initialize activeSection - will be set from URL/localStorage in useEffect
  const [activeSection, setActiveSection] = useState<SectionType>('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKeysData | null>(null)
  const [sectionInitialized, setSectionInitialized] = useState(false)
  
  // Initialize section from URL params or localStorage on mount
  useEffect(() => {
    if (sectionInitialized) return

    const transientSections: SectionType[] = ['edit-product', 'add-product', 'create-purchase-order', 'edit-purchase-order']

    // First, check URL search params
    const sectionFromUrl = searchParams.get('section') as SectionType | null
    if (sectionFromUrl && validSections.includes(sectionFromUrl)) {
      setActiveSection(sectionFromUrl)
      // Update localStorage to match URL (except for transient sections)
      if (typeof window !== 'undefined' && appId && !transientSections.includes(sectionFromUrl)) {
        localStorage.setItem(`merchant-panel-section-${appId}`, sectionFromUrl)
      }
      setSectionInitialized(true)
      return
    }

    // Then, check localStorage (but skip transient sections)
    if (typeof window !== 'undefined' && appId) {
      const sectionFromStorage = localStorage.getItem(`merchant-panel-section-${appId}`) as SectionType | null
      if (sectionFromStorage && validSections.includes(sectionFromStorage) && !transientSections.includes(sectionFromStorage)) {
        setActiveSection(sectionFromStorage)
        // Update URL to match localStorage
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('section', sectionFromStorage)
        router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
        setSectionInitialized(true)
        return
      }
    }

    // Default to dashboard - ensure URL reflects this
    const currentUrl = new URL(window.location.href)
    if (!currentUrl.searchParams.has('section')) {
      currentUrl.searchParams.set('section', 'dashboard')
      router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })
    }
    setSectionInitialized(true)
  }, [searchParams, appId, router, sectionInitialized])
  
  // Update URL and localStorage when section changes (after initialization)
  const handleSectionChange = useCallback((section: SectionType) => {
    setActiveSection(section)

    // Update URL with section parameter
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('section', section)
    router.replace(currentUrl.pathname + currentUrl.search, { scroll: false })

    // Update localStorage for persistence (except for transient sections that require context)
    const transientSections: SectionType[] = ['edit-product', 'add-product', 'create-purchase-order', 'edit-purchase-order']
    if (typeof window !== 'undefined' && appId && !transientSections.includes(section)) {
      localStorage.setItem(`merchant-panel-section-${appId}`, section)
    }

    // Scroll to top when switching to products (e.g. after edit/add product)
    if (section === 'products') {
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      })
      // Also scroll after a short delay to override browser scroll restoration (e.g. from router.back())
      setTimeout(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      }, 50)
    }
  }, [router, appId])
  
  // Redirect 'settings' to 'settings-general' if needed
  useEffect(() => {
    if (activeSection === 'settings' && sectionInitialized) {
      handleSectionChange('settings-general' as SectionType)
    }
  }, [activeSection, sectionInitialized, handleSectionChange])
  
  // Sync section from URL when URL changes (for browser back/forward)
  useEffect(() => {
    if (!sectionInitialized) return

    const sectionFromUrl = searchParams.get('section') as SectionType | null
    if (sectionFromUrl && validSections.includes(sectionFromUrl)) {
      if (sectionFromUrl !== activeSection) {
        setActiveSection(sectionFromUrl)
        // Update localStorage to match URL (except for transient sections)
        const transientSections: SectionType[] = ['edit-product', 'add-product', 'create-purchase-order', 'edit-purchase-order']
        if (typeof window !== 'undefined' && appId && !transientSections.includes(sectionFromUrl)) {
          localStorage.setItem(`merchant-panel-section-${appId}`, sectionFromUrl)
        }
        // Scroll to top when navigating to products (e.g. via router.back() from edit)
        if (sectionFromUrl === 'products') {
          requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }))
          setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' }), 50)
        }
      }
    }
  }, [searchParams, appId, sectionInitialized, activeSection])

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
          onSectionChange={(section) => handleSectionChange(section as SectionType)}
        />
      case 'products':
        const appFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const finalAppSecretKey = appFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <ProductsSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={finalAppSecretKey || undefined}
          onAddProduct={() => handleSectionChange('add-product')}
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
      case 'add-product':
        // Use same API key logic as products section
        const addProductAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const addProductFinalAppSecretKey = addProductAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <AddProductSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={addProductFinalAppSecretKey || undefined}
          onSuccess={() => handleSectionChange('products')}
        />
      case 'edit-product':
        // Use same API key logic as products section
        const editProductAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const editProductFinalAppSecretKey = editProductAppFromApiKeys?.appSecretKey || currentApp.appSecretKey
        const productIdParam = searchParams?.get('productId')
        const productId = productIdParam ? parseInt(productIdParam, 10) : null

        if (!productId) {
          return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">Product ID is required. Please go back and try again.</p>
              <button
                onClick={() => handleSectionChange('products')}
                className="mt-2 px-4 py-2 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                Go Back to Products
              </button>
            </div>
          )
        }

        return <EditProductSection
          appId={currentApp.id}
          productId={productId}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={editProductFinalAppSecretKey || undefined}
          onSuccess={() => handleSectionChange('products')}
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
      case 'inventory-management':
        // Use same API key logic as products section
        const inventoryManagementAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const inventoryManagementFinalAppSecretKey = inventoryManagementAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <InventoryManagementSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={inventoryManagementFinalAppSecretKey || undefined}
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
        return <HelpCenterSection onNavigate={(section) => handleSectionChange(section as SectionType)} />
      case 'help-faq':
        return <HelpFaqSection onNavigate={(section) => handleSectionChange(section as SectionType)} />
      case 'help-tutorials':
        return <HelpTutorialsSection onNavigate={(section) => handleSectionChange(section as SectionType)} />
      case 'activity':
        return <ActivitySection appId={currentApp.id} />
      case 'settings':
        // Default to general settings - redirect handled by useEffect
        // Use same API key logic as other sections
        const defaultSettingsAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const defaultSettingsFinalAppSecretKey = defaultSettingsAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <SettingsSection
          app={currentApp}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={defaultSettingsFinalAppSecretKey || ''}
          activeSection="settings-general"
          onAppUpdated={(patch) => {
            setCurrentApp(prev => prev ? ({ ...prev, ...patch } as any) : prev)
            setApps(prev => prev.map(a => a.id === currentApp.id ? ({ ...a, ...patch } as any) : a))
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
      case 'settings-general':
      case 'settings-api':
      case 'settings-social-auth':
      case 'settings-payments':
      case 'settings-sms':
      case 'settings-email':
      case 'settings-templates':
      case 'settings-appearance':
      case 'settings-notifications':
        // Use same API key logic as other sections
        const settingsAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const settingsFinalAppSecretKey = settingsAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <SettingsSection
          app={currentApp}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={settingsFinalAppSecretKey || ''}
          activeSection={activeSection}
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
      case 'locations':
        return <LocationsSection />
      case 'suppliers':
        return <SuppliersSection />
      case 'purchase-orders':
        return <PurchaseOrdersSection />
      case 'create-purchase-order':
        return <CreatePurchaseOrderPage />
      case 'edit-purchase-order':
        return <EditPurchaseOrderPage />
      case 'shipping-zones':
        const shippingZonesAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const shippingZonesFinalAppSecretKey = shippingZonesAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <ShippingZonesSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={shippingZonesFinalAppSecretKey || ''}
        />
      case 'shipping-rates':
        const shippingRatesAppFromApiKeys = apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))
        const shippingRatesFinalAppSecretKey = shippingRatesAppFromApiKeys?.appSecretKey || currentApp.appSecretKey

        return <ShippingRatesSection
          appId={currentApp.id}
          apiKey={apiKeys?.userApiKey || ''}
          appSecretKey={shippingRatesFinalAppSecretKey || ''}
        />
      default:
        return <DashboardSection app={currentApp} onSectionChange={(section) => handleSectionChange(section as SectionType)} />
    }
  }

  return (
    <>
      <div className="merchant-panel-compact min-h-screen bg-gray-50 overflow-x-hidden">
        {/* Header - fixed at top */}
        <MerchantHeader
          currentApp={currentApp}
          user={user}
          onLogout={() => setShowLogoutModal(true)}
          apiKey={apiKeys?.userApiKey || undefined}
          appSecretKey={apiKeys?.apps?.find(app => Number(app.id) === Number(currentApp.id))?.appSecretKey || currentApp.appSecretKey}
          onNavigate={(section) => handleSectionChange(section as SectionType)}
        />

        {/* Main Layout Container - responsive flex */}
        <div className="flex pt-16 md:pt-20 overflow-x-hidden w-full max-w-full">
          {/* Sidebar - fixed position, responsive width */}
          <MerchantSidebar
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            currentApp={currentApp}
            apps={apps}
            onAppSwitch={handleAppSwitch}
          />

          {/* Main Content Area - responsive margin and padding */}
          <main className="flex-1 lg:ml-64 min-h-[calc(100vh-4rem)] overflow-x-hidden overflow-y-visible w-full max-w-full min-w-0">
            <div className="px-3 sm:px-4 md:px-4 lg:px-5 py-2 md:py-3 max-w-7xl mx-auto w-full overflow-x-hidden overflow-y-visible min-w-0">
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
