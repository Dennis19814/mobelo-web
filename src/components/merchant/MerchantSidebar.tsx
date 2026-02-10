'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, Package, FolderTree,
  ShoppingCart, Activity, Settings, Menu, X, ChevronDown, Smartphone, MessageSquare, Boxes, Building2, Users, Receipt, Ticket, Shield, HelpCircle, Key, CreditCard, Mail, FileText, Bell, Plus, MapPin
} from 'lucide-react'
import { useStaffPermissions, useStaffUser } from '@/contexts/StaffUserContext'
import { hashId } from '@/lib/url-hash'

type SectionType = 'dashboard' | 'products' | 'product-reviews' | 'add-product' | 'edit-product' | 'brands' | 'inventory' | 'inventory-management' | 'categories' | 'orders' | 'app-users' | 'activity' | 'settings' | 'settings-general' | 'settings-api' | 'settings-social-auth' | 'settings-payments' | 'settings-sms' | 'settings-email' | 'settings-templates' | 'settings-appearance' | 'settings-notifications' | 'taxes' | 'tax-categories' | 'tax-rules' | 'coupons' | 'team' | 'team-members' | 'team-roles' | 'help-center' | 'help-faq' | 'help-tutorials' | 'purchasing' | 'locations' | 'suppliers' | 'purchase-orders' | 'create-purchase-order' | 'edit-purchase-order'

interface App {
  id: number
  app_name: string
  app_idea: string
  status?: string
}

interface MerchantSidebarProps {
  activeSection: SectionType
  onSectionChange: (section: SectionType) => void
  isOpen: boolean
  onToggle: () => void
  currentApp?: App
  apps?: App[]
  onAppSwitch?: (appId: string) => void
}

interface MenuItem {
  id: SectionType
  label: string
  icon: any
  route?: string  // For external routes
  children?: Array<{
    id: SectionType
    label: string
    icon: any
  }>
}

const menuItems: MenuItem[] = [
  { id: 'dashboard' as SectionType, label: 'Dashboard', icon: LayoutDashboard },
  {
    id: 'products' as SectionType,
    label: 'Products',
    icon: Package,
    children: [
      { id: 'products' as SectionType, label: 'Product Catalog', icon: Package },
      { id: 'product-reviews' as SectionType, label: 'Product Reviews', icon: MessageSquare },
      { id: 'add-product' as SectionType, label: 'Add Product', icon: Plus },
    ]
  },
  { id: 'brands' as SectionType, label: 'Brands', icon: Building2 },
  { id: 'inventory' as SectionType, label: 'Inventory', icon: Boxes },
  {
    id: 'purchasing' as SectionType,
    label: 'Purchasing',
    icon: FileText,
    children: [
      { id: 'locations' as SectionType, label: 'Locations', icon: MapPin },
      { id: 'suppliers' as SectionType, label: 'Suppliers', icon: Users },
      { id: 'purchase-orders' as SectionType, label: 'Purchase Orders', icon: FileText },
    ]
  },
  { id: 'categories' as SectionType, label: 'Categories', icon: FolderTree },
  { id: 'orders' as SectionType, label: 'Orders', icon: ShoppingCart },
  { id: 'coupons' as SectionType, label: 'Coupons', icon: Ticket },
  {
    id: 'taxes' as SectionType,
    label: 'Taxes',
    icon: Receipt,
    children: [
      { id: 'tax-categories' as SectionType, label: 'Tax Categories', icon: FolderTree },
      { id: 'tax-rules' as SectionType, label: 'Tax Rules', icon: Receipt },
    ]
  },
  { id: 'app-users' as SectionType, label: 'App Users', icon: Users },
  {
    id: 'team' as SectionType,
    label: 'Team',
    icon: Users,
    children: [
      { id: 'team-members' as SectionType, label: 'Team Members', icon: Users },
      { id: 'team-roles' as SectionType, label: 'Team Roles', icon: Shield },
    ]
  },
  { id: 'activity' as SectionType, label: 'Activity', icon: Activity },
  {
    id: 'settings' as SectionType,
    label: 'Settings',
    icon: Settings,
    children: [
      { id: 'settings-general' as SectionType, label: 'General', icon: Settings },
      { id: 'settings-api' as SectionType, label: 'API', icon: Key },
      { id: 'settings-social-auth' as SectionType, label: 'Logins', icon: Smartphone },
      { id: 'settings-payments' as SectionType, label: 'Payment Gateway', icon: CreditCard },
      { id: 'settings-sms' as SectionType, label: 'SMS', icon: MessageSquare },
      { id: 'settings-email' as SectionType, label: 'Email', icon: Mail },
      { id: 'settings-templates' as SectionType, label: 'Templates', icon: FileText },
      { id: 'settings-notifications' as SectionType, label: 'Notifications', icon: Bell },
    ]
  },
  { id: 'help-center' as SectionType, label: 'Help Center', icon: HelpCircle },
]

export default function MerchantSidebar({
  activeSection,
  onSectionChange,
  isOpen,
  onToggle,
  currentApp,
  apps,
  onAppSwitch
}: MerchantSidebarProps) {
  const router = useRouter()
  const {
    canViewOrders,
    canViewStaff,
    canViewSettings,
    canViewInventory,
    canViewCustomers,
    hasPermission,
  } = useStaffPermissions()
  const { isStaffAuthenticated } = useStaffUser()
  const [showAppDropdown, setShowAppDropdown] = useState(false)
  const [hoveredAppId, setHoveredAppId] = useState<number | null>(null)
  const [expandedMenu, setExpandedMenu] = useState<SectionType | null>(null) // All menus collapsed by default
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Helper functions for menu expansion (accordion-style: only one menu open at a time)
  const toggleMenuExpansion = (menuId: SectionType) => {
    setExpandedMenu(prev =>
      prev === menuId ? null : menuId  // If clicking current menu, close it. Otherwise, open the new one.
    )
  }

  const isMenuExpanded = (menuId: SectionType) => expandedMenu === menuId

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAppDropdown(false)
      }
    }

    if (showAppDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAppDropdown])

  return (
    <>
      {/* Mobile/Tablet menu button - visible up to lg breakpoint (1024px) */}
      <button
        onClick={onToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
      </button>

      {/* Sidebar - responsive width and positioning */}
      <aside className={`
        fixed top-0 left-0 h-screen bg-white border-r border-gray-200
        w-64 md:w-72 lg:w-64
        z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:top-16 lg:h-[calc(100vh-4rem)]
      `}>
        <div className="mt-16 lg:mt-0 h-full flex flex-col overflow-hidden">
          {/* App Switcher Dropdown */}
          {currentApp && apps && (
            <div className="px-3 md:px-4 pt-3 md:pt-4 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-gray-200">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowAppDropdown(!showAppDropdown)}
                  className="w-full flex items-center justify-between px-2.5 md:px-3 py-2 md:py-2.5 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors group"
                  title={currentApp.app_name}
                  aria-expanded={showAppDropdown}
                  aria-label="Switch app"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <Smartphone className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="font-medium text-slate-900 text-xs md:text-sm truncate">
                      {currentApp.app_name}
                    </span>
                    {currentApp.status && (
                      <span className={`
                        inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0
                        ${currentApp.status === 'published' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-orange-100 text-orange-700'}
                      `}>
                        {currentApp.status === 'published' ? 'Prod' : 'Dev'}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-orange-600 transition-transform duration-200 shrink-0 ${showAppDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showAppDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="py-1 max-h-64 overflow-y-auto">
                      {apps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => {
                            if (onAppSwitch) {
                              onAppSwitch(app.id.toString())
                            }
                            setShowAppDropdown(false)
                          }}
                          onMouseEnter={() => setHoveredAppId(app.id)}
                          onMouseLeave={() => setHoveredAppId(null)}
                          className={`
                            relative w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors
                            ${app.id === currentApp.id ? 'bg-orange-50 text-orange-600' : 'text-gray-700'}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate pr-2" title={app.app_name}>
                                {app.app_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate pr-2" title={app.app_idea}>
                                {app.app_idea}
                              </div>
                            </div>
                            {app.status && (
                              <span className={`
                                inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium shrink-0 ml-2
                                ${app.status === 'published' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-orange-100 text-orange-700'}
                              `}>
                                {app.status === 'published' ? 'Prod' : 'Dev'}
                              </span>
                            )}
                          </div>
                          
                          {/* Tooltip for long names */}
                          {hoveredAppId === app.id && (app.app_name.length > 25 || app.app_idea.length > 30) && (
                            <div className="absolute left-full top-0 ml-2 p-2 bg-gray-900 text-white text-xs rounded-md shadow-lg z-50 max-w-xs pointer-events-none">
                              <div className="font-medium mb-1">{app.app_name}</div>
                              <div className="text-gray-300">{app.app_idea}</div>
                              <div className="absolute right-full top-3 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-900"></div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Menu - responsive spacing */}
          <nav className="flex-1 overflow-y-auto px-3 md:px-4 space-y-0.5 md:space-y-1 pb-20">
            {menuItems.map((item) => {
              const Icon = item.icon
              const hasChildren = item.children && item.children.length > 0
              const isExpanded = isMenuExpanded(item.id)
              // For inventory, also consider inventory-management as active
              const isActive = activeSection === item.id || (item.id === 'inventory' && activeSection === 'inventory-management')
              const hasActiveChild = item.children?.some(child => child.id === activeSection)
              
              // RBAC visibility: hide menu items staff cannot access
              let isVisible = true
              switch (item.id) {
                case 'orders':
                  isVisible = canViewOrders
                  break
                case 'team':
                  // Hide Team management entirely for staff logins
                  isVisible = !isStaffAuthenticated
                  break
                case 'settings':
                  isVisible = canViewSettings
                  break
                case 'taxes':
                  isVisible = hasPermission('settings', 'view', 'taxes')
                  break
                case 'inventory':
                  isVisible = canViewInventory
                  break
                case 'app-users':
                  isVisible = canViewCustomers
                  break
                case 'categories':
                  isVisible = hasPermission('products', 'view', 'categories')
                  break
                case 'brands':
                  // Treat brands similar to categories
                  isVisible = hasPermission('products', 'view', 'categories')
                  break
                case 'purchasing':
                  // Hide purchasing menu if staff has no purchase order permissions
                  isVisible = hasPermission('purchase_orders', 'view')
                  break
                default:
                  isVisible = true
              }
              if (!isVisible) return null
              
              return (
                <div key={item.id}>
                  {/* Main menu item */}
                  <button
                    onClick={() => {
                      if (hasChildren) {
                        toggleMenuExpansion(item.id)
                      } else if (item.route && currentApp) {
                        // Navigate to external route
                        const hashedId = hashId(currentApp.id)
                        router.push(`/merchant-panel/${hashedId}/${item.route}`)
                        if (window.innerWidth < 1024) {
                          onToggle()
                        }
                      } else {
                        onSectionChange(item.id as SectionType)
                        if (window.innerWidth < 1024) {
                          onToggle()
                        }
                      }
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 rounded-lg transition-all duration-200
                      ${isActive || hasActiveChild
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive || hasActiveChild ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className="text-xs md:text-sm">{item.label}</span>
                    </div>
                    {hasChildren && (
                      <ChevronDown 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        } ${isActive || hasActiveChild ? 'text-orange-600' : 'text-gray-400'}`}
                      />
                    )}
                  </button>

                  {/* Submenu items */}
                  {hasChildren && (
                    <div className={`
                      overflow-hidden transition-all duration-200 ease-out
                      ${isExpanded ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'}
                    `}>
                      <div className="pl-4 space-y-1">
                        {(item.children || [])
                          // Hide any Team child items for staff logins as well
                          .filter(child => !(isStaffAuthenticated && (child.id === 'team-members' || child.id === 'team-roles')))
                          .map((child) => {
                          const ChildIcon = child.icon
                          const isChildActive = activeSection === child.id
                          
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                onSectionChange(child.id)
                                if (window.innerWidth < 1024) {
                                  onToggle()
                                }
                              }}
                              className={`
                                w-full flex items-center space-x-2 md:space-x-3 px-3 md:px-4 py-2 rounded-lg transition-all duration-200
                                ${isChildActive
                                  ? 'bg-blue-100 text-orange-700 font-medium'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                              `}
                            >
                              <ChildIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isChildActive ? 'text-orange-700' : 'text-gray-400'}`} />
                              <span className="text-xs md:text-sm">{child.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
