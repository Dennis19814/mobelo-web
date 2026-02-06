'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  Trash2,
  Search,
  Package,
  FileText,
  ArrowRight,
  X,
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import {
  useCreatePurchaseOrder,
} from '@/hooks/usePurchaseOrders'
import SupplierSelector from '@/components/merchant/SupplierSelector'
import LocationSelector from '@/components/merchant/LocationSelector'
import SimpleDropdown from '@/components/merchant/SimpleDropdown'
import type {
  CreatePurchaseOrderDto,
  Supplier,
} from '@/types/purchase-order.types'
import type { Product } from '@/types/product.types'
import toast from 'react-hot-toast'

interface POItem {
  productId: number
  productName: string
  productSku?: string
  productThumbnailUrl?: string
  variantId?: number
  variantName?: string
  quantity: number
  unitCost: number
  taxPercent: number
}

const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD $)' },
  { value: 'EUR', label: 'Euro (EUR €)' },
  { value: 'GBP', label: 'British Pound (GBP £)' },
  { value: 'LKR', label: 'Sri Lankan Rupee (LKR Rs)' },
  { value: 'INR', label: 'Indian Rupee (INR ₹)' },
  { value: 'AUD', label: 'Australian Dollar (AUD $)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD $)' },
  { value: 'JPY', label: 'Japanese Yen (JPY ¥)' },
]

const PAYMENT_TERMS = [
  { value: '', label: 'None' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_45', label: 'Net 45' },
  { value: 'net_60', label: 'Net 60' },
  { value: 'due_on_receipt', label: 'Due on receipt' },
]

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<{
    supplierId: number | null
    locationId: number | null
    supplierCurrency: string
    referenceNumber: string
    estimatedArrival: string
    shippingCarrier: string
    trackingNumber: string
    shippingCost: number
    customsDuties: number
    otherFees: number
    notes: string
    tags: string
    items: POItem[]
  }>({
    supplierId: null,
    locationId: null,
    supplierCurrency: 'LKR',
    referenceNumber: '',
    estimatedArrival: '',
    shippingCarrier: '',
    trackingNumber: '',
    shippingCost: 0,
    customsDuties: 0,
    otherFees: 0,
    notes: '',
    tags: '',
    items: [],
  })

  const [productSearch, setProductSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searching, setSearching] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingShipping, setEditingShipping] = useState(false)
  const [paymentTerms, setPaymentTerms] = useState('')
  
  // Product modal state
  const [modalProductSearch, setModalProductSearch] = useState('')
  const [modalProducts, setModalProducts] = useState<Product[]>([])
  const [modalSearching, setModalSearching] = useState(false)
  const [selectedVariants, setSelectedVariants] = useState<Map<string, { product: Product; variantId?: number }>>(new Map())

  const createMutation = useCreatePurchaseOrder()

  // Generate reference number on mount
  useEffect(() => {
    if (!formData.referenceNumber) {
      const refNum = `PO-${Date.now().toString().slice(-8)}`
      setFormData((prev) => ({ ...prev, referenceNumber: refNum }))
    }
  }, [formData.referenceNumber])

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
          : (response.data.data || response.data.products || [])

        setSearchResults(products)
      } else {
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
      productThumbnailUrl: product.thumbnailUrl,
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

  // Modal product search
  const handleModalProductSearch = useCallback(async () => {
    setModalSearching(true)
    try {
      const response = await apiService.getProducts({
        search: modalProductSearch || undefined,
        status: 'active',
        limit: 100,
      })

      if (response.ok && response.data) {
        const products = Array.isArray(response.data)
          ? response.data
          : (response.data.data || response.data.products || [])
        setModalProducts(products)
      } else {
        setModalProducts([])
      }
    } catch (error) {
      console.error('[CreatePO] Modal product search error:', error)
      setModalProducts([])
    } finally {
      setModalSearching(false)
    }
  }, [modalProductSearch])

  useEffect(() => {
    if (showProductModal) {
      // Fetch products when modal opens
      setModalSearching(true)
      apiService.getProducts({
        status: 'active',
        limit: 100,
      }).then((response) => {
        if (response.ok && response.data) {
          const products = Array.isArray(response.data)
            ? response.data
            : (response.data.data || response.data.products || [])
          setModalProducts(products)
        } else {
          setModalProducts([])
        }
      }).catch((error) => {
        console.error('[CreatePO] Modal product fetch error:', error)
        setModalProducts([])
      }).finally(() => {
        setModalSearching(false)
      })
    } else {
      setModalProductSearch('')
      setSelectedVariants(new Map())
    }
  }, [showProductModal])

  useEffect(() => {
    const timer = setTimeout(handleModalProductSearch, 300)
    return () => clearTimeout(timer)
  }, [handleModalProductSearch])

  // Handle variant selection
  const toggleVariantSelection = (product: Product, variantId?: number) => {
    const key = variantId ? `${product.id}-${variantId}` : `${product.id}`
    const newSelection = new Map(selectedVariants)
    
    if (newSelection.has(key)) {
      newSelection.delete(key)
    } else {
      newSelection.set(key, { product, variantId })
    }
    
    setSelectedVariants(newSelection)
  }

  // Handle adding selected variants
  const handleAddSelectedVariants = () => {
    if (selectedVariants.size === 0) {
      toast.error('Please select at least one product or variant')
      return
    }

    const newItems: POItem[] = []
    selectedVariants.forEach(({ product, variantId }) => {
      const variant = variantId ? product.variants?.find((v) => v.id === variantId) : undefined
      const existingIndex = formData.items.findIndex(
        (item) =>
          item.productId === product.id &&
          (variantId ? item.variantId === variantId : !item.variantId)
      )

      if (existingIndex < 0) {
        const newItem: POItem = {
          productId: product.id,
          productName: product.name,
          productSku: variant?.sku || product.sku,
          productThumbnailUrl: product.thumbnailUrl,
          variantId: variantId,
          variantName: variant
            ? `${variant.option1Value || ''}${variant.option2Value ? ' / ' + variant.option2Value : ''}${variant.option3Value ? ' / ' + variant.option3Value : ''}`
            : undefined,
          quantity: 1,
          unitCost: product.costPrice || product.basePrice || 0,
          taxPercent: 0,
        }
        newItems.push(newItem)
      }
    })

    if (newItems.length > 0) {
      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, ...newItems],
      }))
      toast.success(`${newItems.length} item${newItems.length > 1 ? 's' : ''} added`)
      setShowProductModal(false)
      setSelectedVariants(new Map())
    } else {
      toast.error('Selected items are already in the purchase order')
    }
  }

  const subtotal = useMemo(() => {
    return formData.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unitCost),
      0
    )
  }, [formData.items])

  const totalTax = useMemo(() => {
    return formData.items.reduce(
      (sum, item) => {
        const itemTotal = Number(item.quantity) * Number(item.unitCost)
        return sum + (itemTotal * Number(item.taxPercent || 0)) / 100
      },
      0
    )
  }, [formData.items])

  const totalCost = useMemo(() => {
    return subtotal + totalTax + Number(formData.shippingCost) + Number(formData.customsDuties) + Number(formData.otherFees)
  }, [subtotal, totalTax, formData.shippingCost, formData.customsDuties, formData.otherFees])

  const getCurrencySymbol = (currency: string) => {
    const currencyMap: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      LKR: 'Rs',
      INR: '₹',
      AUD: '$',
      CAD: '$',
      JPY: '¥',
    }
    return currencyMap[currency] || currency
  }

  const handleSubmit = async () => {
    if (!formData.supplierId) {
      toast.error('Please select a supplier')
      return
    }
    if (!formData.locationId) {
      toast.error('Please select a destination')
      return
    }
    if (formData.items.length === 0) {
      toast.error('Please add at least one item')
      return
    }

    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)

    const dto: CreatePurchaseOrderDto = {
      supplierId: formData.supplierId,
      locationId: formData.locationId,
      referenceNumber: formData.referenceNumber,
      paymentTerms: paymentTerms || undefined,
      supplierCurrency: formData.supplierCurrency || undefined,
      estimatedArrival: formData.estimatedArrival || undefined,
      shippingCarrier: formData.shippingCarrier || undefined,
      trackingNumber: formData.trackingNumber || undefined,
      shippingCost: formData.shippingCost || undefined,
      customsDuties: formData.customsDuties || undefined,
      otherFees: formData.otherFees || undefined,
      noteToSupplier: formData.notes || undefined,
      tags: tagsArray.length > 0 ? tagsArray : undefined,
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
        // Navigate back to purchase orders list
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('section', 'purchase-orders')
        router.push(currentUrl.pathname + currentUrl.search)
      },
      onError: () => {
        toast.error('Failed to create purchase order')
      },
    })
  }

  const handleCancel = () => {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('section', 'purchase-orders')
    router.push(currentUrl.pathname + currentUrl.search)
  }

  const currencySymbol = getCurrencySymbol(formData.supplierCurrency)

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="flex items-center gap-1">
   
            Back to Purchase orders
          </span>
        </button>
        <h1 className="text-2xl  font-bold text-gray-900">
          Create purchase order
        </h1>
      </div>

      <div className="space-y-6">
        {/* Top Section - Main Form */}
        <div className="space-y-6">
            {/* Supplier & Destination */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <SupplierSelector
                    value={formData.supplierId}
                    onChange={(supplierId) =>
                      setFormData({
                        ...formData,
                        supplierId,
                      })
                    }
                    placeholder="Select supplier"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Destination
                  </label>
                  <LocationSelector
                    value={formData.locationId}
                    onChange={(locationId) =>
                      setFormData({
                        ...formData,
                        locationId,
                      })
                    }
                    placeholder="Select destination"
                  />
                </div>
              </div>
            </div>

            {/* Payment & Currency */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment terms (optional)
                  </label>
                  <SimpleDropdown
                    value={paymentTerms}
                    onChange={(value) => setPaymentTerms(value)}
                    options={PAYMENT_TERMS}
                    placeholder="None"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier currency
                  </label>
                  <SimpleDropdown
                    value={formData.supplierCurrency}
                    onChange={(value) =>
                      setFormData({ ...formData, supplierCurrency: value })
                    }
                    options={CURRENCIES}
                    placeholder="Select currency"
                  />
                </div>
              </div>
            </div>

          {/* Shipment Details */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipment details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated arrival
                </label>
                <input
                  type="date"
                  value={formData.estimatedArrival}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedArrival: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping carrier
                </label>
                <input
                  type="text"
                  value={formData.shippingCarrier}
                  onChange={(e) =>
                    setFormData({ ...formData, shippingCarrier: e.target.value })
                  }
                  placeholder="Enter carrier name"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tracking number
                </label>
                <input
                  type="text"
                  value={formData.trackingNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, trackingNumber: e.target.value })
                  }
                  placeholder="Enter tracking number"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Add Products */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add products</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products"
                  className="w-full pl-10 pr-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
              >
                Browse
              </button>
            </div>

            {/* Search Results */}
            {productSearch.length >= 2 && searchResults.length > 0 && (
              <div className="mt-3 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((product) => (
                  <div key={product.id}>
                    <div className="p-3 hover:bg-gray-50 border-b last:border-b-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          {product.sku && (
                            <div className="text-sm text-gray-600">SKU: {product.sku}</div>
                          )}
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
                                  {variant.option2Value && ` / ${variant.option2Value}`}
                                </span>
                              </div>
                              <button
                                onClick={() => handleAddItem(product, variant.id)}
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

            {/* Added Items Table */}
            {formData.items.length > 0 && (
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Products</th>
                      <th className="text-left p-3 font-medium">Supplier SKU</th>
                      <th className="text-right p-3 font-medium">Quantity</th>
                      <th className="text-right p-3 font-medium">Cost</th>
                      <th className="text-right p-3 font-medium">Tax</th>
                      <th className="text-right p-3 font-medium">Total</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.productThumbnailUrl ? (
                                <img
                                  src={item.productThumbnailUrl}
                                  alt={item.productName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">{item.productName}</div>
                              {item.variantName && (
                                <div className="text-xs text-gray-600 mt-0.5">{item.variantName}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.productSku || ''}
                            readOnly
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-gray-50"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) =>
                              handleUpdateItem(index, 'unitCost', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-right"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.taxPercent}
                              onChange={(e) =>
                                handleUpdateItem(index, 'taxPercent', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2.5 py-1.5 border border-gray-300 rounded text-right"
                            />
                            <span className="text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          {currencySymbol}{' '}
                          {(
                            Number(item.quantity) *
                            Number(item.unitCost) *
                            (1 + Number(item.taxPercent || 0) / 100)
                          ).toFixed(2)}
                        </td>
                        <td className="p-3">
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
                <div className="p-3 bg-gray-50 border-t text-sm text-gray-600">
                  {formData.items.length} variant{formData.items.length !== 1 ? 's' : ''} on purchase order
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - Additional Details & Cost Summary Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch mt-6">
        {/* Left Column - Additional Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg p-6 border border-gray-200 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional details</h2>
            <div className="space-y-6 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference number
                </label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, referenceNumber: e.target.value })
                  }
                  placeholder="PO-12345678"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note to supplier
                </label>
                <div className="relative">
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={4}
                    placeholder="Add a note..."
                    maxLength={5000}
                    className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {formData.notes.length}/5000
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="Add tags separated by commas"
                  className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Cost Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg p-6 border border-gray-200 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Cost summary</h2>
              {/* <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Manage
              </button> */}
            </div>

            <div className="space-y-4 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxes (Included)</span>
                <span className="font-medium">
                  {currencySymbol} {totalTax.toFixed(2)}
                </span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {currencySymbol} {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formData.items.length} item{formData.items.length !== 1 ? 's' : ''}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Cost adjustments</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Shipping</span>
                  {editingShipping ? (
                    <div className="flex items-center gap-2">
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
                        onBlur={() => setEditingShipping(false)}
                        autoFocus
                        className="w-24 px-2.5 py-1.5 border border-gray-300 rounded text-right text-sm"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingShipping(true)}
                      className="font-medium hover:text-orange-600"
                    >
                      {currencySymbol} {formData.shippingCost.toFixed(2)}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    {currencySymbol} {totalCost.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-auto pt-6 border-t space-y-3">
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || !formData.supplierId || !formData.locationId || formData.items.length === 0}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Create purchase order
              </button>
              <button
                onClick={handleCancel}
                disabled={createMutation.isPending}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Products Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold">Add products</h2>
              <button
                onClick={() => {
                  setShowProductModal(false)
                  setSelectedVariants(new Map())
                  setModalProductSearch('')
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={modalProductSearch}
                  onChange={(e) => setModalProductSearch(e.target.value)}
                  placeholder="Search products"
                  className="w-full pl-10 pr-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                {modalSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-4">
              {modalSearching && modalProducts.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : modalProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No products found
                </div>
              ) : (
                <div className="space-y-4">
                  {modalProducts.map((product) => {
                    const hasVariants = product.variants && product.variants.length > 0
                    const productKey = `${product.id}`
                    const isProductSelected = selectedVariants.has(productKey)
                    
                    return (
                      <div key={product.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Product Row */}
                        <div className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isProductSelected && !hasVariants}
                            onChange={() => {
                              if (!hasVariants) {
                                toggleVariantSelection(product)
                              }
                            }}
                            disabled={hasVariants}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                            {product.thumbnailUrl ? (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {product.name}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {hasVariants
                              ? `${product.variants?.length} variant${product.variants?.length !== 1 ? 's' : ''}`
                              : product.inventoryQuantity !== undefined
                              ? `${product.inventoryQuantity} available`
                              : ''}
                          </div>
                        </div>

                        {/* Variants */}
                        {hasVariants && (
                          <div className="border-t bg-gray-50">
                            {product.variants?.map((variant) => {
                              const variantKey = `${product.id}-${variant.id}`
                              const isVariantSelected = selectedVariants.has(variantKey)
                              
                              return (
                                <div
                                  key={variant.id}
                                  className="p-3 flex items-center gap-3 hover:bg-white border-b border-gray-200 last:border-b-0 transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isVariantSelected}
                                    onChange={() => toggleVariantSelection(product, variant.id)}
                                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-900">
                                      {variant.option1Value}
                                      {variant.option2Value && ` / ${variant.option2Value}`}
                                      {variant.option3Value && ` / ${variant.option3Value}`}
                                    </div>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {variant.inventoryQuantity !== undefined
                                      ? `${variant.inventoryQuantity} available`
                                      : ''}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t p-4 flex items-center justify-between flex-shrink-0">
              <div className="text-sm text-gray-600">
                {selectedVariants.size} variant{selectedVariants.size !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowProductModal(false)
                    setSelectedVariants(new Map())
                    setModalProductSearch('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelectedVariants}
                  disabled={selectedVariants.size === 0}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
