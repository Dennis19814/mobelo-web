'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Bell, CheckCircle, Info, ShoppingCart, Package, DollarSign, X, AlertTriangle, Truck, Star } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { useMerchantAuth } from '@/hooks'
import type { Product } from '@/types/product.types'
import type { Order } from '@/types/order.types'

interface NotificationItem {
  productId?: number
  productName?: string
  productImage?: string
  inventoryQuantity?: number
  orderId?: string
  orderTotal?: number
  paymentAmount?: number
  reviewRating?: number
  reviewProduct?: string
  createdAt?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'order'
  time: string
  read: boolean
  icon?: React.ReactNode
  // For grouped notifications
  items?: NotificationItem[]
  count?: number
  // For single item notifications (backward compatibility)
  productId?: number
  productName?: string
  productImage?: string
  inventoryQuantity?: number
  orderId?: string
  orderTotal?: number
  paymentAmount?: number
  reviewRating?: number
  reviewProduct?: string
  createdAt?: string
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
  appId?: number
  apiKey?: string
  appSecretKey?: string
  onNavigate?: (section: string) => void
}

// Helper function to format time ago
const formatTimeAgo = (date: string | Date): string => {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  return `${Math.floor(diffInSeconds / 604800)} weeks ago`
}

export default function NotificationsModal({ 
  isOpen, 
  onClose,
  appId,
  apiKey,
  appSecretKey,
  onNavigate
}: NotificationsModalProps) {
  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set())

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && headers) {
      fetchNotificationsData()
    }
  }, [isOpen, headers])

  const fetchNotificationsData = async () => {
    if (!headers) return
    
    setLoading(true)
    try {
      // Fetch products for low stock alerts
      const productsResponse = await apiService.getProducts({ limit: 100 })
      if (productsResponse.ok && productsResponse.data) {
        const productsData = productsResponse.data.data || productsResponse.data
        setProducts(Array.isArray(productsData) ? productsData : [])
      }

      // Fetch recent orders
      const ordersResponse = await apiService.getOrders({ limit: 20, sortBy: 'createdAt', sortOrder: 'DESC' })
      if (ordersResponse.ok && ordersResponse.data) {
        const ordersData = ordersResponse.data.data || ordersResponse.data
        setOrders(Array.isArray(ordersData) ? ordersData : [])
      }
    } catch (error) {
      console.error('Error fetching notifications data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Generate notifications from real data
  const notifications = useMemo(() => {
    const notifs: Notification[] = []

    // Low stock alerts (products with inventory < 10) - Grouped
    const lowStockProducts = products.filter(p => 
      p.trackInventory && 
      p.inventoryQuantity !== undefined && 
      p.inventoryQuantity > 0 && 
      p.inventoryQuantity < 10
    )
    
    if (lowStockProducts.length > 0) {
      const items: NotificationItem[] = lowStockProducts.map(product => {
        let createdAt = ''
        if (product.updatedAt) {
          const updatedAt = product.updatedAt as any
          createdAt = typeof updatedAt === 'string' ? updatedAt : (updatedAt instanceof Date ? updatedAt.toISOString() : String(updatedAt || ''))
        } else if (product.createdAt) {
          const created = product.createdAt as any
          createdAt = typeof created === 'string' ? created : (created instanceof Date ? created.toISOString() : String(created || ''))
        }
        return {
          productId: product.id,
          productName: product.name,
          productImage: product.thumbnailUrl || '/placeholder-product.png',
          inventoryQuantity: product.inventoryQuantity,
          createdAt: createdAt
        }
      })
      
      const latestUpdate = lowStockProducts.reduce((latest, product) => {
        const productDate = product.updatedAt || product.createdAt
        if (!productDate) return latest
        const date = new Date(productDate)
        return date > latest ? date : latest
      }, new Date(0))
      
      notifs.push({
        id: 'low-stock-grouped',
        title: 'Low Stock Alert',
        message: lowStockProducts.length === 1 
          ? `Product "${lowStockProducts[0].name}" is running low. Only ${lowStockProducts[0].inventoryQuantity} items left in stock.`
          : `${lowStockProducts.length} products are running low on stock.`,
        type: 'warning',
        time: latestUpdate.getTime() > 0 ? formatTimeAgo(latestUpdate) : 'Recently',
        read: false,
        icon: <Package className="w-5 h-5" />,
        items: items,
        count: lowStockProducts.length,
        // For single item, keep backward compatibility
        productId: lowStockProducts.length === 1 ? lowStockProducts[0].id : undefined,
        productName: lowStockProducts.length === 1 ? lowStockProducts[0].name : undefined,
        productImage: lowStockProducts.length === 1 ? (lowStockProducts[0].thumbnailUrl || '/placeholder-product.png') : undefined,
        inventoryQuantity: lowStockProducts.length === 1 ? lowStockProducts[0].inventoryQuantity : undefined,
        createdAt: latestUpdate.getTime() > 0 ? latestUpdate.toISOString() : undefined
      })
    }

    // New orders (last 24 hours) - Grouped
    const recentOrders = orders.filter(order => {
      if (!order.createdAt) return false
      const orderDate = new Date(order.createdAt)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return orderDate > oneDayAgo
    })

    if (recentOrders.length > 0) {
      const items: NotificationItem[] = recentOrders.map(order => {
        const orderTotal = typeof order.total === 'number' ? order.total : (order.total ? parseFloat(String(order.total)) : 0)
        const orderTotalSafe = isNaN(orderTotal) ? 0 : orderTotal
        return {
          orderId: order.orderNumber || order.id?.toString(),
          orderTotal: orderTotalSafe,
          createdAt: typeof order.createdAt === 'string' ? order.createdAt : (order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt || ''))
        }
      })
      
      const latestOrder = recentOrders.reduce((latest, order) => {
        if (!order.createdAt) return latest
        const date = new Date(order.createdAt)
        return date > latest ? date : latest
      }, new Date(0))
      
      const totalAmount = recentOrders.reduce((sum, order) => {
        const orderTotal = typeof order.total === 'number' ? order.total : (order.total ? parseFloat(String(order.total)) : 0)
        return sum + (isNaN(orderTotal) ? 0 : orderTotal)
      }, 0)
      
      notifs.push({
        id: 'new-orders-grouped',
        title: 'New Order Received',
        message: recentOrders.length === 1
          ? `Order #${recentOrders[0].orderNumber || recentOrders[0].id} has been placed successfully. Total: $${(typeof recentOrders[0].total === 'number' ? recentOrders[0].total : parseFloat(String(recentOrders[0].total || 0))).toFixed(2)}`
          : `${recentOrders.length} new orders received. Total: $${totalAmount.toFixed(2)}`,
        type: 'order',
        time: latestOrder.getTime() > 0 ? formatTimeAgo(latestOrder) : 'Recently',
        read: false,
        icon: <ShoppingCart className="w-5 h-5" />,
        items: items,
        count: recentOrders.length,
        // For single item, keep backward compatibility
        orderId: recentOrders.length === 1 ? (recentOrders[0].orderNumber || recentOrders[0].id?.toString()) : undefined,
        orderTotal: recentOrders.length === 1 ? (typeof recentOrders[0].total === 'number' ? recentOrders[0].total : parseFloat(String(recentOrders[0].total || 0))) : undefined,
        createdAt: latestOrder.getTime() > 0 ? latestOrder.toISOString() : undefined
      })
    }

    // Shipped orders - Grouped
    const shippedOrders = orders.filter(order => 
      order.status === 'shipped' || order.status === 'delivered' || order.fulfillmentStatus === 'shipped'
    ).slice(0, 10)

    if (shippedOrders.length > 0) {
      const items: NotificationItem[] = shippedOrders.map(order => ({
        orderId: order.orderNumber || order.id?.toString(),
        createdAt: typeof order.shippedAt === 'string' ? order.shippedAt : (typeof order.updatedAt === 'string' ? order.updatedAt : (order.updatedAt instanceof Date ? order.updatedAt.toISOString() : ''))
      }))
      
      const latestShipped = shippedOrders.reduce((latest, order) => {
        const date = order.shippedAt ? new Date(order.shippedAt) : (order.updatedAt ? new Date(order.updatedAt) : new Date(0))
        return date > latest ? date : latest
      }, new Date(0))
      
      notifs.push({
        id: 'shipped-orders-grouped',
        title: 'Order Shipped',
        message: shippedOrders.length === 1
          ? `Order #${shippedOrders[0].orderNumber || shippedOrders[0].id} has been shipped and is on its way to the customer.`
          : `${shippedOrders.length} orders have been shipped.`,
        type: 'success',
        time: latestShipped.getTime() > 0 ? formatTimeAgo(latestShipped) : 'Recently',
        read: true,
        icon: <Package className="w-5 h-5" />,
        items: items,
        count: shippedOrders.length,
        // For single item, keep backward compatibility
        orderId: shippedOrders.length === 1 ? (shippedOrders[0].orderNumber || shippedOrders[0].id?.toString()) : undefined,
        createdAt: latestShipped.getTime() > 0 ? latestShipped.toISOString() : undefined
      })
    }

    // Payments from orders (paid orders) - Grouped
    const paidOrders = orders.filter(order => 
      order.paymentStatus === 'paid' || order.paymentStatus === 'authorized'
    ).slice(0, 10)

    if (paidOrders.length > 0) {
      const items: NotificationItem[] = paidOrders.map(order => {
        const totalPaid = typeof order.totalPaid === 'number' ? order.totalPaid : (order.totalPaid ? parseFloat(String(order.totalPaid)) : null)
        const total = typeof order.total === 'number' ? order.total : (order.total ? parseFloat(String(order.total)) : null)
        const paymentAmount = (totalPaid !== null && !isNaN(totalPaid)) ? totalPaid : ((total !== null && !isNaN(total)) ? total : 0)
        return {
          paymentAmount: paymentAmount,
          orderId: order.orderNumber || order.id?.toString(),
          createdAt: typeof order.updatedAt === 'string' ? order.updatedAt : (order.updatedAt instanceof Date ? order.updatedAt.toISOString() : String(order.updatedAt || ''))
        }
      })
      
      const latestPayment = paidOrders.reduce((latest, order) => {
        if (!order.updatedAt) return latest
        const date = new Date(order.updatedAt)
        return date > latest ? date : latest
      }, new Date(0))
      
      const totalPaymentAmount = items.reduce((sum, item) => sum + (item.paymentAmount || 0), 0)
      
      notifs.push({
        id: 'payments-grouped',
        title: 'Payment Received',
        message: paidOrders.length === 1
          ? `Payment of $${(items[0].paymentAmount || 0).toFixed(2)} has been successfully processed.`
          : `${paidOrders.length} payments received. Total: $${totalPaymentAmount.toFixed(2)}`,
        type: 'success',
        time: latestPayment.getTime() > 0 ? formatTimeAgo(latestPayment) : 'Recently',
        read: true,
        icon: <DollarSign className="w-5 h-5" />,
        items: items,
        count: paidOrders.length,
        // For single item, keep backward compatibility
        paymentAmount: paidOrders.length === 1 ? (items[0].paymentAmount || 0) : undefined,
        orderId: paidOrders.length === 1 ? items[0].orderId : undefined,
        createdAt: latestPayment.getTime() > 0 ? latestPayment.toISOString() : undefined
      })
    }

        // Sort by creation date (newest first)
        const sorted = notifs.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA
        })

        // Apply read status from state (if marked as read, override default)
        return sorted.map(notif => ({
          ...notif,
          read: readNotificationIds.has(notif.id) || notif.read
        }))
      }, [products, orders, readNotificationIds])

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    // Mark as read when clicked
    if (!readNotificationIds.has(notification.id)) {
      const newReadIds = new Set(readNotificationIds)
      newReadIds.add(notification.id)
      setReadNotificationIds(newReadIds)
      
      // Save to localStorage
      if (appId && typeof window !== 'undefined') {
        localStorage.setItem(`read-notifications-${appId}`, JSON.stringify(Array.from(newReadIds)))
      }
    }
  }

  const handleMarkAllAsRead = () => {
    // Mark all notifications as read
    const allNotificationIds = new Set(notifications.map(n => n.id))
    setReadNotificationIds(allNotificationIds)
    
    // Save to localStorage
    if (appId && typeof window !== 'undefined') {
      localStorage.setItem(`read-notifications-${appId}`, JSON.stringify(Array.from(allNotificationIds)))
    }
  }

  const closeDetailModal = () => {
    setSelectedNotification(null)
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
        return 'bg-blue-50 border-blue-200'
      case 'order':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
        return 'text-blue-600'
      case 'order':
        return 'text-orange-600'
      default:
        return 'text-gray-600'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
    <>
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-600 text-white text-xs font-semibold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-500">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                notification.read ? 'opacity-70' : ''
              } ${getNotificationStyles(notification.type)}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-2">
                <div className={`flex-shrink-0 ${getIconColor(notification.type)}`}>
                  {notification.icon || <Bell className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className={`text-sm font-semibold text-gray-900 ${!notification.read ? 'font-bold' : ''}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-orange-600 rounded-full flex-shrink-0 mt-1.5 ml-2" />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {notification.time}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <button
            onClick={() => {
              handleMarkAllAsRead()
            }}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </button>
        </div>
      )}
    </div>

      {/* Notification Detail Modals */}
      {selectedNotification && (
      <>
        {/* Low Stock Alert Modal */}
        {selectedNotification.type === 'warning' && (selectedNotification.productName || (selectedNotification.items && selectedNotification.items.length > 0)) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Low Stock Alert
                    </h3>
                    <p className="text-sm text-gray-600">
                      This product is running low on inventory.
                    </p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Product Info */}
                {selectedNotification.items && selectedNotification.items.length > 1 ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto space-y-3">
                    {selectedNotification.items.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 pb-3 border-b border-gray-200 last:border-b-0 last:pb-0">
                        {item.productImage && (
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-white border border-gray-200">
                              <Image
                                src={item.productImage}
                                alt={item.productName || 'Product'}
                                fill
                                className="object-contain"
                                sizes="64px"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {item.productName}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-600">Items Left:</span>
                            <span className={`text-base font-bold ${
                              (item.inventoryQuantity || 0) < 5 
                                ? 'text-red-600' 
                                : 'text-yellow-600'
                            }`}>
                              {item.inventoryQuantity || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedNotification.productName ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-4">
                      {selectedNotification.productImage && (
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-white border border-gray-200">
                            <Image
                              src={selectedNotification.productImage}
                              alt={selectedNotification.productName || 'Product'}
                              fill
                              className="object-contain"
                              sizes="80px"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-semibold text-gray-900 mb-1">
                          {selectedNotification.productName}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Items Left:</span>
                          <span className={`text-lg font-bold ${
                            (selectedNotification.inventoryQuantity || 0) < 5 
                              ? 'text-red-600' 
                              : 'text-yellow-600'
                          }`}>
                            {selectedNotification.inventoryQuantity || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                    <p className="text-sm text-gray-500">No product information available</p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal()
                      onClose()
                      if (onNavigate) {
                        onNavigate('inventory')
                      } else {
                        // Update URL to navigate to inventory section
                        const currentUrl = new URL(window.location.href)
                        currentUrl.searchParams.set('section', 'inventory')
                        window.location.href = currentUrl.pathname + currentUrl.search
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View Products
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        {(selectedNotification.type === 'order' || selectedNotification.title.includes('Order')) && (selectedNotification.orderId || (selectedNotification.items && selectedNotification.items.length > 0)) && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedNotification.title.includes('Shipped') 
                        ? 'bg-green-100' 
                        : 'bg-orange-100'
                    }`}>
                      {selectedNotification.title.includes('Shipped') ? (
                        <Truck className="w-6 h-6 text-green-600" />
                      ) : (
                        <ShoppingCart className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {selectedNotification.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedNotification.message}
                    </p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Order Info */}
                {selectedNotification.items && selectedNotification.items.length > 1 ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto space-y-3">
                    {selectedNotification.items.map((item, idx) => (
                      <div key={idx} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Order ID:</span>
                          <span className="text-sm font-semibold text-gray-900">#{item.orderId}</span>
                        </div>
                        {item.orderTotal !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Total Amount:</span>
                            <span className="text-base font-bold text-gray-900">
                              ${(typeof item.orderTotal === 'number' ? item.orderTotal : parseFloat(String(item.orderTotal || 0))).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-300 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total Orders:</span>
                        <span className="text-sm font-bold text-gray-900">{selectedNotification.count || selectedNotification.items.length}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Order ID:</span>
                      <span className="text-sm font-semibold text-gray-900">#{selectedNotification.orderId}</span>
                    </div>
                    {selectedNotification.orderTotal !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Amount:</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${(typeof selectedNotification.orderTotal === 'number' ? selectedNotification.orderTotal : parseFloat(String(selectedNotification.orderTotal || 0))).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="text-sm text-gray-900">{selectedNotification.time}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal()
                      onClose()
                      if (onNavigate) {
                        onNavigate('orders')
                      } else {
                        // Update URL to navigate to orders section
                        const currentUrl = new URL(window.location.href)
                        currentUrl.searchParams.set('section', 'orders')
                        window.location.href = currentUrl.pathname + currentUrl.search
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    View {selectedNotification.items && selectedNotification.items.length > 1 ? 'Orders' : 'Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Detail Modal */}
        {selectedNotification.title === 'Payment Received' && selectedNotification.paymentAmount && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Payment Received
                    </h3>
                    <p className="text-sm text-gray-600">
                      Payment has been successfully processed.
                    </p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Payment Info */}
                {selectedNotification.items && selectedNotification.items.length > 1 ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto space-y-3">
                    {selectedNotification.items.map((item, idx) => (
                      <div key={idx} className="pb-3 border-b border-gray-200 last:border-b-0 last:pb-0 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Order ID:</span>
                          <span className="text-sm font-semibold text-gray-900">#{item.orderId}</span>
                        </div>
                        {item.paymentAmount !== undefined && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Amount:</span>
                            <span className="text-base font-bold text-green-600">
                              ${(typeof item.paymentAmount === 'number' ? item.paymentAmount : parseFloat(String(item.paymentAmount || 0))).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-300 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Total Payments:</span>
                        <span className="text-sm font-bold text-gray-900">{selectedNotification.count || selectedNotification.items.length}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">
                          ${selectedNotification.items.reduce((sum, item) => sum + (typeof item.paymentAmount === 'number' ? item.paymentAmount : parseFloat(String(item.paymentAmount || 0))), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${(typeof selectedNotification.paymentAmount === 'number' ? selectedNotification.paymentAmount : parseFloat(String(selectedNotification.paymentAmount || 0))).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Processed
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Time:</span>
                      <span className="text-sm text-gray-900">{selectedNotification.time}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal()
                      onClose()
                      if (onNavigate) {
                        onNavigate('orders')
                      } else {
                        // Update URL to navigate to orders section
                        const currentUrl = new URL(window.location.href)
                        currentUrl.searchParams.set('section', 'orders')
                        window.location.href = currentUrl.pathname + currentUrl.search
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View {selectedNotification.items && selectedNotification.items.length > 1 ? 'Orders' : 'Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Detail Modal */}
        {selectedNotification.title === 'New Customer Review' && selectedNotification.reviewRating && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Star className="w-6 h-6 text-green-600 fill-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      New Customer Review
                    </h3>
                    <p className="text-sm text-gray-600">
                      You received a new review for your product.
                    </p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Review Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Rating:</span>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < (selectedNotification.reviewRating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {selectedNotification.reviewProduct && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Product:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedNotification.reviewProduct}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Time:</span>
                    <span className="text-sm text-gray-900">{selectedNotification.time}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      closeDetailModal()
                      onClose()
                      if (onNavigate) {
                        onNavigate('product-reviews')
                      } else {
                        // Update URL to navigate to product reviews section
                        const currentUrl = new URL(window.location.href)
                        currentUrl.searchParams.set('section', 'product-reviews')
                        window.location.href = currentUrl.pathname + currentUrl.search
                      }
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    View Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Update Modal */}
        {selectedNotification.title === 'System Update' && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
              <div className="p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Info className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      System Update
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedNotification.message}
                    </p>
                  </div>
                  <button
                    onClick={closeDetailModal}
                    className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">What's New:</h4>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Enhanced product management features</li>
                    <li>Improved inventory tracking</li>
                    <li>New analytics dashboard</li>
                    <li>Performance optimizations</li>
                  </ul>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
      )}
    </>
  )
}
