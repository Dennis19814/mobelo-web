'use client'
import { logger } from '@/lib/logger'
import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useMerchantAuth } from '@/hooks'
import Image from 'next/image'
import {
  ArrowLeft, AlertCircle, Loader2, Search, X, Plus, ChevronDown, Calendar, MapPin
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { Product, ProductVariant } from '@/types/product.types'

interface CreatePurchaseOrderSectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

interface Supplier {
  id: number
  name: string
  company?: string
  email?: string
  phone?: string
  address?: string
}

interface PurchaseOrderProduct {
  productId: number
  variantId?: number
  productName: string
  variantName?: string
  supplierSku?: string
  quantity: number
  cost: number
  tax: number
  total: number
}

const CreatePurchaseOrderSection = ({ appId, apiKey, appSecretKey }: CreatePurchaseOrderSectionProps) => {
  const router = useRouter()
  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  
  // Form state
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [supplierSearch, setSupplierSearch] = useState('')
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false)
  const [showCreateSupplierModal, setShowCreateSupplierModal] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)
  
  const [destination, setDestination] = useState('188, 248 Hill Street')
  const [destinationAddress, setDestinationAddress] = useState('188, 248 Hill Street, Dehiwala-Mount Lavinia')
  
  const [paymentTerms, setPaymentTerms] = useState('none')
  const [supplierCurrency, setSupplierCurrency] = useState('LKR')
  
  const [estimatedArrival, setEstimatedArrival] = useState('')
  const [shippingCarrier, setShippingCarrier] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  
  const [products, setProducts] = useState<PurchaseOrderProduct[]>([])
  const [showAddProductsModal, setShowAddProductsModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [selectedProductVariants, setSelectedProductVariants] = useState<Map<number, Set<number>>>(new Map())
  
  const [referenceNumber, setReferenceNumber] = useState('')
  const [noteToSupplier, setNoteToSupplier] = useState('')
  const [tags, setTags] = useState('')
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New supplier form state
  const [newSupplier, setNewSupplier] = useState({
    company: '',
    country: 'Sri Lanka',
    address: '',
    apartment: '',
    city: '',
    postalCode: '',
    contactName: '',
    email: '',
    phone: ''
  })

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setLoadingSuppliers(true)
      try {
        // TODO: Replace with actual API endpoint
        // const response = await apiService.getSuppliers()
        // Mock data for now
        const mockSuppliers: Supplier[] = []
        setSuppliers(mockSuppliers)
      } catch (err) {
        logger.error('Failed to fetch suppliers:', { error: err instanceof Error ? err.message : String(err) })
      } finally {
        setLoadingSuppliers(false)
      }
    }
    fetchSuppliers()
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await apiService.getProducts({ limit: 100 })
        if (response.ok && response.data) {
          const productsData = Array.isArray(response.data) ? response.data : (response.data.data || [])
          setAvailableProducts(productsData)
        }
      } catch (err) {
        logger.error('Failed to fetch products:', { error: err instanceof Error ? err.message : String(err) })
      }
    }
    if (showAddProductsModal) {
      fetchProducts()
    }
  }, [showAddProductsModal])

  // Filter suppliers based on search
  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return suppliers
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.company?.toLowerCase().includes(supplierSearch.toLowerCase())
    )
  }, [suppliers, supplierSearch])

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return availableProducts
    return availableProducts.filter(p => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    )
  }, [availableProducts, productSearch])

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0)
    const taxes = products.reduce((sum, p) => sum + (p.cost * p.quantity * p.tax / 100), 0)
    const shipping = 0 // TODO: Add shipping cost
    const total = subtotal + taxes + shipping
    
    return {
      subtotal,
      taxes,
      shipping,
      total,
      itemCount: products.reduce((sum, p) => sum + p.quantity, 0)
    }
  }, [products])

  const handleBack = () => {
    const currentPath = window.location.pathname
    const pathMatch = currentPath.match(/\/merchant-panel\/([^\/]+)/)
    if (pathMatch && pathMatch[1]) {
      const hashedAppId = pathMatch[1]
      router.push(`/merchant-panel/${hashedAppId}?section=purchase-orders`)
    } else {
      router.back()
    }
  }

  const handleCreateSupplier = async () => {
    try {
      // TODO: Replace with actual API endpoint
      // const response = await apiService.createSupplier(newSupplier)
      // Mock creation
      const createdSupplier: Supplier = {
        id: Date.now(),
        name: newSupplier.contactName,
        company: newSupplier.company,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: `${newSupplier.address}, ${newSupplier.city}`
      }
      setSuppliers(prev => [...prev, createdSupplier])
      setSupplierId(createdSupplier.id)
      setShowCreateSupplierModal(false)
      setNewSupplier({
        company: '',
        country: 'Sri Lanka',
        address: '',
        apartment: '',
        city: '',
        postalCode: '',
        contactName: '',
        email: '',
        phone: ''
      })
    } catch (err) {
      logger.error('Failed to create supplier:', { error: err instanceof Error ? err.message : String(err) })
      setError('Failed to create supplier')
    }
  }

  const handleAddSelectedProducts = () => {
    const newProducts: PurchaseOrderProduct[] = []
    
    selectedProductVariants.forEach((variantIds, productId) => {
      const product = availableProducts.find(p => p.id === productId)
      if (!product) return
      
      if (variantIds.size === 0) {
        // Add product without variants
        newProducts.push({
          productId: product.id,
          productName: product.name,
          supplierSku: '',
          quantity: 1,
          cost: 0,
          tax: 0,
          total: 0
        })
      } else {
        // Add each selected variant
        variantIds.forEach(variantId => {
          const variant = product.variants?.find(v => v.id === variantId)
          if (variant) {
            newProducts.push({
              productId: product.id,
              variantId: variant.id,
              productName: product.name,
              variantName: [
                variant.option1Value,
                variant.option2Value,
                variant.option3Value
              ].filter(Boolean).join(' / '),
              supplierSku: '',
              quantity: 1,
              cost: 0,
              tax: 0,
              total: 0
            })
          }
        })
      }
    })
    
    setProducts(prev => [...prev, ...newProducts])
    setSelectedProductVariants(new Map())
    setShowAddProductsModal(false)
    setProductSearch('')
  }

  const handleToggleVariant = (productId: number, variantId?: number) => {
    setSelectedProductVariants(prev => {
      const newMap = new Map(prev)
      if (!newMap.has(productId)) {
        newMap.set(productId, new Set())
      }
      const variantSet = newMap.get(productId)!
      
      if (variantId === undefined) {
        // Toggle product (no variants)
        if (variantSet.size === 0) {
          // Select all variants or product itself
          const product = availableProducts.find(p => p.id === productId)
          if (product?.variants && product.variants.length > 0) {
            product.variants.forEach(v => variantSet.add(v.id!))
          } else {
            variantSet.add(-1) // Use -1 to indicate product itself
          }
        } else {
          variantSet.clear()
        }
      } else {
        // Toggle specific variant
        if (variantSet.has(variantId)) {
          variantSet.delete(variantId)
        } else {
          variantSet.add(variantId)
        }
      }
      
      if (variantSet.size === 0) {
        newMap.delete(productId)
      }
      
      return newMap
    })
  }

  const handleUpdateProduct = (index: number, field: keyof PurchaseOrderProduct, value: any) => {
    setProducts(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      
      // Recalculate total
      const product = updated[index]
      const subtotal = product.cost * product.quantity
      const taxAmount = subtotal * product.tax / 100
      updated[index].total = subtotal + taxAmount
      
      return updated
    })
  }

  const handleRemoveProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!supplierId) {
      setError('Please select a supplier')
      return
    }
    
    if (products.length === 0) {
      setError('Please add at least one product')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      // TODO: Replace with actual API endpoint
      // const response = await apiService.createPurchaseOrder({
      //   appId,
      //   supplierId,
      //   destination,
      //   paymentTerms,
      //   supplierCurrency,
      //   estimatedArrival,
      //   shippingCarrier,
      //   trackingNumber,
      //   products,
      //   referenceNumber,
      //   noteToSupplier,
      //   tags: tags.split(',').map(t => t.trim()).filter(Boolean)
      // })
      
      // Mock success
      logger.info('Purchase order created successfully')
      
      // Navigate back to purchase orders list
      handleBack()
    } catch (err) {
      logger.error('Failed to create purchase order:', { error: err instanceof Error ? err.message : String(err) })
      setError('Failed to create purchase order')
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: supplierCurrency === 'LKR' ? 'LKR' : supplierCurrency,
      minimumFractionDigits: 2
    }).format(amount).replace('LKR', 'Rs')
  }

  const selectedSupplier = suppliers.find(s => s.id === supplierId)
  const selectedVariantCount = Array.from(selectedProductVariants.values()).reduce((sum, set) => sum + set.size, 0)

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Purchase Orders</span>
        </button>
        
        <h1 className="text-2xl font-bold text-gray-900">Create purchase order</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Supplier and Destination */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
              <div className="relative">
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value)
                    setShowSupplierDropdown(true)
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  placeholder="Select supplier"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                
                {showSupplierDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowSupplierDropdown(false)}
                    />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                      {loadingSuppliers ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin mx-auto mb-2" />
                          Loading suppliers...
                        </div>
                      ) : filteredSuppliers.length > 0 ? (
                        filteredSuppliers.map(supplier => (
                          <button
                            key={supplier.id}
                            type="button"
                            onClick={() => {
                              setSupplierId(supplier.id)
                              setSupplierSearch(supplier.name)
                              setShowSupplierDropdown(false)
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                          >
                            {supplier.name}
                            {supplier.company && <span className="text-gray-500 ml-2">({supplier.company})</span>}
                          </button>
                        ))
                      ) : (
                        <div className="p-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSupplierDropdown(false)
                              setShowCreateSupplierModal(true)
                            }}
                            className="w-full text-left text-sm text-orange-600 hover:text-orange-700"
                          >
                            Create new supplier
                          </button>
                        </div>
                      )}
                      {supplierSearch && filteredSuppliers.length === 0 && (
                        <div className="p-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => {
                              setShowSupplierDropdown(false)
                              setShowCreateSupplierModal(true)
                            }}
                            className="w-full text-left text-sm text-orange-600 hover:text-orange-700"
                          >
                            Create new supplier
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <div className="relative">
                <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{destination}</div>
                    <div className="text-xs text-gray-500">{destinationAddress}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment and Currency */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment terms <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="none">None</option>
                <option value="net-15">Net 15</option>
                <option value="net-30">Net 30</option>
                <option value="net-60">Net 60</option>
                <option value="due-on-receipt">Due on receipt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier currency</label>
              <select
                value={supplierCurrency}
                onChange={(e) => setSupplierCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="LKR">Sri Lankan Rupee (LKR Rs)</option>
                <option value="USD">US Dollar (USD $)</option>
                <option value="EUR">Euro (EUR €)</option>
                <option value="GBP">British Pound (GBP £)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shipment details */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Shipment details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated arrival</label>
              <div className="relative">
                <input
                  type="date"
                  value={estimatedArrival}
                  onChange={(e) => setEstimatedArrival(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping carrier</label>
              <input
                type="text"
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                placeholder="Enter carrier name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tracking number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Add products */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Add products</h2>
            <button
              type="button"
              onClick={() => setShowAddProductsModal(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
            >
              Browse
            </button>
          </div>
          
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No products added yet. Click "Browse" to add products.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Products</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Supplier SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Cost</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Tax</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{product.productName}</div>
                          {product.variantName && (
                            <div className="text-gray-500 text-xs mt-0.5">{product.variantName}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={product.supplierSku}
                          onChange={(e) => handleUpdateProduct(index, 'supplierSku', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => handleUpdateProduct(index, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={product.cost}
                          onChange={(e) => handleUpdateProduct(index, 'cost', parseFloat(e.target.value) || 0)}
                          step="0.01"
                          min="0"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={product.tax}
                            onChange={(e) => handleUpdateProduct(index, 'tax', parseFloat(e.target.value) || 0)}
                            step="0.1"
                            min="0"
                            max="100"
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(product.total)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Additional details and Cost summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Additional details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Additional details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reference number</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Enter reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Note to supplier</label>
                  <textarea
                    value={noteToSupplier}
                    onChange={(e) => setNoteToSupplier(e.target.value)}
                    placeholder="Add a note for your supplier"
                    rows={4}
                    maxLength={5000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {noteToSupplier.length}/5000
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Add tags"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cost summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">Cost summary</h2>
                <button className="text-sm text-orange-600 hover:text-orange-700">Manage</button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxes (Included)</span>
                  <span className="text-gray-900">{formatCurrency(totals.taxes)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                  <div>
                    <span className="text-gray-900 font-medium">Subtotal</span>
                    <span className="text-gray-500 ml-2">({totals.itemCount} items)</span>
                  </div>
                  <span className="text-gray-900 font-medium">{formatCurrency(totals.subtotal)}</span>
                </div>
                
                <div className="pt-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Cost adjustments</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">{formatCurrency(totals.shipping)}</span>
                  </div>
                </div>
                
                <div className="flex justify-between text-base font-semibold border-t border-gray-200 pt-3">
                  <span className="text-gray-900">Total</span>
                  <span className="text-gray-900">{formatCurrency(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={handleBack}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !supplierId || products.length === 0}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save purchase order</span>
            )}
          </button>
        </div>
      </div>

      {/* Create Supplier Modal */}
      {showCreateSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create supplier</h2>
              <button
                onClick={() => setShowCreateSupplierModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={newSupplier.company}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country/region</label>
                <select
                  value={newSupplier.country}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc</label>
                <input
                  type="text"
                  value={newSupplier.apartment}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, apartment: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
                  <input
                    type="text"
                    value={newSupplier.postalCode}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, postalCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact name</label>
                <input
                  type="text"
                  value={newSupplier.contactName}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, contactName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <div className="flex gap-2">
                  <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option>🇱🇰 +94</option>
                  </select>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateSupplierModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white"
              >
                Close
              </button>
              <button
                onClick={handleCreateSupplier}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Products Modal */}
      {showAddProductsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Add products</h2>
              <button
                onClick={() => {
                  setShowAddProductsModal(false)
                  setProductSearch('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              
              {/* Product List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProducts.map(product => {
                  const hasVariants = product.variants && product.variants.length > 0
                  const selectedVariants = selectedProductVariants.get(product.id) || new Set()
                  const isProductSelected = selectedVariants.size > 0
                  
                  return (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isProductSelected}
                          onChange={() => handleToggleVariant(product.id)}
                          className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {product.thumbnailUrl && (
                              <Image
                                src={product.thumbnailUrl}
                                alt={product.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">{product.name}</div>
                              {hasVariants && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {product.variants!.length} variants
                                </div>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Available: {product.inventoryQuantity || 0}
                            </div>
                          </div>
                          
                          {/* Variants */}
                          {hasVariants && isProductSelected && (
                            <div className="mt-3 ml-13 space-y-1">
                              {product.variants!.map(variant => {
                                const variantName = [
                                  variant.option1Value,
                                  variant.option2Value,
                                  variant.option3Value
                                ].filter(Boolean).join(' / ')
                                const isVariantSelected = selectedVariants.has(variant.id!)
                                
                                return (
                                  <div key={variant.id} className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={isVariantSelected}
                                      onChange={() => handleToggleVariant(product.id, variant.id!)}
                                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                    />
                                    <span className="text-sm text-gray-700">{variantName}</span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                      Available: {variant.inventoryQuantity || 0}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedVariantCount} variants selected
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddProductsModal(false)
                    setProductSearch('')
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSelectedProducts}
                  disabled={selectedVariantCount === 0}
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

export default CreatePurchaseOrderSection
