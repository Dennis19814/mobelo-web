'use client'
import { logger } from '@/lib/logger'

import { useState, useEffect, useCallback, useMemo, memo, lazy, Suspense } from 'react'
import { useMerchantAuth, useCrudOperations } from '@/hooks'
import Image from 'next/image'
import { Star, Filter, Search, MessageSquare, Eye, Reply, AlertCircle } from 'lucide-react'
import { apiService } from '@/lib/api-service'
import type {
  Product,
  Review,
  RatingSummary,
  ReviewQuery,
  ReviewsResponse
} from '@/types/product.types'
import { StarRating } from '@/components/ui/StarRating'

// Lazy load modal
const ReviewModal = lazy(() => import('../modals/ReviewModal'))

interface ReviewsSectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

interface ProductWithReviewSummary extends Product {
  ratingSummary?: RatingSummary
}

/**
 * ReviewsSection Component
 *
 * Manages product review listing and merchant responses for a merchant app.
 * Shows products with their review summaries and allows viewing individual reviews.
 */
const ReviewsSectionComponent = ({ appId, apiKey, appSecretKey }: ReviewsSectionProps) => {
  const { headers } = useMerchantAuth(apiKey, appSecretKey)
  const {
    loading: crudLoading,
    error: crudError,
    successMessage,
    executeOperation,
    setSuccessMessage,
    setError: setCrudError
  } = useCrudOperations()

  const [products, setProducts] = useState<ProductWithReviewSummary[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductWithReviewSummary | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [hasResponseFilter, setHasResponseFilter] = useState<boolean | null>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [modalPosition, setModalPosition] = useState<{ x: number; y: number } | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const reviewsPerPage = 10

  // Fetch products with review summaries
  const fetchProducts = useCallback(async () => {
    // Allow fetch if either dual-key headers are available (owner)
    // or a staff JWT is present in localStorage (staff user)
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if (!headers && !hasStaffToken) {
      logger.debug('Skipping products fetch - Headers not available and no staff token')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Try standard merchant products endpoint first
      const response = await apiService.getProducts({
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      })

      if (response.ok && response.data) {
        let productsData: any[] = []
        if (response.data.data) {
          productsData = response.data.data
        } else if (Array.isArray(response.data)) {
          productsData = response.data
        }

        const productsWithReviews = productsData.filter((p: Product) => p.totalReviews && p.totalReviews > 0)
        setProducts(productsWithReviews)
        return
      }

      // If we reach here without returning, we'll fall through to mobile fallback
      throw new Error('Primary products fetch failed')

    } catch (primaryError) {
      // Attempt mobile list fallback (useful for staff users without product view permission)
      try {
        const mobileResp = await apiService.getMobileProductList({ limit: 50, sortBy: 'newest', sortOrder: 'desc' })
        if (mobileResp.ok && mobileResp.data && Array.isArray(mobileResp.data.products)) {
          const mapped: ProductWithReviewSummary[] = mobileResp.data.products.map((mp: any) => ({
            id: mp.id,
            name: mp.name,
            basePrice: mp.price ?? 0,
            status: 'active',
            featured: !!mp.isFeatured,
            brand: mp.brand,
            thumbnailUrl: mp.image,
            averageRating: mp.rating ?? 0,
            totalReviews: mp.reviewCount ?? 0,
          }))
          const withReviews = mapped.filter(p => (p.totalReviews || 0) > 0)
          setProducts(withReviews)
          return
        }
        throw new Error('Mobile fallback returned no products')
      } catch (fallbackError) {
        logger.error('Error fetching products (with fallback):', {
          error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          primary: primaryError instanceof Error ? primaryError.message : String(primaryError)
        })
        setError('Failed to load products with reviews')
      }
    } finally {
      setLoading(false)
    }
  }, [headers])

  // Fetch reviews for a specific product
  const fetchProductReviews = useCallback(async (product: ProductWithReviewSummary) => {
    // Allow fetch if either dual-key headers are available (owner)
    // or a staff JWT is present in localStorage (staff user)
    const hasStaffToken = typeof window !== 'undefined' ? !!localStorage.getItem('staff_access_token') : false
    if (!headers && !hasStaffToken) {
      logger.debug('Skipping reviews fetch - Headers not available and no staff token')
      return
    }

    try {
      setReviewsLoading(true)
      setSelectedProduct(product)

      const queryParams: ReviewQuery = {
        page: currentPage,
        limit: reviewsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      }

      if (ratingFilter) {
        queryParams.rating = ratingFilter
      }

      if (hasResponseFilter !== null) {
        queryParams.hasResponse = hasResponseFilter
      }

      const response = await apiService.getProductReviews(product.id, queryParams)

      if (response.ok && response.data) {
        let reviewsData = []
        if (response.data.data) {
          // Paginated response
          reviewsData = response.data.data
          setTotalReviews(response.data.meta?.total || 0)
          setTotalPages(response.data.meta?.totalPages || 1)
        } else if (Array.isArray(response.data)) {
          // Simple array response
          reviewsData = response.data
          setTotalReviews(reviewsData.length)
          setTotalPages(Math.ceil(reviewsData.length / reviewsPerPage))
        }

        setReviews(reviewsData)
      } else {
        throw new Error('Failed to fetch reviews')
      }

    } catch (error) {
      logger.error('Error fetching reviews:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
      setError('Failed to load reviews')
    } finally {
      setReviewsLoading(false)
    }
  }, [headers, currentPage, ratingFilter, hasResponseFilter, reviewsPerPage])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Refetch reviews when filters change
  useEffect(() => {
    if (selectedProduct) {
      fetchProductReviews(selectedProduct)
    }
  }, [ratingFilter, hasResponseFilter, currentPage, selectedProduct, fetchProductReviews])

  // Handle product selection with filter reset
  const handleSelectProduct = useCallback((product: ProductWithReviewSummary) => {
    // Reset filters when switching products
    setRatingFilter(null)
    setHasResponseFilter(null)
    setCurrentPage(1)
    // Fetch reviews for the selected product
    fetchProductReviews(product)
  }, [fetchProductReviews])

  // Handle opening review modal
  const handleViewReview = useCallback((review: Review, event: React.MouseEvent) => {
    // Get click position relative to viewport
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    setModalPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + window.scrollY
    })
    setSelectedReview(review)
    setShowReviewModal(true)
  }, [])

  // Handle merchant response added
  const handleResponseAdded = useCallback((reviewId: number, response: string) => {
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? {
            ...review,
            merchantResponse: response,
            merchantResponseAt: new Date().toISOString()
          }
        : review
    ))
  }, [])

  const filteredProducts = useMemo(() =>
    products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [products, searchTerm]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading products with reviews...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
            />
          </div>
        </div>
      </div>

      {!selectedProduct ? (
        // Products list view
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Products with Reviews</h2>
            <p className="mt-1 text-sm text-gray-500">
              Click on a product to view and manage its reviews
            </p>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products with reviews</h3>
              <p className="text-gray-500">
                Once customers start leaving reviews, they will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.thumbnailUrl ? (
                          <Image
                            src={product.thumbnailUrl}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <Star className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <div className="mt-1 flex items-center space-x-4">
                          <StarRating 
                            rating={product.averageRating || 0} 
                            totalReviews={product.totalReviews || 0} 
                            size="sm"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center text-gray-400">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        // Product reviews view
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedProduct(null)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              ← Back to Products
            </button>
            <div className="flex items-center gap-4">
              <select
                value={ratingFilter || ''}
                onChange={(e) => setRatingFilter(e.target.value ? parseInt(e.target.value) : null)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white"
              >
                <option value="">All ratings</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
              <select
                value={hasResponseFilter === null ? '' : hasResponseFilter.toString()}
                onChange={(e) => setHasResponseFilter(e.target.value === '' ? null : e.target.value === 'true')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm bg-white"
              >
                <option value="">All reviews</option>
                <option value="true">With response</option>
                <option value="false">No response</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  {selectedProduct.thumbnailUrl ? (
                    <Image
                      src={selectedProduct.thumbnailUrl}
                      alt={selectedProduct.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Star className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedProduct.name}</h2>
                  <div className="mt-2">
                    <StarRating 
                      rating={selectedProduct.averageRating || 0} 
                      totalReviews={selectedProduct.totalReviews || 0} 
                      size="md"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {reviewsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
                <p className="text-gray-500">No reviews match your current filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <div key={review.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {review.mobileUser?.firstName} {review.mobileUser?.lastName}
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <StarRating rating={review.rating} size="sm" showNumber={false} showCount={false} />
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                    )}
                    
                    {review.description && (
                      <p className="text-gray-600 mb-4">{review.description}</p>
                    )}
                    
                    {review.merchantResponse ? (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Reply className="w-4 h-4 text-orange-600 mr-2" />
                          <span className="font-medium text-slate-900">Merchant Response</span>
                          <span className="text-sm text-orange-600 ml-2">
                            {new Date(review.merchantResponseAt!).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-blue-800">{review.merchantResponse}</p>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleViewReview(review, e)}
                        className="flex items-center text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Respond to review
                      </button>
                    )}
                    
                    {review.helpfulCount > 0 && (
                      <div className="mt-2 text-sm text-gray-500">
                        {review.helpfulCount} {review.helpfulCount === 1 ? 'person found' : 'people found'} this helpful
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Review Modal */}
      <Suspense fallback={null}>
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setModalPosition(null)
          }}
          review={selectedReview}
          productName={selectedProduct?.name || ''}
          apiKey={apiKey}
          appSecretKey={appSecretKey}
          onResponseAdded={handleResponseAdded}
          position={modalPosition}
        />
      </Suspense>
    </div>
  )
}

export default memo(ReviewsSectionComponent)
