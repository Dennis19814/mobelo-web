'use client'

import { Activity, Clock, User, Package, ShoppingCart } from 'lucide-react'

interface ActivitySectionProps {
  appId: number
}

export default function ActivitySection({ appId }: ActivitySectionProps) {
  return (
    <div className="overflow-hidden -mt-3 md:-mt-4 lg:-mt-9">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activity</h1>
        <p className="text-gray-600">Track all activities and events in your app</p>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Log</h2>
            <div className="flex space-x-2">
              <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm">
                <option>All Activities</option>
                <option>Products</option>
                <option>Orders</option>
                <option>Users</option>
                <option>Settings</option>
              </select>
              <select className="px-3 py-1 border border-gray-200 rounded-lg text-sm">
                <option>Today</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>All Time</option>
              </select>
            </div>
          </div>

          {/* Sample Activity Items */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">System</span> initialized the merchant panel
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Just now</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">App</span> was accessed via merchant panel
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">1 minute ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Load More */}
          <div className="text-center mt-6">
            <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
              Load More Activities
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}