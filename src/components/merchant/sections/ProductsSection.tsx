'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense, useRef } from 'react'
import { Plus, RefreshCw, Trash2, Package, Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { useMerchantAuth, useCrudOperations } from '@/hooks'
import { useStaffPermissions } from '@/contexts/StaffUserContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ProductTable from '../ProductTable'
import ProductGrid from '../ProductGrid'
import ProductFilters from '../ProductFilters'
import ProductGridSkeleton from '../ProductGridSkeleton'
import ProductTableSkeleton from '../ProductTableSkeleton'

// Lazy load modals for better performance
const AddProductModal = lazy(() => import('../modals/AddProductModal'))
const EditProductModal = lazy(() => import('../modals/EditProductModal'))
const ProductDetailsModal = lazy(() => import('../modals/ProductDetailsModal'))
const ConfirmationModal = lazy(() => import('../../modals/ConfirmationModal'))
import type { Product, ProductFilters as ProductFiltersType, ProductCategory } from '@/types/product.types'
import type { FilterValues } from '../ProductFilters'

interface ProductsSectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

/**
 * ProductsSection Component
 * 
 * Manages product listing, filtering, and CRUD operations for a merchant app.
 * 
 * @important API Key Header Format:
 * This component uses lowercase headers (x-api-key, x-app-secret) for all API calls.
 * This is critical to prevent header duplication issues that cause 401 authentication errors.
 * The lowercase format is consistently used throughout the request chain.
 */
const ProductsSectionComponent = ({ appId, apiKey, appSecretKey }: ProductsSectionProps) => {
  // Use custom hooks for auth and CRUD operations
  const { headers, isReady } = useMerchantAuth(apiKey, appSecretKey)
  const {
    loading: crudLoading,
    error,
    successMessage,
    executeOperation,
    setSuccessMessage,
    setError
  } = useCrudOperations()

  // Staff permissions (returns default true if not staff user)
  const { canCreateProducts, canEditProducts, canDeleteProducts } = useStaffPermissions()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filters, setFilters] = useState<ProductFiltersType>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  })
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<number[]>([])
  const [brands, setBrands] = useState<string[]>([])

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loadingProductData, setLoadingProductData] = useState(false)

  // Pagination
  const [totalProducts, setTotalProducts] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Debounce timer ref
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchProducts = useCallback(async () => {
    // Allow owner (dual-key) or staff JWT
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if (!hasStaffToken && (!isReady || !headers)) {
      logger.debug('Skipping products fetch - No staff token and API keys not available')
      // Keep loading state true to show spinner instead of empty state
      // Don't set loading to false here - wait for keys to be ready
      return
    }

    try {
      setLoading(true)
      setError(undefined as any)

      // Attempt strict merchant products endpoint first
      const response = await apiService.getProducts(filters)

      if (response.ok && response.data) {
        let productsData: any[] = []
        if (response.data.data) {
          // Paginated response
          productsData = response.data.data
          setTotalProducts(response.data.meta?.total || 0)
          setCurrentPage(response.data.meta?.page || 1)
          setTotalPages(response.data.meta?.totalPages || 1)
        } else if (Array.isArray(response.data)) {
          // Simple array response
          productsData = response.data
          setTotalProducts(response.data.length)
        }

        setProducts(productsData)
        setInitialLoadComplete(true)

        // Extract unique brands from products for filter options
        const brandSet = new Set<string>()
        productsData.forEach((product: Product) => {
          if (product.brand && typeof product.brand === 'string' && product.brand.trim() !== '') {
            brandSet.add(product.brand)
          }
        })
        const uniqueBrands = Array.from(brandSet).sort()
        setBrands(uniqueBrands)
        return
      }

      // If non-ok, fall through to fallback
      throw new Error('Primary products fetch failed')

    } catch (primaryError) {
      // Check if request was cancelled by the HTTP client
      const isCancelError = primaryError instanceof Error &&
        (primaryError.message?.includes('cancelled') ||
         primaryError.message?.includes('aborted'))

      if (isCancelError) {
        logger.debug('Products fetch was cancelled')
        return
      }

      // Don't try fallback - the mobile endpoint has database timeout issues
      // Just fail gracefully
      const errorMsg = primaryError instanceof Error ? primaryError.message : 'An unexpected error occurred'
      logger.error('Error fetching products:', {
        error: errorMsg
      })
      setError(errorMsg)
      setProducts([])
      setBrands([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, isReady, headers, setError])

  const fetchCategories = useCallback(async () => {
    // Allow either owner dual-key or staff JWT
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if (!hasStaffToken && (!isReady || !headers)) {
      logger.debug('Skipping categories fetch - No staff token and API keys not available yet')
      return
    }

    try {
      const response = await apiService.getCategories({ hierarchy: true })
      if (response.ok && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      // Check if request was aborted or cancelled
      const isAbortError = error instanceof Error &&
        (error.name === 'AbortError' ||
         error.message?.includes('cancelled') ||
         error.message?.includes('aborted'))

      if (isAbortError) {
        logger.debug('Categories fetch was cancelled (normal during React Strict Mode)')
        return
      }

      logger.error('Error fetching categories:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, headers, appId])

  useEffect(() => {
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if (isReady || hasStaffToken) {
      fetchProducts()
      fetchCategories()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchProducts()
  }, [fetchProducts])

  // Debounced refresh to prevent multiple rapid API calls
  const debouncedRefresh = useCallback((delay: number = 1000) => {
    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }

    // Set new timer
    refreshTimerRef.current = setTimeout(() => {
      fetchProducts()
    }, delay)
  }, [fetchProducts])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current)
      }
    }
  }, [])

  const handleFiltersChange = useCallback((filterValues: FilterValues) => {
    const newFilters: ProductFiltersType = {
      ...filters,
      page: 1,
      categories: filterValues.categories,
      brands: filterValues.brands,
      minPrice: filterValues.priceRange.min,
      maxPrice: filterValues.priceRange.max,
      stockStatus: filterValues.stockStatus,
      featured: filterValues.productFlags.includes('featured'),
      isNew: filterValues.productFlags.includes('new'),
      isBestSeller: filterValues.productFlags.includes('best_seller'),
      isOnSale: filterValues.productFlags.includes('on_sale'),
      status: filterValues.status.length > 0 ? filterValues.status[0] as any : undefined
    }
    setFilters(newFilters)
  }, [filters])

  // Debounced search state
  const [searchTerm, setSearchTerm] = useState('')
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }))
    }, 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const handleView = useCallback(async (productId: number) => {
    setLoadingProductData(true)
    try {
      // Try to fetch fresh data first
      const response = await apiService.getProduct(productId)
      if (response.ok && response.data) {
        setSelectedProduct(response.data)
        setShowDetailsModal(true)
      } else {
        // Fallback to local data
        const product = products.find(p => p.id === productId)
        if (product) {
          setSelectedProduct(product)
          setShowDetailsModal(true)
        }
      }
    } catch (error) {
      // Fallback to local data on error
      const product = products.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product)
        setShowDetailsModal(true)
      }
    } finally {
      setLoadingProductData(false)
    }
  }, [products])

  const handleEdit = useCallback(async (productId: number) => {
    // Fetch fresh product data before opening the edit modal
    if (!headers) return

    setLoadingProductData(true)
    try {
      const response = await apiService.getProduct(productId)

      if (response.ok && response.data) {
        logger.debug('Fetched fresh product data for edit', {
          compareAtPrice: response.data.compareAtPrice,
          hasMetadata: !!response.data.metadata
        })
        // Ensure null values are properly handled as undefined for the form
        const freshProduct = {
          ...response.data,
          compareAtPrice: response.data.compareAtPrice === null ? undefined : response.data.compareAtPrice,
          costPrice: response.data.costPrice === null ? undefined : response.data.costPrice,
          weight: response.data.weight === null ? undefined : response.data.weight,
          metadata: response.data.metadata || {}
        }
        setSelectedProduct(freshProduct)
        setShowEditModal(true)
      } else {
        // Fallback to local data if fetch fails
        const product = products.find(p => p.id === productId)
        if (product) {
          logger.debug('Using cached product data for edit', {
            compareAtPrice: product.compareAtPrice,
            hasMetadata: !!product.metadata
          })
          const cleanProduct = {
            ...product,
            compareAtPrice: product.compareAtPrice === null ? undefined : product.compareAtPrice,
            costPrice: product.costPrice === null ? undefined : product.costPrice,
            weight: product.weight === null ? undefined : product.weight,
            metadata: product.metadata || {}
          }
          setSelectedProduct(cleanProduct)
          setShowEditModal(true)
        } else {
          setError('Product not found')
        }
      }
    } catch (error) {
      logger.error('Error fetching product for edit:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      // Fallback to local data
      const product = products.find(p => p.id === productId)
      if (product) {
        const cleanProduct = {
          ...product,
          compareAtPrice: product.compareAtPrice === null ? undefined : product.compareAtPrice,
          costPrice: product.costPrice === null ? undefined : product.costPrice,
          weight: product.weight === null ? undefined : product.weight,
          metadata: product.metadata || {}
        }
        setSelectedProduct(cleanProduct)
        setShowEditModal(true)
      }
    } finally {
      setLoadingProductData(false)
    }
  }, [headers, products, setError])

  // Lightweight prefetch cache to speed up edit modal opening
  const prefetchCache = useRef<Map<number, any>>(new Map())
  const prefetchProduct = useCallback(async (productId: number) => {
    if (prefetchCache.current.has(productId) || !headers) return
    try {
      const res = await apiService.getProduct(productId)
      if (res.ok && res.data) {
        prefetchCache.current.set(productId, res.data)
      }
    } catch {}
  }, [headers])

  const handleStatusToggle = useCallback(async (product: Product) => {
    if (!headers) return

    const newStatus = product.status === 'active' ? 'draft' : 'active'
    const actionText = newStatus === 'active' ? 'activated' : 'deactivated'

    // Optimistic UI update - update immediately for instant feedback
    setProducts(prev => prev.map(p =>
      p.id === product.id ? { ...p, status: newStatus } : p
    ))

    try {
      await apiService.updateProduct(product.id, { status: newStatus })
      setSuccessMessage(`Product "${product.name}" has been ${actionText} successfully! 🎉`)
    } catch (error) {
      // Rollback on error
      setProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, status: product.status } : p
      ))
      setError('Failed to update product status')
    }
  }, [headers, setSuccessMessage, setError])

  const handleDelete = useCallback((productId: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setSelectedProduct(product)
      setShowDeleteModal(true)
    }
  }, [products])

  const handleDuplicate = useCallback(async (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (!product || !headers) return

    const duplicateData = {
      ...product,
      name: `${product.name} (Copy)`,
      sku: `${product.sku}-COPY-${Date.now()}`,
      status: 'draft' as const
    }

    delete (duplicateData as any).id
    delete (duplicateData as any).createdAt
    delete (duplicateData as any).updatedAt

    await executeOperation(
      () => apiService.createProduct(duplicateData),
      {
        successMessage: `Product "${product.name}" has been duplicated successfully! 📋`,
        onSuccess: fetchProducts
      }
    )
  }, [products, headers, executeOperation, fetchProducts])

  const handleSelectProduct = useCallback((productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }, [])

  const handleBulkDelete = useCallback(async () => {
    if (selectedProducts.length === 0 || !headers) return

    const deleteOperations = selectedProducts.map(id =>
      () => apiService.deleteProduct(id)
    )

    await executeOperation(
      () => Promise.all(deleteOperations.map(op => op())),
      {
        successMessage: `${selectedProducts.length} products have been deleted successfully! ✅`,
        onSuccess: () => {
          setSelectedProducts([])
          fetchProducts()
        }
      }
    )
  }, [selectedProducts, headers, executeOperation, fetchProducts])

  const confirmDelete = useCallback(async () => {
    if (!selectedProduct || !headers) return

    const productName = selectedProduct.name
    const productId = selectedProduct.id

    // Close modal and show optimistic update
    setShowDeleteModal(false)
    setSelectedProduct(null)

    // Optimistic UI update - remove immediately
    setProducts(prev => prev.filter(p => p.id !== productId))
    setSuccessMessage(`Product "${productName}" has been deleted successfully! ✅`)

    try {
      await apiService.deleteProduct(productId)
    } catch (error) {
      // On error, refresh to restore
      setError('Failed to delete product')
      fetchProducts()
    }
  }, [selectedProduct, headers, setSuccessMessage, setError, fetchProducts])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  // Keyboard shortcuts for power users
  useKeyboardShortcuts([
    {
      key: '/',
      action: () => {
        const searchInput = document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement
        searchInput?.focus()
      },
      description: 'Focus search',
    },
    {
      key: 'n',
      action: () => canCreateProducts && setShowAddModal(true),
      description: 'New product',
    },
    {
      key: 'r',
      action: handleRefresh,
      description: 'Refresh',
    },
  ])

  // Show loading state while waiting for API keys
  const hasStaffTokenForRender = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
  if (!isReady && !hasStaffTokenForRender) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication keys...</p>
        </div>
      </div>
    )
  }

  return (
    <div className=" overflow-hidden">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Products</h2>
          {totalProducts > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {totalProducts} total products
              {selectedProducts.length > 0 && ` • ${selectedProducts.length} selected`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="hidden lg:block">
            <div className="relative">
              <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.9 14.32a8 8 0 111.414-1.414l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z" clipRule="evenodd" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent w-56"
              />
            </div>
          </div>
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete Selected</span>
              <span className="sm:hidden">Delete</span>
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 border rounded-lg transition-colors text-sm ${
              showFilters
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {showFilters && <span className="hidden md:inline text-xs">(Active)</span>}
          </button>
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
            onClick={handleRefresh}
            disabled={refreshing}
            className={`
              flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 border border-gray-300 rounded-lg
              hover:bg-gray-50 transition-colors text-sm
              ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          {canCreateProducts && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
              <span className="sm:hidden">Add</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Filters Panel - Shows when filter button is clicked */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <ProductFilters
            categories={categories}
            brands={brands}
            onFilterChange={handleFiltersChange}
            onClose={() => setShowFilters(false)}
            isOpen={true}
            horizontal={true}
            apiKey={apiKey}
            appSecretKey={appSecretKey}
          />
        </div>
      )}

      {/* Selection toolbar */}
      {selectedProducts.length > 0 && (
        <div className="mb-4 flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50 text-blue-800">
          <span className="text-sm">{selectedProducts.length} selected</span>
          <div className="flex gap-2">
            {canDeleteProducts && (
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 text-sm bg-white border border-orange-200 rounded hover:bg-blue-100"
              >Delete</button>
            )}
            <button
              onClick={() => selectedProducts.forEach((id) => handleDuplicate(id))}
              className="px-3 py-1.5 text-sm bg-white border border-orange-200 rounded hover:bg-blue-100"
            >Duplicate</button>
          </div>
        </div>
      )}

      {/* Products Grid/List - Now full width */}
      <div className="w-full overflow-hidden pt-6">
          {!initialLoadComplete ? (
            viewMode === 'grid' ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <ProductTableSkeleton rows={10} />
            )
          ) : products.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first product.</p>
              {canCreateProducts && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <ProductGrid
              products={products}
              onEdit={canEditProducts ? handleEdit : undefined}
              onDelete={canDeleteProducts ? handleDelete : undefined}
              onView={handleView}
              onDuplicate={handleDuplicate}
              selectedProducts={selectedProducts}
              onSelectProduct={handleSelectProduct}
              viewMode={viewMode}
              onPrefetch={prefetchProduct}
              loading={loading}
            />
          ) : (
            <ProductTable
              products={products}
              loading={loading}
              onView={(product) => handleView(product.id)}
              onEdit={canEditProducts ? (product) => handleEdit(product.id) : undefined}
              onStatusToggle={handleStatusToggle}
              onDelete={canDeleteProducts ? (product) => handleDelete(product.id) : undefined}
            />
          )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg border border-gray-200">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(currentPage - 1) * (filters.limit || 20) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * (filters.limit || 20), totalProducts)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{totalProducts}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
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
                      onClick={() => handlePageChange(pageNum)}
                      className={`
                        relative inline-flex items-center px-4 py-2 border text-sm font-medium
                        ${currentPage === pageNum
                          ? 'z-10 bg-orange-50 border-orange-500 text-orange-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }
                      `}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals - Lazy loaded for better performance */}
      <Suspense fallback={null}>
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            setSuccessMessage('Product has been created successfully! 🎉')
            fetchProducts()
          }}
          appId={appId}
          apiKey={apiKey}
          appSecretKey={appSecretKey}
        />
      </Suspense>

      {selectedProduct && (
        <Suspense fallback={null}>
          <EditProductModal
            isOpen={showEditModal}
            onClose={async () => {
              const wasOpen = showEditModal
              setShowEditModal(false)

              // If modal was open, refresh the product to show any changes
              if (wasOpen && selectedProduct) {
                try {
                  const response = await apiService.getProduct(selectedProduct.id)
                  if (response.ok && response.data) {
                    // Update this product in the list with fresh data
                    setProducts(prev => prev.map(p =>
                      p.id === selectedProduct.id ? response.data : p
                    ))
                  }
                } catch (error) {
                  logger.error('Failed to refresh product after modal close:', { error: error instanceof Error ? error.message : String(error) })
                }
              }

              setSelectedProduct(null)
            }}
            product={selectedProduct}
            apiKey={apiKey}
            appSecretKey={appSecretKey}
            onSuccess={async () => {
              const productName = selectedProduct.name
              const productId = selectedProduct.id
              setShowEditModal(false)
              setSelectedProduct(null)
              setSuccessMessage(`Product "${productName}" has been updated successfully! ✨`)

              // Efficient update: fetch only the changed product
              try {
                const response = await apiService.getProduct(productId)
                if (response.ok && response.data) {
                  // Update only this product in the list
                  setProducts(prev => prev.map(p =>
                    p.id === productId ? response.data : p
                  ))
                } else {
                  // Fallback: debounced refresh to prevent rapid calls
                  debouncedRefresh(500)
                }
              } catch (error) {
                // Fallback on error with debouncing
                debouncedRefresh(500)
              }
            }}
          />

          <ProductDetailsModal
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false)
              setSelectedProduct(null)
            }}
            product={selectedProduct}
          />

          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false)
              setSelectedProduct(null)
            }}
            onConfirm={confirmDelete}
            title="Delete Product"
            message={`Are you sure you want to delete "${selectedProduct.name}"? This action cannot be undone.`}
            confirmText="Delete"
            isDestructive={true}
          />
        </Suspense>
      )}

      {/* Loading Overlay for fetching product data */}
      {loadingProductData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
              <p className="text-gray-700 font-medium">Loading product details...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap with React.memo for performance optimization
// Component will only re-render when props change
export default memo(ProductsSectionComponent)
