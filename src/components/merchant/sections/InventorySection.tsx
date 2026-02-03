'use client'
import { logger } from '@/lib/logger'

import React, { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useMerchantAuth, useCrudOperations } from '@/hooks'
import Image from 'next/image'
import {
  Package, Search, Plus, Minus, AlertCircle,
  RefreshCw, History, TrendingUp, TrendingDown,
  Filter, Download, Upload, Calendar, ArrowUpDown,
  Grid3X3, List, X, Box, Edit
} from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type { Product, ProductVariant } from '@/types/product.types'
import { Pagination } from '../common'

// Lazy load modal
const InventoryHistoryModal = lazy(() => import('../modals/InventoryHistoryModal'))

interface InventorySectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

interface InventoryMovement {
  id: number
  productId: number
  variantId?: number
  movementType: 'in' | 'out' | 'adjustment' | 'return' | 'damage'
  quantity: number
  previousQuantity: number
  newQuantity: number
  reason?: string
  reference?: string
  notes?: string
  createdBy?: string
  createdAt: Date
  product?: Product
  variant?: ProductVariant
}

interface StockAdjustment {
  productId: number
  variantId?: number
  movementType: 'in' | 'out' | 'adjustment'
  quantity: number
  reason?: string
  reference?: string
  notes?: string
}

const InventorySectionComponent = ({ appId, apiKey, appSecretKey }: InventorySectionProps) => {
  const router = useRouter()
  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  const {
    loading: crudLoading,
    error: crudError,
    successMessage,
    executeOperation,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations()

  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddStock, setShowAddStock] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    productId: 0,
    movementType: 'in',
    quantity: 0,
    reason: '',
    reference: '',
    notes: ''
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Pagination (client-side since we load all products)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  // Fetch ALL products that track inventory (paginate until complete)
  const fetchProducts = useCallback(async () => {
    // Allow owner (dual-key) or staff JWT
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if (!hasStaffToken && !headers) return

    try {
      setLoading(true)
      setError(null)

      // Build request headers (same pattern as handleStockAdjustment)
      const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add dual-key headers for owner authentication
      if (headers) {
        Object.assign(requestHeaders, headers)
      }
      // Add JWT for staff authentication
      else if (staffToken) {
        requestHeaders.authorization = `Bearer ${staffToken}`
      }

      // Try strict products list first (requires products.view.info permission)
      // Paginate until all products are loaded to avoid default 20 item limit
      const PAGE_SIZE = 100
      let page = 1
      let accumulated: Product[] = []
      let totalPages = 1

      while (page <= totalPages) {
        const resp = await fetch(`/api/proxy/v1/merchant/products?page=${page}&limit=${PAGE_SIZE}`, {
          method: 'GET',
          headers: requestHeaders
        })

        if (!resp.ok) break

        const data = await resp.json()
        const dataPage: Product[] = (data.data || data || []) as Product[]
        accumulated = accumulated.concat(dataPage)

        const meta = (data.meta || data.pagination) as any
        totalPages = meta?.totalPages || totalPages
        if (!totalPages) {
          // If meta not provided, stop after first fetch
          totalPages = 1
        }
        page += 1
      }

      if (accumulated.length > 0) {
        const inventoryProducts = accumulated.filter((p: Product) => p.trackInventory)
        setProducts(inventoryProducts)
        return
      }

      throw new Error('Primary inventory product fetch failed')
    } catch (primaryError) {
      // Fallback to mobile list for staff JWT or limited permissions
      try {
        // Build request headers for fallback
        const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
        const requestHeaders: Record<string, string> = {
          'Content-Type': 'application/json'
        }

        if (headers) {
          Object.assign(requestHeaders, headers)
        }
        else if (staffToken) {
          requestHeaders.authorization = `Bearer ${staffToken}`
        }

        // Mobile list paginated (max 50 per page); fetch until done
        const PAGE_SIZE = 50
        let page = 1
        let allMobile: any[] = []
        let hasNext = true

        while (hasNext) {
          const mobileResp = await fetch(`/api/proxy/v1/merchant/products/mobile/list?page=${page}&limit=${PAGE_SIZE}&sortBy=newest&sortOrder=desc`, {
            method: 'GET',
            headers: requestHeaders
          })

          if (!mobileResp.ok) break

          const data = await mobileResp.json()
          const productsArr: any[] = Array.isArray(data.products) ? data.products : []
          allMobile = allMobile.concat(productsArr)
          const pagination = data.pagination || data.meta
          if (pagination) {
            hasNext = Boolean(pagination.hasNext)
            page += 1
          } else {
            hasNext = false
          }
        }

        if (allMobile.length > 0) {
          const mapped: Product[] = allMobile.map((mp: any) => ({
            id: mp.id,
            name: mp.name,
            sku: mp.sku,
            basePrice: mp.price ?? 0,
            status: 'active',
            featured: !!mp.isFeatured,
            brand: typeof mp.brand === 'string' ? mp.brand : undefined,
            brandId: typeof mp.brand === 'number' ? mp.brand : undefined,
            thumbnailUrl: mp.image,
            averageRating: mp.rating ?? 0,
            totalReviews: mp.reviewCount ?? 0,
            // Mobile list does not return inventoryQuantity; set 0 but keep item visible
            trackInventory: true,
            inventoryQuantity: typeof mp.inventoryQuantity === 'number' ? mp.inventoryQuantity : 0,
            variants: mp.variants || [],
          }))
          setProducts(mapped)
          return
        }
        throw new Error('Mobile fallback returned no products')
      } catch (fallbackError) {
        setError('Failed to fetch products')
        logger.error('Error fetching products (inventory fallback):', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          primary: primaryError instanceof Error ? primaryError.message : String(primaryError)
        })
      }
    } finally {
      setLoading(false)
    }
  }, [headers])

  // Fetch inventory movements history
  const fetchMovements = useCallback(async (productId?: number) => {
    if (!headers) return

    try {
      setLoadingMovements(true)

      // TODO: Replace with actual inventory movements endpoint
      // const response = await apiService.getInventoryMovements(productId)
      // For now, using mock data
      const mockMovements: InventoryMovement[] = []
      setMovements(mockMovements)
    } catch (err) {
      logger.error('Error fetching movements:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
    } finally {
      setLoadingMovements(false)
    }
  }, [headers])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (selectedProduct) {
      fetchMovements(selectedProduct.id)
    }
  }, [selectedProduct, fetchMovements])

  // Handle stock adjustment
  const handleStockAdjustment = useCallback(async () => {
    if (!selectedProduct) return

    try {
      setLoading(true)
      setError(null)

      // Create inventory movement record
      const movementData = {
        appId: appId,
        productId: selectedProduct.id,
        variantId: selectedVariant?.id,
        movementType: adjustment.movementType,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
        reference: adjustment.reference,
        notes: adjustment.notes
      }

      const staffToken = typeof window !== 'undefined' ? localStorage.getItem('staff_access_token') : null
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      }

      // Add dual-key headers for owner authentication
      if (headers) {
        Object.assign(requestHeaders, headers)
      }
      // Add JWT for staff authentication
      else if (staffToken) {
        requestHeaders.authorization = `Bearer ${staffToken}`
      }

      const movementResponse = await fetch('/api/proxy/v1/merchant/inventory/movement', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(movementData)
      })

      if (movementResponse.ok) {
        // Refresh products to get updated inventory
        await fetchProducts()
        // Clear form
        setShowAddStock(false)
        setAdjustment({
          productId: 0,
          movementType: 'in',
          quantity: 0,
          reason: '',
          reference: '',
          notes: ''
        })
        setSelectedProduct(null)
        setSelectedVariant(null)
      } else {
        const errorData = await movementResponse.json()
        setError(errorData.message || 'Failed to update inventory')
      }
    } catch (err) {
      setError('Failed to adjust stock')
      logger.error('Error adjusting stock:', { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined })
    } finally {
      setLoading(false)
    }
  }, [headers, selectedProduct, selectedVariant, adjustment, appId, fetchProducts])

  // Filter products based on search
  const filteredProducts = useMemo(() =>
    products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  )

  // Paginate filtered products (client-side pagination)
  const totalProducts = filteredProducts.length
  const totalPages = useMemo(() => Math.ceil(totalProducts / limit), [totalProducts, limit])
  const paginatedProducts = useMemo(() => {
    const startIndex = (page - 1) * limit
    return filteredProducts.slice(startIndex, startIndex + limit)
  }, [filteredProducts, page, limit])

  // Reset page when search changes
  useEffect(() => {
    setPage(1)
  }, [searchTerm])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }, [])

  // Get movement type badge color
  const getMovementTypeBadge = useCallback((type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-100 text-green-800'
      case 'out':
        return 'bg-red-100 text-red-800'
      case 'adjustment':
        return 'bg-blue-100 text-blue-800'
      case 'return':
        return 'bg-yellow-100 text-yellow-800'
      case 'damage':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  // Get stock status color
  const getStockStatusColor = useCallback((quantity?: number) => {
    if (!quantity || quantity === 0) return 'text-red-600 bg-red-50'
    if (quantity < 10) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }, [])

  return (
    <div className="overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track and manage your product stock levels</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => fetchProducts()}
              disabled={loading}
              className={`
                flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors text-sm
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load inventory</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Products View - Grid or List based on viewMode */}
      <div className="bg-white rounded-lg shadow-sm -mt-4">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products with inventory tracking</h3>
            <p className="text-gray-500">Enable inventory tracking for products to manage stock here.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
            {paginatedProducts.map((product) => (
              <div
                key={product.id}
                className={`
                  bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-200 overflow-hidden flex flex-col h-full
                  ${selectedProduct?.id === product.id ? '' : ''}
                `}
                onClick={() => {
                  setSelectedProduct(product)
                  setSelectedVariant(null)
                }}
              >
                <div className="p-4 flex-1 flex flex-col min-h-0">
                  {/* Product Image - Always render to maintain consistent layout */}
                  <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {product.thumbnailUrl ? (
                      <Image
                        src={product.thumbnailUrl}
                        alt={product.name}
                        width={300}
                        height={128}
                        className="object-contain max-w-full max-h-full"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-shrink-0">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    {product.sku && (
                      <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                    )}
                  </div>
                  
                  {/* Stock Info */}
                  <div className="mt-3 flex items-center justify-between flex-shrink-0">
                    <span
                      className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${getStockStatusColor(product.inventoryQuantity)}
                      `}
                    >
                      Stock: {product.inventoryQuantity || 0}
                    </span>
                    
                    {product.variants && product.variants.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {product.variants.length} variants
                      </span>
                    )}
                  </div>
                  
                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1"></div>
                  
                  {/* Quick Actions - Ensure buttons stay at bottom and are contained */}
                  <div className="mt-3 flex gap-2 flex-shrink-0 w-full">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Navigate to inventory management page with productId
                        const currentPath = window.location.pathname
                        const pathMatch = currentPath.match(/\/merchant-panel\/([^\/]+)/)
                        if (pathMatch && pathMatch[1]) {
                          const hashedAppId = pathMatch[1]
                          router.push(`/merchant-panel/${hashedAppId}?section=inventory-management&productId=${product.id}`)
                        }
                      }}
                      className="flex-1 flex items-center justify-center px-2 py-1.5 bg-orange-600 text-white rounded hover:bg-orange-700 text-xs font-medium min-w-0"
                      title="Edit Stock"
                    >
                      <Edit className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Edit Stock</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setHistoryProduct(product)
                        setShowHistoryModal(true)
                      }}
                      className="flex-1 flex items-center justify-center px-2 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 text-xs font-medium min-w-0"
                      title="View History"
                    >
                      <History className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">History</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variants</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedProduct?.id === product.id ? 'bg-orange-50' : ''}`}
                    onClick={() => {
                      setSelectedProduct(product)
                      setSelectedVariant(null)
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {product.thumbnailUrl && (
                          <div className="flex-shrink-0 h-10 w-10 mr-3">
                            <Image
                              src={product.thumbnailUrl}
                              alt={product.name}
                              width={40}
                              height={40}
                              className="h-10 w-10 rounded-lg object-contain"
                            />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {product.inventoryQuantity || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`
                          inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                          ${getStockStatusColor(product.inventoryQuantity)}
                        `}
                      >
                        {!product.inventoryQuantity || product.inventoryQuantity === 0
                          ? 'Out of Stock'
                          : product.inventoryQuantity < 10
                          ? 'Low Stock'
                          : 'In Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.variants && product.variants.length > 0 ? (
                        <span>{product.variants.length} variants</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Navigate to inventory management page with productId
                            const currentPath = window.location.pathname
                            const pathMatch = currentPath.match(/\/merchant-panel\/([^\/]+)/)
                            if (pathMatch && pathMatch[1]) {
                              const hashedAppId = pathMatch[1]
                              router.push(`/merchant-panel/${hashedAppId}?section=inventory-management&productId=${product.id}`)
                            }
                          }}
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title="Edit Stock"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setHistoryProduct(product)
                            setShowHistoryModal(true)
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="mt-4">
          <Pagination
            totalItems={totalProducts}
            currentPage={page}
            totalPages={totalPages}
            itemsPerPage={limit}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleLimitChange}
            itemLabel="products"
            selectId="inventory-per-page-select"
          />
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAddStock && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between bg-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Box className="w-3.5 h-3.5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {adjustment.movementType === 'in' ? 'Add Stock' : 
                     adjustment.movementType === 'out' ? 'Remove Stock' : 
                     'Adjust Stock'}
                  </h2>
                </div>
              </div>
              <button
                onClick={() => setShowAddStock(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors group"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              
              {/* Product Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">Current Stock: {selectedProduct.inventoryQuantity || 0}</p>
              </div>
              
              {/* Movement Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Movement Type
                </label>
                <select
                  value={adjustment.movementType}
                  onChange={(e) => setAdjustment({...adjustment, movementType: e.target.value as 'in' | 'out' | 'adjustment'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="in">Stock In (Add)</option>
                  <option value="out">Stock Out (Remove)</option>
                  <option value="adjustment">Adjustment (Set)</option>
                </select>
              </div>
              
              {/* Quantity */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment({...adjustment, quantity: parseInt(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter quantity"
                  min="0"
                />
              </div>
              
              {/* Reference */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={adjustment.reference}
                  onChange={(e) => setAdjustment({...adjustment, reference: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="PO number, invoice, etc."
                />
              </div>
              
              {/* Notes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={adjustment.notes}
                  onChange={(e) => setAdjustment({...adjustment, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
              
              {/* New Quantity Preview */}
              <div className="mb-4 p-3 bg-orange-50 rounded-lg">
                <p className="text-sm text-slate-900">
                  New Stock Level: {
                    adjustment.movementType === 'in' 
                      ? (selectedProduct.inventoryQuantity || 0) + adjustment.quantity
                      : adjustment.movementType === 'out'
                      ? Math.max(0, (selectedProduct.inventoryQuantity || 0) - adjustment.quantity)
                      : adjustment.quantity
                  }
                </p>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddStock(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStockAdjustment}
                  disabled={loading || adjustment.quantity === 0}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory History Modal */}
      <Suspense fallback={null}>
        {showHistoryModal && historyProduct && (
          <InventoryHistoryModal
            isOpen={showHistoryModal}
            onClose={() => {
              setShowHistoryModal(false)
              setHistoryProduct(null)
            }}
            product={historyProduct}
            variant={selectedVariant}
            apiKey={apiKey}
            appSecretKey={appSecretKey}
            appId={appId}
          />
        )}
      </Suspense>
    </div>
  )
}

export default memo(InventorySectionComponent)
