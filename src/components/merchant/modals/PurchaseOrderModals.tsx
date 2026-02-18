'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  X,
  Loader2,
  Plus,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertCircle,
  Check,
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  useAddPurchaseOrderItem,
  useUpdatePurchaseOrderItem,
  useRemovePurchaseOrderItem,
  useReceivePurchaseOrderItems,
} from '@/hooks/usePurchaseOrders'
import { useActiveSuppliers } from '@/hooks/useSuppliers'
import { useActiveLocations } from '@/hooks/useLocations'
import type {
  PurchaseOrder,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  Location,
  Supplier,
} from '@/types/purchase-order.types'
import type { Product } from '@/types/product.types'
import toast from 'react-hot-toast'

// ============================================================================
// CREATE PURCHASE ORDER MODAL
// ============================================================================

interface CreatePurchaseOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (po: PurchaseOrder) => void
}

interface POItem {
  productId: number
  productName: string
  productSku?: string
  variantId?: number
  variantName?: string
  quantity: number
  unitCost: number
  taxPercent: number
}

export function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePurchaseOrderModalProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<{
    supplierId: number | null
    locationId: number | null
    referenceNumber: string
    estimatedArrival: string
    shippingCost: number
    otherFees: number
    notes: string
    items: POItem[]
  }>({
    supplierId: null,
    locationId: null,
    referenceNumber: '',
    estimatedArrival: '',
    shippingCost: 0,
    otherFees: 0,
    notes: '',
    items: [],
  })

  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)

  const { data: suppliersData } = useActiveSuppliers()
  const { data: locationsData } = useActiveLocations()
  const createMutation = useCreatePurchaseOrder()

  const suppliers = suppliersData?.data || []
  const locations = locationsData?.data || []

  // Generate reference number on mount
  useEffect(() => {
    if (isOpen && !formData.referenceNumber) {
      const refNum = `PO-${Date.now().toString().slice(-8)}`
      setFormData((prev) => ({ ...prev, referenceNumber: refNum }))
    }
  }, [isOpen, formData.referenceNumber])

  // Search products
  const handleProductSearch = useCallback(async () => {
    if (!productSearch.trim() || productSearch.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      console.log('[CreatePO] Searching products with query:', productSearch)
      const response = await apiService.getProducts({
        search: productSearch,
        status: 'active',
        limit: 20,
      })

      console.log('[CreatePO] Product search response:', response)

      if (response.ok && response.data) {
        // Handle both paginated and non-paginated responses
        const products = Array.isArray(response.data)
          ? response.data
          : (response.data.data || response.data.products || [])

        console.log('[CreatePO] Found products:', products.length)
        setSearchResults(products)
      } else {
        console.warn('[CreatePO] Product search failed:', response)
        setSearchResults([])
        if (!response.ok) {
          toast.error('Failed to search products')
        }
      }
    } catch (error) {
      console.error('[CreatePO] Product search error:', error)
      toast.error('Failed to search products')
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [productSearch])

  useEffect(() => {
    const timer = setTimeout(handleProductSearch, 300)
    return () => clearTimeout(timer)
  }, [handleProductSearch])

  const handleAddItem = (product: Product, variantId?: number) => {
    const variant = product.variants?.find((v) => v.id === variantId)
    const existingIndex = formData.items.findIndex(
      (item) =>
        item.productId === product.id &&
        (variantId ? item.variantId === variantId : !item.variantId)
    )

    if (existingIndex >= 0) {
      toast.error('Item already added')
      return
    }

    const newItem: POItem = {
      productId: product.id,
      productName: product.name,
      productSku: variant?.sku || product.sku,
      variantId: variantId,
      variantName: variant
        ? `${variant.option1Value || ''}${variant.option2Value ? ' / ' + variant.option2Value : ''}`
        : undefined,
      quantity: 1,
      unitCost: product.costPrice || product.basePrice,
      taxPercent: 0,
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
    setProductSearch('')
    setSearchResults([])
    toast.success('Item added')
  }

  const handleUpdateItem = (index: number, field: keyof POItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const totalCost = useMemo(() => {
    const itemsTotal = formData.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
      0
    )
    return itemsTotal + Number(formData.shippingCost) + Number(formData.otherFees)
  }, [formData.items, formData.shippingCost, formData.otherFees])

  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error('Please select a supplier')
      return
    }
    if (!formData.locationId) {
      toast.error('Please select a location')
      return
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    const dto: CreatePurchaseOrderDto = {
      supplierId: formData.supplierId,
      locationId: formData.locationId,
      referenceNumber: formData.referenceNumber,
      estimatedArrival: formData.estimatedArrival || undefined,
      shippingCost: formData.shippingCost || undefined,
      otherFees: formData.otherFees || undefined,
      noteToSupplier: formData.notes || undefined,
      items: formData.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitCost: item.unitCost,
        taxPercent: item.taxPercent,
      })),
    }

    createMutation.mutate(dto, {
      onSuccess: (response) => {
        toast.success('Purchase order created successfully')
        onSuccess?.(response as any)
        handleClose()
      },
      onError: () => {
        toast.error('Failed to create purchase order')
      },
    })
  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      supplierId: null,
      locationId: null,
      referenceNumber: '',
      estimatedArrival: '',
      shippingCost: 0,
      otherFees: 0,
      notes: '',
      items: [],
    })
    setProductSearch('')
    setSearchResults([])
    onClose()
  }

  if (!isOpen) return null

  const canProceedStep1 = formData.supplierId && formData.locationId
  const canProceedStep2 = formData.items.length > 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Create Purchase Order</h2>
            <p className="text-sm text-gray-600">
              Step {step} of 3
              {step === 1 && ' - Basic Information'}
              {step === 2 && ' - Add Items'}
              {step === 3 && ' - Review & Create'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={createMutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier *
                </label>
                <select
                  value={formData.supplierId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplierId: Number(e.target.value) || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier: Supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.company}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Receiving Location *
                </label>
                <select
                  value={formData.locationId || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      locationId: Number(e.target.value) || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select location</option>
                  {locations.map((location: Location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, referenceNumber: e.target.value })
                  }
                  placeholder="PO-12345678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Arrival Date
                </label>
                <input
                  type="date"
                  value={formData.estimatedArrival}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      estimatedArrival: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Add Items */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Product Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Products
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Type at least 2 characters to search..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {productSearch.length > 0 && productSearch.length < 2 && (
                  <p className="text-xs text-gray-500 mt-1">Type at least 2 characters to search</p>
                )}

                {/* Search Results */}
                {productSearch.length >= 2 && !searching && searchResults.length === 0 && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
                    No products found. Try a different search term.
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="mt-2 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                    {searchResults.map((product) => (
                      <div key={product.id}>
                        <div className="p-3 hover:bg-gray-50 border-b last:border-b-0">
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
                                className="ml-2 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
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
                                    onClick={() =>
                                      handleAddItem(product, variant.id)
                                    }
                                    className="px-2 py-0.5 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                                  >
                                    Add
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Added Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items ({formData.items.length})
                  </label>
                </div>

                {formData.items.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 text-sm">
                      No items added yet. Search and add products above.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 font-medium">Product</th>
                          <th className="text-right p-2 font-medium w-24">
                            Qty
                          </th>
                          <th className="text-right p-2 font-medium w-28">
                            Unit Cost
                          </th>
                          <th className="text-right p-2 font-medium w-28">
                            Total
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              <div className="font-medium">{item.productName}</div>
                              {item.variantName && (
                                <div className="text-xs text-gray-600">
                                  {item.variantName}
                                </div>
                              )}
                              {item.productSku && (
                                <div className="text-xs text-gray-500">
                                  SKU: {item.productSku}
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    index,
                                    'quantity',
                                    parseInt(e.target.value) || 1
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitCost}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    index,
                                    'unitCost',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                              />
                            </td>
                            <td className="p-2 text-right font-medium">
                              ${(Number(item.quantity) * Number(item.unitCost)).toFixed(2)}
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => handleRemoveItem(index)}
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
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Order Summary</h3>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Supplier:</span>
                    <div className="font-medium">
                      {
                        suppliers.find((s: Supplier) => s.id === formData.supplierId)
                          ?.company
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <div className="font-medium">
                      {
                        locations.find((l: Location) => l.id === formData.locationId)
                          ?.name
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Reference:</span>
                    <div className="font-medium">{formData.referenceNumber}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Arrival:</span>
                    <div className="font-medium">
                      {formData.estimatedArrival || 'Not set'}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Items ({formData.items.length})</span>
                    <span className="font-medium">
                      $
                      {formData.items
                        .reduce((sum, item) => sum + item.quantity * item.unitCost, 0)
                        .toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Shipping Cost</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.shippingCost}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shippingCost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded text-right mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600">Other Fees</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.otherFees}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          otherFees: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-1 border border-gray-300 rounded text-right mt-1"
                    />
                  </div>

                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total</span>
                    <span>${Number(totalCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                  placeholder="Add any notes or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1 || createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2)
                }
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create Purchase Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// RECEIVE ITEMS MODAL
// ============================================================================

interface ReceiveItemsModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder
}

export function ReceiveItemsModal({
  isOpen,
  onClose,
  purchaseOrder,
}: ReceiveItemsModalProps) {
  const [receivingData, setReceivingData] = useState<
    Array<{
      itemId: number
      productName: string
      variantName?: string
      ordered: number
      received: number
      receiving: number
    }>
  >([])
  const [notes, setNotes] = useState('')

  const receiveMutation = useReceivePurchaseOrderItems()

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      const data = purchaseOrder.items.map((item) => ({
        itemId: item.id!,
        productName: item.productSnapshot.name,
        variantName: undefined, // Variant info not available in snapshot
        ordered: item.quantity,
        received: item.receivedQuantity || 0,
        receiving: Math.max(0, item.quantity - (item.receivedQuantity || 0)),
      }))
      setReceivingData(data)
    }
  }, [isOpen, purchaseOrder])

  const handleUpdateReceiving = (index: number, value: number) => {
    setReceivingData((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, receiving: Math.max(0, Math.min(value, item.ordered - item.received)) }
          : item
      )
    )
  }

  const handleReceiveAll = () => {
    setReceivingData((prev) =>
      prev.map((item) => ({
        ...item,
        receiving: item.ordered - item.received,
      }))
    )
  }

  const totalReceiving = useMemo(
    () => receivingData.reduce((sum, item) => sum + item.receiving, 0),
    [receivingData]
  )

  const handleSubmit = async () => {
    if (totalReceiving === 0) {
      toast.error('Please enter quantities to receive')
      return
    }

    const items = receivingData
      .filter((item) => item.receiving > 0)
      .map((item) => ({
        itemId: item.itemId,
        quantity: item.receiving,
      }))

    receiveMutation.mutate(
      {
        poId: purchaseOrder.id,
        data: {
          items,
        },
      },
      {
        onSuccess: () => {
          toast.success('Items received successfully')
          onClose()
        },
        onError: () => {
          toast.error('Failed to receive items')
        },
      }
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Receive Items</h2>
            <p className="text-sm text-gray-600">
              PO: {purchaseOrder.referenceNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={receiveMutation.isPending}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Enter the quantities you're receiving
            </p>
            <button
              onClick={handleReceiveAll}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
            >
              Receive All Remaining
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium">Product</th>
                  <th className="text-right p-3 font-medium w-20">Ordered</th>
                  <th className="text-right p-3 font-medium w-20">
                    Previously
                  </th>
                  <th className="text-right p-3 font-medium w-24">Receiving</th>
                  <th className="text-right p-3 font-medium w-20">
                    Remaining
                  </th>
                </tr>
              </thead>
              <tbody>
                {receivingData.map((item, index) => {
                  const remaining = item.ordered - item.received - item.receiving
                  return (
                    <tr key={item.itemId} className="border-t">
                      <td className="p-3">
                        <div className="font-medium">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-xs text-gray-600">
                            {item.variantName}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">{item.ordered}</td>
                      <td className="p-3 text-right text-gray-600">
                        {item.received}
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max={item.ordered - item.received}
                          value={item.receiving}
                          onChange={(e) =>
                            handleUpdateReceiving(
                              index,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-right"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            remaining === 0 ? 'text-green-600' : 'text-gray-900'
                          }
                        >
                          {remaining}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Add notes about this receiving..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          {totalReceiving > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Receiving {totalReceiving} item
                  {totalReceiving !== 1 ? 's' : ''} total
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 p-4 border-t">
          <button
            onClick={onClose}
            disabled={receiveMutation.isPending}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={receiveMutation.isPending || totalReceiving === 0}
            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {receiveMutation.isPending && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Receive Items
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// PURCHASE ORDER DETAILS MODAL
// ============================================================================

interface PurchaseOrderDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseOrder: PurchaseOrder
}

export function PurchaseOrderDetailsModal({
  isOpen,
  onClose,
  purchaseOrder,
}: PurchaseOrderDetailsModalProps) {
  const receiveMutation = useReceivePurchaseOrderItems()

  if (!isOpen) return null

  // Normalize shippingCost, otherFees, and totalTax from API response (may be null, undefined, or under different keys)
  const raw = purchaseOrder as any
  const shippingCost = Number(raw.shippingCost ?? raw.shipping_cost ?? 0)
  const otherFees = Number(raw.otherFees ?? raw.other_fees ?? 0)
  const totalTax = Number(raw.totalTax ?? raw.total_tax ?? 0)

  const itemsTotal = purchaseOrder.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
    0
  )
  
  // Use backend-calculated total if available (it includes shipping and fees), otherwise calculate it
  const calculatedTotal = itemsTotal + shippingCost + otherFees
  const total = purchaseOrder.total != null && purchaseOrder.total > 0
    ? purchaseOrder.total
    : calculatedTotal
  
  // Debug log to help diagnose discrepancies
  if (process.env.NODE_ENV === 'development' || typeof window !== 'undefined') {
    console.log('[PurchaseOrderDetails] Total calculation:', {
      itemsTotal,
      shippingCost,
      otherFees,
      calculatedTotal,
      backendTotal: purchaseOrder.total,
      usingBackendTotal: purchaseOrder.total != null && purchaseOrder.total > 0,
      finalTotal: total,
      rawShippingCost: raw.shippingCost,
      rawOtherFees: raw.otherFees
    })
  }

  const totalOrdered = purchaseOrder.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  )
  const totalReceived = purchaseOrder.items.reduce(
    (sum, item) => sum + (item.receivedQuantity || 0),
    0
  )
  const totalRemaining = totalOrdered - totalReceived
  const progressPercent =
    totalOrdered > 0 ? Math.round((totalReceived / totalOrdered) * 100) : 0

  const handleMarkAllReceived = async () => {
    // Calculate remaining quantities for each item
    const items = purchaseOrder.items
      .map(item => ({
        itemId: item.id,
        quantity: item.quantity - (item.receivedQuantity || 0),
      }))
      .filter(item => item.quantity > 0) // Only items with remaining qty

    if (items.length === 0) {
      toast('All items already received')
      return
    }

    // Show confirmation
    const confirmed = window.confirm(
      `Mark all remaining items as received?\n\n` +
      `This will add ${totalRemaining} item${totalRemaining !== 1 ? 's' : ''} to inventory.`
    )

    if (!confirmed) return

    // Call API
    receiveMutation.mutate(
      {
        poId: purchaseOrder.id,
        data: { items },
      },
      {
        onSuccess: () => {
          toast.success('All items received successfully', { icon: '📦' })
          onClose()
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to receive items')
        },
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Purchase Order Details</h2>
            <p className="text-sm text-gray-600">{purchaseOrder.referenceNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-medium capitalize">{purchaseOrder.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Supplier</div>
              <div className="font-medium">
                {purchaseOrder.supplierSnapshot.company}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Location</div>
              <div className="font-medium">
                {purchaseOrder.locationSnapshot.name}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Est. Arrival</div>
              <div className="font-medium">
                {purchaseOrder.estimatedArrival
                  ? new Date(purchaseOrder.estimatedArrival).toLocaleDateString()
                  : 'Not set'}
              </div>
            </div>
          </div>

          {/* Progress */}
          {(purchaseOrder.status === 'ordered' ||
            purchaseOrder.status === 'partial' ||
            purchaseOrder.status === 'received') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Receiving Progress</span>
                <span className="font-medium">
                  {totalReceived} / {totalOrdered} items ({progressPercent}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-2">Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium w-20">Qty</th>
                    <th className="text-right p-3 font-medium w-20">
                      Received
                    </th>
                    <th className="text-right p-3 font-medium w-24">
                      Unit Cost
                    </th>
                    <th className="text-right p-3 font-medium w-24">Total</th>
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
                          <div className="text-xs text-gray-600">
                            SKU: {item.productSnapshot.sku}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">{item.quantity}</td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            item.receivedQuantity === item.quantity
                              ? 'text-green-600 font-medium'
                              : ''
                          }
                        >
                          {item.receivedQuantity || 0}
                        </span>
                      </td>
                      <td className="p-3 text-right">${Number(item.unitCost).toFixed(2)}</td>
                      <td className="p-3 text-right font-medium">
                        ${(Number(item.quantity) * Number(item.unitCost)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Costs */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items Subtotal</span>
              <span className="font-medium">${Number(itemsTotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span className="font-medium">${totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping Cost</span>
              <span className="font-medium">
                ${shippingCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Other Fees</span>
              <span className="font-medium">
                ${otherFees.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total</span>
              <span>${Number(total).toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {purchaseOrder.noteToSupplier && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                {purchaseOrder.noteToSupplier}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t">
          {/* Show Mark All as Received button for ordered/partial status with remaining items */}
          {(purchaseOrder.status === 'ordered' || purchaseOrder.status === 'partial') &&
          totalRemaining > 0 ? (
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={receiveMutation.isPending}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>
              <button
                onClick={handleMarkAllReceived}
                disabled={receiveMutation.isPending}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {receiveMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {receiveMutation.isPending ? 'Receiving...' : 'Mark All as Received'}
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
