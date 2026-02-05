'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Plus, Trash2, Search, Save } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import {
  useUpdatePurchaseOrder,
  useAddPurchaseOrderItem,
  useUpdatePurchaseOrderItem,
  useRemovePurchaseOrderItem,
} from '@/hooks/usePurchaseOrders'
import type { PurchaseOrder } from '@/types/purchase-order.types'
import type { Product } from '@/types/product.types'
import toast from 'react-hot-toast'

interface EditPurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder
  onSuccess?: () => void
}

export function EditPurchaseOrderModal({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess,
}: EditPurchaseOrderModalProps) {
  const [referenceNumber, setReferenceNumber] = useState(purchaseOrder.referenceNumber)
  const [estimatedArrival, setEstimatedArrival] = useState(
    purchaseOrder.estimatedArrival || ''
  )
  const [shippingCost, setShippingCost] = useState(
    Number(purchaseOrder.shippingCost || 0)
  )
  const [otherFees, setOtherFees] = useState(Number(purchaseOrder.otherFees || 0))
  const [notes, setNotes] = useState(purchaseOrder.noteToSupplier || '')

  // Product search for adding new items
  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  const updateMutation = useUpdatePurchaseOrder()
  const addItemMutation = useAddPurchaseOrderItem()
  const updateItemMutation = useUpdatePurchaseOrderItem()
  const removeItemMutation = useRemovePurchaseOrderItem()

  // Search products
  const handleProductSearch = useCallback(async () => {
    if (!productSearch.trim() || productSearch.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const response = await apiService.getProducts({
        search: productSearch,
        status: 'active',
        limit: 20,
      })

      if (response.ok && response.data) {
        const products = Array.isArray(response.data)
          ? response.data
          : response.data.data || response.data.products || []
        setSearchResults(products)
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Product search error:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [productSearch])

  useEffect(() => {
    const timer = setTimeout(handleProductSearch, 300)
    return () => clearTimeout(timer)
  }, [handleProductSearch])

  const handleAddItem = async (product: Product, variantId?: number) => {
    const variant = product.variants?.find((v) => v.id === variantId)

    // Check if item already exists
    const existingItem = purchaseOrder.items.find(
      (item) =>
        item.productId === product.id &&
        (variantId ? item.variantId === variantId : !item.variantId)
    )

    if (existingItem) {
      toast.error('Item already added to this purchase order')
      return
    }

    addItemMutation.mutate(
      {
        poId: purchaseOrder.id,
        data: {
          productId: product.id,
          variantId: variantId,
          quantity: 1,
          unitCost: product.costPrice || product.basePrice,
          taxPercent: 0,
        },
      },
      {
        onSuccess: () => {
          toast.success('Item added')
          setProductSearch('')
          setSearchResults([])
        },
        onError: () => {
          toast.error('Failed to add item')
        },
      }
    )
  }

  const handleUpdateItem = (itemId: number, field: 'quantity' | 'unitCost', value: number) => {
    updateItemMutation.mutate(
      {
        poId: purchaseOrder.id,
        itemId,
        data: { [field]: value },
      },
      {
        onSuccess: () => {
          toast.success('Item updated')
        },
        onError: () => {
          toast.error('Failed to update item')
        },
      }
    )
  }

  const handleRemoveItem = (itemId: number) => {
    const confirmed = window.confirm('Remove this item from the purchase order?')
    if (!confirmed) return

    removeItemMutation.mutate(
      {
        poId: purchaseOrder.id,
        itemId,
      },
      {
        onSuccess: () => {
          toast.success('Item removed')
        },
        onError: () => {
          toast.error('Failed to remove item')
        },
      }
    )
  }

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: purchaseOrder.id,
        data: {
          referenceNumber,
          estimatedArrival: estimatedArrival || undefined,
          shippingCost: shippingCost || undefined,
          otherFees: otherFees || undefined,
          noteToSupplier: notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success('Purchase order updated')
          onSuccess?.()
          onClose()
        },
        onError: () => {
          toast.error('Failed to update purchase order')
        },
      }
    )
  }

  if (!isOpen) return null

  const isSaving =
    updateMutation.isPending ||
    addItemMutation.isPending ||
    updateItemMutation.isPending ||
    removeItemMutation.isPending

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Edit Purchase Order</h2>
            <p className="text-sm text-gray-600">{purchaseOrder.referenceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isSaving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier (locked)
                </label>
                <input
                  type="text"
                  value={purchaseOrder.supplierSnapshot.company}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (locked)
                </label>
                <input
                  type="text"
                  value={purchaseOrder.locationSnapshot.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Arrival
                </label>
                <input
                  type="date"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Items ({purchaseOrder.items.length})
              </h3>
            </div>

            {/* Existing Items */}
            {purchaseOrder.items.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium w-24">Qty</th>
                      <th className="text-right p-3 font-medium w-32">
                        Unit Cost
                      </th>
                      <th className="text-right p-3 font-medium w-32">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrder.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">
                          <div className="font-medium">
                            {item.productSnapshot.name}
                          </div>
                          {item.productSnapshot.sku && (
                            <div className="text-xs text-gray-500">
                              SKU: {item.productSnapshot.sku}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            defaultValue={item.quantity}
                            onBlur={(e) =>
                              handleUpdateItem(
                                item.id!,
                                'quantity',
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            defaultValue={Number(item.unitCost)}
                            onBlur={(e) =>
                              handleUpdateItem(
                                item.id!,
                                'unitCost',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="p-3 text-right font-medium">
                          $
                          {(
                            Number(item.quantity) * Number(item.unitCost)
                          ).toFixed(2)}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleRemoveItem(item.id!)}
                            disabled={removeItemMutation.isPending}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Item */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add New Item
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to add..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                  {searchResults.map((product) => (
                    <div key={product.id} className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-gray-600">
                              SKU: {product.sku}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            Cost: ${product.costPrice || product.basePrice}
                          </div>
                        </div>
                        {!product.variants || product.variants.length === 0 ? (
                          <button
                            onClick={() => handleAddItem(product)}
                            disabled={addItemMutation.isPending}
                            className="ml-2 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                        ) : null}
                      </div>
                      {/* Variants */}
                      {product.variants && product.variants.length > 0 && (
                        <div className="mt-2 pl-4 space-y-1">
                          {product.variants.map((variant) => (
                            <div
                              key={variant.id}
                              className="flex items-center justify-between text-sm py-1"
                            >
                              <div>
                                <span className="text-gray-700">
                                  {variant.option1Value}
                                  {variant.option2Value &&
                                    ` / ${variant.option2Value}`}
                                </span>
                                {variant.sku && (
                                  <span className="text-gray-500 ml-2">
                                    ({variant.sku})
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleAddItem(product, variant.id)}
                                disabled={addItemMutation.isPending}
                                className="px-2 py-0.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Costs */}
          <div className="space-y-4">
            <h3 className="font-semibold">Additional Costs</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Cost
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Other Fees
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={otherFees}
                  onChange={(e) => setOtherFees(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes to Supplier
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add notes or special instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
