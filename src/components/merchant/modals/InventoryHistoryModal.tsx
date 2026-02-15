'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ArrowUp, ArrowDown, Package, TrendingUp, TrendingDown, AlertTriangle, RotateCcw, ShoppingCart } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { format } from 'date-fns'

interface InventoryMovement {
  id: number
  movementType: 'in' | 'out' | 'adjustment' | 'return' | 'damage' | 'order' | 'restock' | 'incoming'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason?: string
  reference?: string
  notes?: string
  createdAt: string
  location?: {
    id: number
    name: string
    address?: string
  }
  user?: {
    id: number
    firstName?: string
    lastName?: string
    email?: string
  }
}

interface InventoryHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
  variantId?: number
  productName: string
  variantName?: string
}

export default function InventoryHistoryModal({
  isOpen,
  onClose,
  productId,
  variantId,
  productName,
  variantName
}: InventoryHistoryModalProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadMovements()
    }
  }, [isOpen, productId, variantId])

  const loadMovements = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await apiService.getInventoryMovements({
        productId,
        variantId,
        limit: 100
      })

      if (response.ok && response.data) {
        // Backend returns { status: 200, data: [...] }, so extract the data array
        const movementsData = Array.isArray(response.data)
          ? response.data
          : response.data.data || []
        setMovements(movementsData)
      } else {
        setError('Failed to load inventory history')
      }
    } catch (err) {
      console.error('Failed to load inventory movements:', err)
      setError('Failed to load inventory history')
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type: InventoryMovement['movementType']) => {
    switch (type) {
      case 'in':
        return <ArrowDown className="w-4 h-4 text-green-600" />
      case 'out':
        return <ArrowUp className="w-4 h-4 text-red-600" />
      case 'order':
        return <ShoppingCart className="w-4 h-4 text-orange-600" />
      case 'return':
        return <RotateCcw className="w-4 h-4 text-blue-600" />
      case 'damage':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'restock':
      case 'incoming':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'adjustment':
      default:
        return <Package className="w-4 h-4 text-gray-600" />
    }
  }

  const getMovementLabel = (type: InventoryMovement['movementType']) => {
    switch (type) {
      case 'in':
        return 'Stock In'
      case 'out':
        return 'Stock Out'
      case 'order':
        return 'Order Reserved'
      case 'return':
        return 'Order Returned'
      case 'damage':
        return 'Damaged'
      case 'restock':
        return 'Restocked'
      case 'incoming':
        return 'Incoming'
      case 'adjustment':
      default:
        return 'Adjustment'
    }
  }

  const getMovementColor = (type: InventoryMovement['movementType']) => {
    switch (type) {
      case 'in':
      case 'restock':
      case 'incoming':
      case 'return':
        return 'text-green-700 bg-green-50'
      case 'out':
      case 'damage':
        return 'text-red-700 bg-red-50'
      case 'order':
        return 'text-orange-700 bg-orange-50'
      case 'adjustment':
      default:
        return 'text-gray-700 bg-gray-50'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Inventory Adjustment History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {productName}
              {variantName && <span className="text-gray-400"> • {variantName}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <p className="text-red-700">{error}</p>
                <button
                  onClick={loadMovements}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : movements.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No History Yet</h3>
                <p className="text-gray-600">
                  Inventory movements will appear here once stock changes occur.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {getMovementIcon(movement.movementType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getMovementColor(movement.movementType)}`}>
                            {getMovementLabel(movement.movementType)}
                          </span>
                          {movement.location && (
                            <span className="text-xs text-gray-600">
                              📍 {movement.location.name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {format(new Date(movement.createdAt), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{movement.previousQuantity}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-sm font-semibold text-gray-900">{movement.newQuantity}</span>
                      </div>
                      <span className={`text-xs font-medium ${movement.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </span>
                    </div>
                  </div>

                  {(movement.reason || movement.reference || movement.notes) && (
                    <div className="text-sm space-y-1">
                      {movement.reason && (
                        <p className="text-gray-700">
                          <span className="font-medium">Reason:</span> {movement.reason}
                        </p>
                      )}
                      {movement.reference && (
                        <p className="text-gray-600">
                          <span className="font-medium">Reference:</span> {movement.reference}
                        </p>
                      )}
                      {movement.notes && (
                        <p className="text-gray-600">
                          <span className="font-medium">Notes:</span> {movement.notes}
                        </p>
                      )}
                      {movement.user && (
                        <p className="text-gray-500 text-xs">
                          By: {movement.user.firstName && movement.user.lastName
                            ? `${movement.user.firstName} ${movement.user.lastName}`
                            : movement.user.email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {movements.length} {movements.length === 1 ? 'movement' : 'movements'} found
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
