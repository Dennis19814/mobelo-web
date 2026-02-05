'use client'
import { logger } from '@/lib/logger'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMerchantAuth } from '@/hooks'
import {
  Package, Search, Plus, AlertCircle,
  RefreshCw, Calendar, Filter, Download, Upload,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { Pagination } from '../common'

interface PurchaseOrdersSectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

interface PurchaseOrder {
  id: number
  orderNumber: string
  supplierId?: number
  supplierName?: string
  status: 'draft' | 'sent' | 'received' | 'cancelled'
  totalAmount: number
  currency: string
  createdAt: string
  updatedAt: string
  estimatedArrival?: string
  referenceNumber?: string
}

const PurchaseOrdersSection = ({ appId, apiKey, appSecretKey }: PurchaseOrdersSectionProps) => {
  const router = useRouter()
  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API endpoint
      // const response = await apiService.getPurchaseOrders({ page, limit, search: searchTerm, status: statusFilter })
      
      // Mock data for now
      const mockOrders: PurchaseOrder[] = []
      setPurchaseOrders(mockOrders)
    } catch (err) {
      logger.error('Failed to fetch purchase orders:', { error: err instanceof Error ? err.message : String(err) })
      setError('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }, [page, limit, searchTerm, statusFilter])

  useEffect(() => {
    fetchPurchaseOrders()
  }, [fetchPurchaseOrders])

  // Filter purchase orders
  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(order => {
      const matchesSearch = !searchTerm || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = !statusFilter || order.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [purchaseOrders, searchTerm, statusFilter])

  // Paginate filtered orders
  const totalOrders = filteredOrders.length
  const totalPages = useMemo(() => Math.ceil(totalOrders / limit), [totalOrders, limit])
  const paginatedOrders = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredOrders.slice(startIndex, startIndex + limit)
  }, [filteredOrders, page, limit])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  const handleCreatePurchaseOrder = () => {
    const currentPath = window.location.pathname
    const pathMatch = currentPath.match(/\/merchant-panel\/([^\/]+)/)
    if (pathMatch && pathMatch[1]) {
      const hashedAppId = pathMatch[1]
      router.push(`/merchant-panel/${hashedAppId}?section=create-purchase-order`)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return styles[status as keyof typeof styles] || styles.draft
  }

  const formatCurrency = (amount: number, currency: string = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'LKR' ? 'LKR' : currency,
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'Rs')
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage your purchase orders and inventory receipts</p>
          </div>
          <button
            onClick={handleCreatePurchaseOrder}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create purchase order</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load purchase orders</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by order number, supplier, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <button
            onClick={() => fetchPurchaseOrders()}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Purchase Orders List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No purchase orders</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first purchase order.</p>
            <button
              onClick={handleCreatePurchaseOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create purchase order</span>
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Number</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.supplierName || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatCurrency(order.totalAmount, order.currency)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{order.referenceNumber || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button className="text-orange-600 hover:text-orange-700">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalOrders > 0 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <Pagination
                  totalItems={totalOrders}
                  currentPage={page}
                  totalPages={totalPages}
                  itemsPerPage={limit}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={handleLimitChange}
                  itemLabel="orders"
                  selectId="purchase-orders-per-page-select"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default PurchaseOrdersSection
