'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Plus,
  Loader2,
  Eye,
  Edit2,
  Trash2,
  CheckCircle,
  Package,
  XCircle,
  Filter,
  Calendar,
} from 'lucide-react'
import {
  usePurchaseOrders,
  useDeletePurchaseOrder,
  useMarkPurchaseOrderAsOrdered,
  useClosePurchaseOrder,
} from '@/hooks/usePurchaseOrders'
import { useActiveSuppliers } from '@/hooks/useSuppliers'
import { useActiveLocations } from '@/hooks/useLocations'
import type { PurchaseOrder, PurchaseOrderStatus } from '@/types/purchase-order.types'
import {
  ReceiveItemsModal,
  PurchaseOrderDetailsModal,
} from '../modals/PurchaseOrderModals'
import toast from 'react-hot-toast'

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-blue-100 text-blue-700',
  ordered: 'bg-orange-100 text-orange-700',
  partial: 'bg-purple-100 text-purple-700',
  received: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Draft',
  ordered: 'Ordered',
  partial: 'Partially Received',
  received: 'Received',
  closed: 'Closed',
}

export default function PurchaseOrdersSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all')
  const [supplierFilter, setSupplierFilter] = useState<number | 'all'>('all')
  const [locationFilter, setLocationFilter] = useState<number | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [viewingPO, setViewingPO] = useState<PurchaseOrder | null>(null)
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null)

  const handleCreatePurchaseOrder = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('section', 'create-purchase-order')
    router.push(currentUrl.pathname + currentUrl.search)
  }

  // Fetch data
  const { data: purchaseOrdersData, isLoading, error } = usePurchaseOrders({
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    supplierId: supplierFilter !== 'all' ? supplierFilter : undefined,
    locationId: locationFilter !== 'all' ? locationFilter : undefined,
    limit: 100,
  })

  const { data: suppliersData } = useActiveSuppliers()
  const { data: locationsData } = useActiveLocations()

  const purchaseOrders = purchaseOrdersData?.data || []
  const suppliers = suppliersData?.data || []
  const locations = locationsData?.data || []

  const deleteMutation = useDeletePurchaseOrder()
  const markAsOrderedMutation = useMarkPurchaseOrderAsOrdered()
  const closeMutation = useClosePurchaseOrder()

  const handleDelete = useCallback(async (po: PurchaseOrder) => {
    if (po.status !== 'draft') {
      toast.error('Only draft purchase orders can be deleted')
      return
    }

    const confirmed = window.confirm(
      `Delete Purchase Order ${po.referenceNumber}?\n\nThis action cannot be undone.`
    )
    if (!confirmed) return

    deleteMutation.mutate(po.id)
  }, [deleteMutation])

  const handleMarkAsOrdered = useCallback(async (po: PurchaseOrder) => {
    if (po.status !== 'draft') {
      toast.error('Only draft purchase orders can be marked as ordered')
      return
    }

    const confirmed = window.confirm(
      `Mark Purchase Order ${po.referenceNumber} as ordered?\n\nThis will lock the supplier and location, and add items to incoming stock.`
    )
    if (!confirmed) return

    markAsOrderedMutation.mutate(po.id)
  }, [markAsOrderedMutation])

  const handleClose = useCallback(async (po: PurchaseOrder) => {
    if (!['ordered', 'partial', 'received'].includes(po.status)) {
      toast.error('Only ordered, partial, or received purchase orders can be closed')
      return
    }

    const confirmed = window.confirm(
      `Close Purchase Order ${po.referenceNumber}?\n\nThis will remove any unreceived items from incoming stock.`
    )
    if (!confirmed) return

    closeMutation.mutate(po.id)
  }, [closeMutation])

  const calculateProgress = (po: PurchaseOrder) => {
    const totalItems = po.items.length
    const receivedItems = po.items.filter((item) => item.receivedQuantity >= item.quantity).length
    const percentage = totalItems > 0 ? Math.round((receivedItems / totalItems) * 100) : 0
    return { totalItems, receivedItems, percentage }
  }

  return (
    <div className="overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="mb-8 ">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage purchase orders and receiving</p>
          </div>
          <button
            onClick={handleCreatePurchaseOrder}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Purchase Order
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-3 pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference number or supplier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="ordered">Ordered</option>
                  <option value="partial">Partially Received</option>
                  <option value="received">Received</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Suppliers</option>
                  {suppliers.map((s: { id: number; company: string }) => (
                    <option key={s.id} value={s.id}>{s.company}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Locations</option>
                  {locations.map((l: { id: number; name: string }) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          Failed to load purchase orders. Please try again.
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && purchaseOrders.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No purchase orders found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters' : 'Get started by creating your first purchase order'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={handleCreatePurchaseOrder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Plus className="w-4 h-4" />
              Create Purchase Order
            </button>
          )}
        </div>
      )}

      {/* Purchase Orders Table */}
      {!isLoading && !error && purchaseOrders.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm -mt-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Est. Arrival
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {purchaseOrders.map((po: PurchaseOrder) => {
                  const progress = calculateProgress(po)
                  return (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {po.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {po.supplierSnapshot.company}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {po.locationSnapshot.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[po.status]}`}>
                          {STATUS_LABELS[po.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        ${typeof po.total === 'number' ? po.total.toFixed(2) : Number(po.total || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {po.status === 'draft' ? (
                          <span className="text-gray-400">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                              <div
                                className={`h-2 rounded-full ${
                                  progress.percentage === 100 ? 'bg-green-500' : 'bg-orange-500'
                                }`}
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {progress.receivedItems}/{progress.totalItems}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {po.estimatedArrival ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(po.estimatedArrival).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingPO(po)}
                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {po.status === 'draft' && (
                            <>
                              <button
                                onClick={() => {
                                  const currentUrl = new URL(window.location.href)
                                  currentUrl.searchParams.set('section', 'edit-purchase-order')
                                  currentUrl.searchParams.set('poId', po.id.toString())
                                  router.push(currentUrl.pathname + currentUrl.search)
                                }}
                                className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMarkAsOrdered(po)}
                                disabled={markAsOrderedMutation.isPending}
                                className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                                title="Mark as ordered"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(po)}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {['ordered', 'partial'].includes(po.status) && (
                            <>
                              <button
                                onClick={() => setReceivingPO(po)}
                                className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded"
                                title="Receive items"
                              >
                                <Package className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleClose(po)}
                                disabled={closeMutation.isPending}
                                className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                                title="Close PO"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {po.status === 'received' && (
                            <button
                              onClick={() => handleClose(po)}
                              disabled={closeMutation.isPending}
                              className="p-1.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded"
                              title="Close PO"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingPO && (
        <PurchaseOrderDetailsModal
          isOpen={true}
          purchaseOrder={viewingPO}
          onClose={() => setViewingPO(null)}
        />
      )}

      {/* Receive Items Modal */}
      {receivingPO && (
        <ReceiveItemsModal
          isOpen={true}
          purchaseOrder={receivingPO}
          onClose={() => setReceivingPO(null)}
        />
      )}
    </div>
  )
}

