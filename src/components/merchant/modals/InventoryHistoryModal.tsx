'use client'
import { logger } from '@/lib/logger'

import React, { useState, useEffect, useCallback } from 'react'
import {
  X, Search, Calendar, Filter, Download,
  Package, TrendingUp, TrendingDown, RefreshCw,
  ChevronLeft, ChevronRight, Clock, User,
  FileText, Hash, ArrowUpDown
} from 'lucide-react'
import type { Product, ProductVariant } from '@/types/product.types'

interface InventoryHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product
  variant?: ProductVariant | null
  apiKey?: string
  appSecretKey?: string
  appId: number
}

interface InventoryMovement {
  id: number
  productId: number
  variantId?: number
  movementType: 'in' | 'out' | 'adjustment' | 'return' | 'damage' | 'order' | 'restock'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason?: string
  reference?: string
  notes?: string
  createdBy?: number
  createdAt: string
  user?: {
    id: number
    name?: string
    email?: string
  }
}

interface MovementsResponse {
  status: number
  data: InventoryMovement[]
  total?: number
  page?: number
  totalPages?: number
}

export default function InventoryHistoryModal({
  isOpen,
  onClose,
  product,
  variant,
  apiKey,
  appSecretKey,
  appId
}: InventoryHistoryModalProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalMovements, setTotalMovements] = useState(0)
  const [sortBy, setSortBy] = useState<'date' | 'quantity'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const itemsPerPage = 20

  const fetchMovements = useCallback(async () => {
    if (!apiKey || !appSecretKey || !isOpen) return

    try {
      setLoading(true)

      const headers: any = {
        'x-api-key': apiKey,
        'x-app-secret': appSecretKey,
        'x-app-id': appId.toString()
      }

      // Build query parameters
      const params = new URLSearchParams()
      params.append('productId', product.id.toString())
      if (variant?.id) {
        params.append('variantId', variant.id.toString())
      }
      params.append('limit', itemsPerPage.toString())
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString())

      const response = await fetch(`/api/proxy/v1/merchant/inventory/movements?${params.toString()}`, {
        headers
      })

      if (response.ok) {
        const data: MovementsResponse = await response.json()
        setMovements(data.data || [])

        // Calculate pagination
        const total = data.total || data.data?.length || 0
        setTotalMovements(total)
        setTotalPages(Math.ceil(total / itemsPerPage))
      } else {
        logger.error('Failed to fetch movements:', { value: response.statusText })
        setMovements([])
      }
    } catch (error) {
      logger.error('Error fetching movements:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setMovements([])
    } finally {
      setLoading(false)
    }
  }, [apiKey, appSecretKey, appId, product.id, variant?.id, currentPage, isOpen])

  useEffect(() => {
    if (isOpen) {
      fetchMovements()
    }
  }, [fetchMovements, isOpen])

  // Filter and search movements
  const filteredMovements = movements.filter(movement => {
    // Filter by type
    if (filterType !== 'all' && movement.movementType !== filterType) {
      return false
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        movement.reference?.toLowerCase().includes(search) ||
        movement.notes?.toLowerCase().includes(search) ||
        movement.reason?.toLowerCase().includes(search) ||
        movement.movementType.toLowerCase().includes(search)
      )
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const movementDate = new Date(movement.createdAt)
      if (dateFrom && movementDate < new Date(dateFrom)) return false
      if (dateTo && movementDate > new Date(dateTo + 'T23:59:59')) return false
    }

    return true
  }).sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    } else {
      return sortOrder === 'asc'
        ? Math.abs(a.quantity) - Math.abs(b.quantity)
        : Math.abs(b.quantity) - Math.abs(a.quantity)
    }
  })

  // Get movement type badge color
  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'out':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'adjustment':
        return 'bg-blue-100 text-blue-800 border-orange-200'
      case 'return':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'damage':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'order':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'restock':
        return 'bg-teal-100 text-teal-800 border-teal-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get movement type icon
  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
      case 'restock':
        return <TrendingUp className="w-4 h-4" />
      case 'out':
      case 'order':
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Reference', 'Notes', 'User']
    const rows = filteredMovements.map(m => [
      new Date(m.createdAt).toLocaleString(),
      m.movementType,
      m.quantity.toString(),
      m.previousQuantity.toString(),
      m.newQuantity.toString(),
      m.reference || '',
      m.notes || '',
      m.user?.email || m.user?.name || 'System'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-history-${product.name}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-10">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 mb-10 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Inventory History</h2>
              <p className="text-sm text-gray-600 mt-1">
                {product.name} {variant && `- ${variant.sku || 'Variant'}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Current Stock</p>
              <p className="text-lg font-semibold text-gray-900">
                {variant ? (variant.inventoryQuantity || 0) : (product.inventoryQuantity || 0)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Total Added</p>
              <p className="text-lg font-semibold text-green-700">
                +{movements.filter(m => ['in', 'return', 'restock'].includes(m.movementType))
                  .reduce((sum, m) => sum + Math.abs(m.quantity), 0)}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs text-red-600">Total Removed</p>
              <p className="text-lg font-semibold text-red-700">
                -{movements.filter(m => ['out', 'damage', 'order'].includes(m.movementType))
                  .reduce((sum, m) => sum + Math.abs(m.quantity), 0)}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <p className="text-xs text-orange-600">Total Movements</p>
              <p className="text-lg font-semibold text-orange-700">{totalMovements}</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <div className="flex flex-wrap gap-3">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by reference, notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
              <option value="return">Return</option>
              <option value="damage">Damage</option>
              <option value="order">Order</option>
              <option value="restock">Restock</option>
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="To"
            />

            {/* Actions */}
            <button
              onClick={fetchMovements}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Package className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-lg font-medium">No movements found</p>
              <p className="text-sm mt-1">Adjust your filters or search criteria</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <button
                      onClick={() => {
                        setSortBy('date')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Date/Time
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <button
                      onClick={() => {
                        setSortBy('quantity')
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                      }}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Quantity
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Before</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">After</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2 text-gray-900">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium">{new Date(movement.createdAt).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{new Date(movement.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${getMovementTypeBadge(movement.movementType)}`}>
                        {getMovementIcon(movement.movementType)}
                        {movement.movementType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.previousQuantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-medium text-gray-900">{movement.newQuantity}</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {movement.reference ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <Hash className="w-3 h-3" />
                          <span className="truncate max-w-[150px]">{movement.reference}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {movement.notes ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{movement.notes}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {movement.user ? (
                        <div className="flex items-center gap-1 text-gray-600">
                          <User className="w-3 h-3" />
                          <span>{movement.user.name || movement.user.email || 'User'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
            <p className="text-sm text-gray-700">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalMovements)} of {totalMovements} movements
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === pageNum
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}