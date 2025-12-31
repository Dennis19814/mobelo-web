'use client'

import { Bell, CheckCircle, Info, ShoppingCart, Package, DollarSign } from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'warning' | 'info' | 'order'
  time: string
  read: boolean
  icon?: React.ReactNode
}

interface NotificationsModalProps {
  isOpen: boolean
  onClose: () => void
}

// Dummy notifications data
const dummyNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Order Received',
    message: 'Order #12345 has been placed successfully. Total: $299.99',
    type: 'order',
    time: '2 minutes ago',
    read: false,
    icon: <ShoppingCart className="w-5 h-5" />
  },
  {
    id: '2',
    title: 'Low Stock Alert',
    message: 'Product "Wireless Headphones" is running low. Only 5 items left in stock.',
    type: 'warning',
    time: '15 minutes ago',
    read: false,
    icon: <Package className="w-5 h-5" />
  },
  {
    id: '3',
    title: 'Payment Received',
    message: 'Payment of $1,250.00 has been successfully processed.',
    type: 'success',
    time: '1 hour ago',
    read: true,
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: '4',
    title: 'System Update',
    message: 'Your merchant panel has been updated with new features. Check out the latest improvements!',
    type: 'info',
    time: '3 hours ago',
    read: true,
    icon: <Info className="w-5 h-5" />
  },
  {
    id: '5',
    title: 'Order Shipped',
    message: 'Order #12340 has been shipped and is on its way to the customer.',
    type: 'success',
    time: '5 hours ago',
    read: true,
    icon: <Package className="w-5 h-5" />
  },
  {
    id: '6',
    title: 'New Customer Review',
    message: 'You received a 5-star review for "Premium Bluetooth Speaker".',
    type: 'success',
    time: '1 day ago',
    read: true,
    icon: <CheckCircle className="w-5 h-5" />
  }
]

export default function NotificationsModal({ 
  isOpen, 
  onClose 
}: NotificationsModalProps) {
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

  const unreadCount = dummyNotifications.filter(n => !n.read).length

  if (!isOpen) return null

  return (
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
        {dummyNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          dummyNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                notification.read ? 'opacity-70' : ''
              } ${getNotificationStyles(notification.type)}`}
              onClick={onClose}
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
      {dummyNotifications.length > 0 && (
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-semibold hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
          >
            Mark All as Read
          </button>
        </div>
      )}
    </div>
  )
}
