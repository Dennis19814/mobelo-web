'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, RefreshCw, Trash2, Package, Grid3X3, List, SlidersHorizontal, AlertTriangle, Copy, X, XCircle } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import { useMerchantAuth, useCrudOperations } from '@/hooks'
import { useStaffPermissions } from '@/contexts/StaffUserContext'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import ProductTable from '../ProductTable'
import ProductGrid from '../ProductGrid'
import ProductFilters from '../ProductFilters'
import ProductGridSkeleton from '../ProductGridSkeleton'
import ProductTableSkeleton from '../ProductTableSkeleton'
import { Pagination } from '../common'
import { hashId } from '@/lib/url-hash'

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
  onAddProduct?: () => void
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
const ProductsSectionComponent = ({ appId, apiKey, appSecretKey, onAddProduct }: ProductsSectionProps) => {
  const router = useRouter()
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
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [showBulkDuplicateModal, setShowBulkDuplicateModal] = useState(false)
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

  // Fetch products when filters change
  useEffect(() => {
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if ((isReady || hasStaffToken) && initialLoadComplete) {
      fetchProducts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

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

  // Convert ProductFiltersType to FilterValues for ProductFilters component
  const convertToFilterValues = useCallback((productFilters: ProductFiltersType): FilterValues => {
    const productFlags: string[] = []
    if (productFilters.featured) productFlags.push('featured')
    if (productFilters.isNew) productFlags.push('new')
    if (productFilters.isBestSeller) productFlags.push('best_seller')
    if (productFilters.isOnSale) productFlags.push('on_sale')

    const statusArray: string[] = []
    if (productFilters.status) {
      if (Array.isArray(productFilters.status)) {
        statusArray.push(...productFilters.status)
      } else {
        statusArray.push(productFilters.status)
      }
    }

    return {
      categories: productFilters.categories || [],
      brands: productFilters.brands || [],
      priceRange: {
        min: productFilters.minPrice,
        max: productFilters.maxPrice,
      },
      stockStatus: productFilters.stockStatus || [],
      productFlags,
      status: statusArray,
      dateRange: {},
    }
  }, [])

  // Check if any filters are currently applied
  const hasActiveFilters = useMemo(() => {
    const hasCategories = Array.isArray(filters.categories) && filters.categories.length > 0
    const hasBrands = Array.isArray(filters.brands) && filters.brands.length > 0
    const hasPriceRange = (typeof filters.minPrice === 'number') || (typeof filters.maxPrice === 'number')
    const hasStockStatus = Array.isArray(filters.stockStatus) && filters.stockStatus.length > 0
    const hasProductFlags = filters.featured === true || filters.isNew === true || filters.isBestSeller === true || filters.isOnSale === true
    const hasStatus = (filters.status !== undefined && filters.status !== null && filters.status !== '') || 
                     (Array.isArray(filters.status) && filters.status.length > 0)
    const hasSearch = filters.search !== undefined && filters.search !== null && String(filters.search).trim().length > 0

    return hasCategories || hasBrands || hasPriceRange || hasStockStatus || hasProductFlags || hasStatus || hasSearch
  }, [filters])

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (Array.isArray(filters.categories) && filters.categories.length > 0) count++
    if (Array.isArray(filters.brands) && filters.brands.length > 0) count++
    if (typeof filters.minPrice === 'number' || typeof filters.maxPrice === 'number') count++
    if (Array.isArray(filters.stockStatus) && filters.stockStatus.length > 0) count++
    if (filters.featured === true || filters.isNew === true || filters.isBestSeller === true || filters.isOnSale === true) count++
    if ((filters.status !== undefined && filters.status !== null && filters.status !== '') || 
        (Array.isArray(filters.status) && filters.status.length > 0)) count++
    if (filters.search !== undefined && filters.search !== null && String(filters.search).trim().length > 0) count++
    return count
  }, [filters])

  const handleFiltersChange = useCallback((filterValues: FilterValues) => {
    const newFilters: ProductFiltersType = {
      ...filters,
      page: 1,
      categories: filterValues.categories && filterValues.categories.length > 0 ? filterValues.categories : undefined,
      brands: filterValues.brands && filterValues.brands.length > 0 ? filterValues.brands : undefined,
      minPrice: filterValues.priceRange.min !== undefined ? filterValues.priceRange.min : undefined,
      maxPrice: filterValues.priceRange.max !== undefined ? filterValues.priceRange.max : undefined,
      stockStatus: filterValues.stockStatus && filterValues.stockStatus.length > 0 ? filterValues.stockStatus : undefined,
      featured: filterValues.productFlags.includes('featured') ? true : undefined,
      isNew: filterValues.productFlags.includes('new') ? true : undefined,
      isBestSeller: filterValues.productFlags.includes('best_seller') ? true : undefined,
      isOnSale: filterValues.productFlags.includes('on_sale') ? true : undefined,
      status: filterValues.status && filterValues.status.length > 0 ? (filterValues.status.length === 1 ? filterValues.status[0] as any : filterValues.status as any) : undefined
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
    // Navigate to edit-product page instead of opening modal
    try {
      // Get hashed appId from current URL
      const currentPath = window.location.pathname
      const pathMatch = currentPath.match(/\/merchant-panel\/([^\/]+)/)
      if (pathMatch && pathMatch[1]) {
        const hashedAppId = pathMatch[1]
        // Navigate to edit-product section with productId as query param
        router.push(`/merchant-panel/${hashedAppId}?section=edit-product&productId=${productId}`)
      } else {
        logger.error('Could not find hashed appId in URL path')
        setError('Unable to navigate to edit page')
      }
    } catch (error) {
      logger.error('Error navigating to edit page:', { error: error instanceof Error ? error.message : String(error) })
      setError('Failed to navigate to edit page')
    }
  }, [router, setError])

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

  const handleBulkDuplicate = useCallback(async () => {
    if (selectedProducts.length === 0 || !headers) return

    const duplicateOperations = selectedProducts.map(id => {
      const product = products.find(p => p.id === id)
      if (!product) return null
      
      const duplicateData = {
        ...product,
        name: `${product.name} (Copy)`,
        sku: `${product.sku}-COPY-${Date.now()}`,
        status: 'draft' as const
      }

      delete (duplicateData as any).id
      delete (duplicateData as any).createdAt
      delete (duplicateData as any).updatedAt

      return () => apiService.createProduct(duplicateData)
    }).filter(Boolean) as Array<() => Promise<any>>

    await executeOperation(
      () => Promise.all(duplicateOperations.map(op => op())),
      {
        successMessage: `${selectedProducts.length} product${selectedProducts.length === 1 ? '' : 's'} ${selectedProducts.length === 1 ? 'has' : 'have'} been duplicated successfully! 📋`,
        onSuccess: () => {
          setSelectedProducts([])
          fetchProducts()
        }
      }
    )
  }, [selectedProducts, products, headers, executeOperation, fetchProducts])

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

  // Direct delete function that doesn't show a modal (used by ProductGrid which has its own confirmation)
  const handleDeleteDirect = useCallback(async (productId: number) => {
    const product = products.find(p => p.id === productId)
    if (!product || !headers) return

    const productName = product.name

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
  }, [products, headers, setSuccessMessage, setError, fetchProducts])

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }, [])

  const handleLimitChange = useCallback((limit: number) => {
    setFilters(prev => ({ ...prev, limit, page: 1 }))
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
    <div className="overflow-x-hidden min-w-0">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-800">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800 transition-colors"
              aria-label="Close message"
            >
              ×
            </button>
          </div>
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 border rounded-lg transition-colors text-sm ${
              showFilters
                ? 'border-orange-500 bg-orange-50 text-orange-600'
                : hasActiveFilters
                ? 'border-orange-400 bg-orange-50/50 text-orange-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 text-xs font-semibold text-white bg-orange-600 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {showFilters && !hasActiveFilters && (
              <span className="hidden md:inline text-xs">(Active)</span>
            )}
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
              onClick={() => {
                if (onAddProduct) {
                  onAddProduct()
                } else {
                  setShowAddModal(true)
                }
              }}
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
            initialFilters={convertToFilterValues(filters)}
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
                onClick={() => setShowBulkDeleteModal(true)}
                disabled={crudLoading}
                className="px-3 py-1.5 text-sm bg-white border border-orange-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >Delete</button>
            )}
            <button
              onClick={() => setShowBulkDuplicateModal(true)}
              disabled={crudLoading}
              className="px-3 py-1.5 text-sm bg-white border border-orange-200 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >Duplicate</button>
            <button
              onClick={() => setSelectedProducts([])}
              className="px-3 py-1.5 text-sm bg-white border border-orange-200 rounded hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              title="Cancel selection"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel</span>
            </button>
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
              onDelete={canDeleteProducts ? handleDeleteDirect : undefined}
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
      <Pagination
        totalItems={totalProducts}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={filters.limit || 20}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleLimitChange}
        itemLabel="results"
        selectId="products-per-page-select"
      />

      {/* Modals - Lazy loaded for better performance */}
      <Suspense fallback={null}>
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            // Keep success message visible longer (6 seconds)
            setSuccessMessage('Product has been created successfully! 🎉', 6000)
            fetchProducts()
          }}
          appId={appId}
          apiKey={apiKey}
          appSecretKey={appSecretKey}
        />
      </Suspense>

      {/* EditProductModal removed - now using EditProductSection page instead */}

      {selectedProduct && (
        <Suspense fallback={null}>
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

      {/* Bulk Delete Confirmation Modal - Custom style matching ProductGrid */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedProducts.length === 1 ? 'Delete Product' : 'Delete Products'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedProducts.length === 1 ? (
                      <>
                        Are you sure you want to delete <span className="font-medium text-gray-900">"{products.find(p => p.id === selectedProducts[0])?.name || 'this product'}"</span>? This action cannot be undone.
                      </>
                    ) : (
                      <>
                        Are you sure you want to delete <span className="font-medium text-gray-900">{selectedProducts.length} selected products</span>? This action cannot be undone.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkDeleteModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowBulkDeleteModal(false)
                    await handleBulkDelete()
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete {selectedProducts.length === 1 ? 'Product' : 'Products'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Duplicate Confirmation Modal - Custom style matching ProductGrid */}
      {showBulkDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in-0 zoom-in-95">
            <div className="p-6">
              {/* Icon and Title */}
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Copy className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {selectedProducts.length === 1 ? 'Duplicate Product' : 'Duplicate Products'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedProducts.length === 1 ? (
                      <>
                        Are you sure you want to duplicate <span className="font-medium text-gray-900">"{products.find(p => p.id === selectedProducts[0])?.name || 'this product'}"</span>? A copy will be created with "(Copy)" added to the name.
                      </>
                    ) : (
                      <>
                        Are you sure you want to duplicate <span className="font-medium text-gray-900">{selectedProducts.length} selected products</span>? Copies will be created with "(Copy)" added to each name.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowBulkDuplicateModal(false)}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBulkDuplicateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowBulkDuplicateModal(false)
                    await handleBulkDuplicate()
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Duplicate {selectedProducts.length === 1 ? 'Product' : 'Products'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
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
