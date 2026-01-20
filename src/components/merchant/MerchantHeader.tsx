'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Grid3x3, ChevronDown, LogOut, Settings, CreditCard, Bell } from 'lucide-react'
import { useStaffPermissions, useStaffUser } from '@/contexts/StaffUserContext'
import { NotificationsModal } from '@/components/modals'
import { useMerchantAuth } from '@/hooks'
import { apiService } from '@/lib/api-service'
import type { User } from '@/types'
import type { Product } from '@/types/product.types'
import type { Order } from '@/types/order.types'

interface App {
  id: number
  app_name: string
  app_idea: string
  status: string
  userId: number
}

interface MerchantHeaderProps {
  currentApp: App
  user: User | null
  onLogout: () => void
  apiKey?: string
  appSecretKey?: string
  onNavigate?: (section: string) => void
}

export default function MerchantHeader({
  currentApp,
  user,
  onLogout,
  apiKey,
  appSecretKey,
  onNavigate
}: MerchantHeaderProps) {
  const router = useRouter()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotificationsModal, setShowNotificationsModal] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [previousUnreadCount, setPreviousUnreadCount] = useState<number | null>(null)
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const previousLowStockProductIds = useRef<Set<number>>(new Set())
  const { headers } = useMerchantAuth(apiKey, appSecretKey)

  // Staff user context
  const { staffUser } = useStaffUser()
  const { role, isAdmin } = useStaffPermissions()

  // Calculate unread notifications count
  const calculateUnreadCount = useCallback(async () => {
    if (!headers || !currentApp?.id) return

    try {
      // Fetch products for low stock alerts
      const productsResponse = await apiService.getProducts({ limit: 100 })
      const products: Product[] = productsResponse.ok && productsResponse.data
        ? (productsResponse.data.data || productsResponse.data)
        : []
      const productsArray = Array.isArray(products) ? products : []

      // Fetch recent orders
      const ordersResponse = await apiService.getOrders({ limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' })
      const orders: Order[] = ordersResponse.ok && ordersResponse.data
        ? (ordersResponse.data.data || ordersResponse.data)
        : []
      const ordersArray = Array.isArray(orders) ? orders : []

      // Load read status from localStorage
      let readNotificationIds = new Set<string>()
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`read-notifications-${currentApp.id}`)
        if (stored) {
          try {
            readNotificationIds = new Set(JSON.parse(stored))
          } catch (error) {
            console.error('Error loading read notifications:', error)
          }
        }
      }

      // Calculate notifications (same logic as NotificationsModal)
      const notifications: Array<{ id: string; read: boolean }> = []

      // Low stock alerts
      const lowStockProducts = productsArray.filter(p => 
        p.trackInventory && 
        p.inventoryQuantity !== undefined && 
        p.inventoryQuantity > 0 && 
        p.inventoryQuantity < 10
      )
      
      // Get current low stock product IDs
      const currentLowStockProductIds = new Set(lowStockProducts.map(p => p.id).filter((id): id is number => id !== undefined))
      
      // Check if there are NEW products that became low stock (weren't in previous set)
      const newLowStockProducts = Array.from(currentLowStockProductIds).filter(id => !previousLowStockProductIds.current.has(id))
      const hasNewLowStockProducts = newLowStockProducts.length > 0
      
      // If there are new low stock products, mark notification as unread (even if it was previously read)
      const lowStockNotificationRead = readNotificationIds.has('low-stock-grouped') && !hasNewLowStockProducts
      
      if (lowStockProducts.length > 0) {
        notifications.push({
          id: 'low-stock-grouped',
          read: lowStockNotificationRead
        })
      }
      
      // Note: We don't update previousLowStockProductIds here because we want to detect
      // new products that become low stock. The stored set is only updated when the
      // notification is marked as read in NotificationsModal.

      // New orders (last 24 hours)
      const recentOrders = ordersArray.filter(order => {
        if (!order.createdAt) return false
        const orderDate = new Date(order.createdAt)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return orderDate > oneDayAgo
      })
      if (recentOrders.length > 0) {
        notifications.push({
          id: 'new-orders-grouped',
          read: readNotificationIds.has('new-orders-grouped')
        })
      }

      // Count unread notifications
      const unread = notifications.filter(n => !n.read).length
      
      // Check if there's a new notification (count increased OR new low stock products detected)
      // Only trigger if we have a previous count (not initial load) and (count increased OR new low stock products)
      if (previousUnreadCount !== null && (unread > previousUnreadCount || hasNewLowStockProducts)) {
        setHasNewNotification(true)
        // Reset the highlight after animation completes
        setTimeout(() => {
          setHasNewNotification(false)
        }, 3000) // Animation lasts 3 seconds
      }
      
      setPreviousUnreadCount(unread)
      setUnreadCount(unread)
    } catch (error) {
      console.error('Error calculating unread notifications:', error)
      setUnreadCount(0)
    }
  }, [headers, currentApp?.id])

  // Load previous low stock product IDs from localStorage on mount
  useEffect(() => {
    if (currentApp?.id && typeof window !== 'undefined') {
      const lowStockStored = localStorage.getItem(`low-stock-products-${currentApp.id}`)
      if (lowStockStored) {
        try {
          const productIds = JSON.parse(lowStockStored)
          previousLowStockProductIds.current = new Set(productIds)
        } catch (error) {
          console.error('Error loading previous low stock products:', error)
        }
      }
    }
  }, [currentApp?.id])

  useEffect(() => {
    calculateUnreadCount()
    // Refresh every 30 seconds
    const interval = setInterval(calculateUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [calculateUnreadCount])

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsModal(false)
      }
    }

    if (showNotificationsModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotificationsModal])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

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

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800 border-purple-200',
      manager: 'bg-blue-100 text-blue-800 border-orange-200',
      staff: 'bg-green-100 text-green-800 border-green-200',
      viewer: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[role as keyof typeof colors] || colors.viewer
  }

  const ownerLoggedIn = typeof window !== 'undefined' ? !!localStorage.getItem('access_token') : !!user

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/50 backdrop-blur-md border-b border-orange-100/50 shadow-sm">
      <div className="px-4 md:px-6 py-1.5 md:py-2">
        <div className="flex items-center justify-between gap-2 md:gap-4">
          {/* Left side - Logo and App Name */}
          <div className="flex items-center space-x-3 md:space-x-4 lg:space-x-6 min-w-0 flex-1 pl-14 md:pl-16 lg:pl-0">
            {/* Logo - responsive sizing */}
            <Link href="/" aria-label="Go to home" className="flex items-center group shrink-0">
              <Image
                src="/logo-new.png"
                alt="mobelo logo"
                width={120}
                height={40}
                className="h-8 md:h-9 lg:h-10 w-auto transition-transform duration-150 group-hover:scale-105"
                priority
              />
            </Link>

            {/* Current App Name - hidden on smaller tablets */}
            <div className="hidden xl:block">
              <span className="text-xs md:text-sm text-gray-500">Merchant Panel</span>
            </div>
          </div>

          {/* Right side - My Apps button, Notifications, and User menu */}
          <div className="flex items-center space-x-2 md:space-x-3 shrink-0">
            {/* My Apps Button - visible only for owner sessions, responsive */}
            {ownerLoggedIn && (
              <button
                onClick={() => router.push('/my-apps')}
                className="flex items-center space-x-1.5 md:space-x-2 border border-orange-600 text-orange-600 font-medium transition-all duration-200 hover:bg-orange-50 px-2.5 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-lg transform hover:scale-105"
                aria-label="My Apps"
              >
                <Grid3x3 className="w-4 h-4" />
                <span className="hidden sm:inline text-sm md:text-base">My Apps</span>
              </button>
            )}

            {/* Notifications Button */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => {
                  setShowNotificationsModal(!showNotificationsModal)
                  setShowUserMenu(false) // Close user menu when opening notifications
                  // Reset new notification highlight when opening modal
                  if (hasNewNotification) {
                    setHasNewNotification(false)
                  }
                }}
                className={`relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-300 ${
                  hasNewNotification 
                    ? 'bg-orange-100 ring-2 ring-orange-500 ring-opacity-60 shadow-lg shadow-orange-200' 
                    : ''
                }`}
                aria-label="Notifications"
                aria-expanded={showNotificationsModal}
              >
                <Bell className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${
                  hasNewNotification ? 'text-orange-600 scale-110 animate-bounce' : ''
                }`} />
                {/* Unread badge - only show if there are unread notifications */}
                {unreadCount > 0 && (
                  <span className={`absolute top-1 right-1 w-2 h-2 bg-orange-600 rounded-full border-2 border-white transition-all duration-300 ${
                    hasNewNotification ? 'animate-ping scale-150' : ''
                  }`}></span>
                )}
                {/* Pulsing ring effect for new notifications */}
                {hasNewNotification && (
                  <>
                    <span className="absolute inset-0 rounded-lg bg-orange-400 opacity-30 animate-ping"></span>
                    <span className="absolute inset-0 rounded-lg bg-orange-300 opacity-20 animate-pulse"></span>
                  </>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotificationsModal && (
                <NotificationsModal
                  isOpen={showNotificationsModal}
                  onClose={() => {
                    setShowNotificationsModal(false)
                    // Recalculate unread count when modal closes (after a short delay to allow localStorage to update)
                    setTimeout(() => {
                      calculateUnreadCount()
                    }, 100)
                  }}
                  appId={currentApp.id}
                  apiKey={apiKey}
                  appSecretKey={appSecretKey}
                  onNavigate={onNavigate}
                />
              )}
            </div>

            {/* User Menu - responsive */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu)
                  setShowNotificationsModal(false) // Close notifications when opening user menu
                }}
                className="flex items-center space-x-1.5 md:space-x-2 px-2 md:px-3 py-1.5 md:py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                aria-expanded={showUserMenu}
                aria-label="User menu"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs md:text-sm font-semibold shrink-0">
                  {getUserInitials(user)}
                </div>
                <div className="hidden md:flex flex-col items-start min-w-0">
                  <span className="text-xs md:text-sm truncate max-w-[120px] lg:max-w-[150px]">
                    {(!ownerLoggedIn && staffUser)
                      ? staffUser.firstName
                      : user?.firstName || user?.email?.split('@')[0] || 'User'}
                  </span>
                  {(!ownerLoggedIn && staffUser) && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getRoleBadgeColor(role)}`}>
                      {role}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 shrink-0" />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 md:w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <div className="px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 border-b border-gray-100">
                      <div className="font-medium">
                        {(!ownerLoggedIn && staffUser)
                          ? `${staffUser.firstName} ${staffUser.lastName}`
                          : user?.firstName && user?.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : 'User'}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {(!ownerLoggedIn && staffUser) ? staffUser?.email : user?.email}
                      </div>
                      {(!ownerLoggedIn && staffUser) && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(role)}`}>
                            {role.toUpperCase()}
                          </span>
                          {isAdmin && (
                            <span className="text-xs text-purple-600 font-semibold">
                              (Full Access)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {ownerLoggedIn && (
                      <>
                        <Link
                          href="/account/plan"
                          className="flex items-center space-x-2 w-full px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span>Plan</span>
                        </Link>
                        <Link
                          href="/account/billing"
                          className="flex items-center space-x-2 w-full px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          <span>Billing</span>
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        onLogout()
                      }}
                      className="flex items-center space-x-2 w-full px-3 md:px-4 py-2 text-xs md:text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
