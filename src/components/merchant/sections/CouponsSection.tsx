'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense,useRef } from 'react'
import { apiService } from '@/lib/api-service'
import { Coupon, CouponFilters, CouponStatus, DiscountType, TargetScope, BuyXGetYConfig } from '@/types/coupon'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { Pagination } from '../common'

// Lazy load modals for better performance
const CreateCouponModal = lazy(() => import('../CreateCouponModal'))
const EditCouponModal = lazy(() => import('../EditCouponModal'))
const DeleteConfirmationModal = lazy(() => import('@/components/modals/DeleteConfirmationModal'))

interface CouponsSectionProps {
  appId: number
  apiKey?: string
  appSecretKey?: string
}

export default function CouponsSection({ appId, apiKey, appSecretKey }: CouponsSectionProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CouponFilters>({
    page: 1,
    limit: 20,
  })
  const [searchInput, setSearchInput] = useState('')
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [total, setTotal] = useState(0)
  const [selectedCoupons, setSelectedCoupons] = useState<number[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [loadingCoupon, setLoadingCoupon] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const totalPages = useMemo(() => Math.ceil(total / (filters.limit || 20)), [total, filters.limit])

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page })
  }

  const handleLimitChange = (limit: number) => {
    setFilters({ ...filters, limit, page: 1 })
  }

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiService.getCoupons(filters)

      if (response.ok) {
        const normalizedList = (response.data.data || []).map((item: Coupon) => normalizeCoupon(item))
        setCoupons(normalizedList)
        setTotal(response.data.total || 0)
      }
    } catch (error) {
      console.error('Failed to load coupons:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadCoupons()
  }, [loadCoupons])

  const handleDeleteClick = (coupon: Coupon) => {
    setCouponToDelete(coupon)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!couponToDelete) return
    setDeleteLoading(true)
    try {
      const response = await apiService.deleteCoupon(couponToDelete.id)
      if (response.ok) {
        setIsDeleteModalOpen(false)
        setCouponToDelete(null)
        loadCoupons()
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const dedupeNumbers = (values?: number[]) =>
    values ? Array.from(new Set(values)) : undefined

  const normalizeCoupon = (rawCoupon: any): Coupon => {
    if (!rawCoupon) return rawCoupon

    const {
      targetProducts,
      targetCategories,
      targetBrands,
      bxgyProducts,
      ...baseCoupon
    } = rawCoupon

    const includedProducts = targetProducts
      ? targetProducts.filter((item: any) => !item.isExcluded).map((item: any) => item.productId)
      : rawCoupon.targetScope?.productIds

    const excludedProducts = targetProducts
      ? targetProducts.filter((item: any) => item.isExcluded).map((item: any) => item.productId)
      : rawCoupon.targetScope?.excludeProductIds

    const includedCategories = targetCategories
      ? targetCategories.filter((item: any) => !item.isExcluded).map((item: any) => item.categoryId)
      : rawCoupon.targetScope?.categoryIds

    const excludedCategories = targetCategories
      ? targetCategories.filter((item: any) => item.isExcluded).map((item: any) => item.categoryId)
      : rawCoupon.targetScope?.excludeCategoryIds

    const includedBrands = targetBrands
      ? targetBrands.filter((item: any) => !item.isExcluded).map((item: any) => item.brandId)
      : rawCoupon.targetScope?.brandIds

    const excludedBrands = targetBrands
      ? targetBrands.filter((item: any) => item.isExcluded).map((item: any) => item.brandId)
      : rawCoupon.targetScope?.excludeBrandIds

    const hasScopeData = [
      includedProducts?.length,
      excludedProducts?.length,
      includedCategories?.length,
      excludedCategories?.length,
      includedBrands?.length,
      excludedBrands?.length,
    ].some((value) => !!value)

    const targetScope: TargetScope | undefined = hasScopeData
      ? {
          productIds: dedupeNumbers(includedProducts),
          excludeProductIds: dedupeNumbers(excludedProducts),
          categoryIds: dedupeNumbers(includedCategories),
          excludeCategoryIds: dedupeNumbers(excludedCategories),
          brandIds: dedupeNumbers(includedBrands),
          excludeBrandIds: dedupeNumbers(excludedBrands),
        }
      : rawCoupon.targetScope

    const buyXGetYConfig: BuyXGetYConfig | undefined =
      rawCoupon.discountType === 'buy_x_get_y'
        ? rawCoupon.buyXGetYConfig ?? {
            buyQuantity: rawCoupon.buyQuantity,
            getQuantity: rawCoupon.getQuantity,
            getDiscountType: rawCoupon.getDiscountType,
            getDiscountValue: rawCoupon.getDiscountValue,
            targetProductIds: dedupeNumbers(bxgyProducts?.map((item: any) => item.productId)),
          }
        : undefined

    return {
      ...baseCoupon,
      targetScope,
      buyXGetYConfig,
    }
  }

  const handleEdit = async (coupon: Coupon) => {
    try {
      setLoadingCoupon(true)
      const response = await apiService.getCoupon(coupon.id)

      if (response.ok && response.data?.coupon) {
        setEditingCoupon(normalizeCoupon(response.data.coupon))
      } else {
        console.warn('Falling back to cached coupon data for editing')
        setEditingCoupon(normalizeCoupon(coupon))
      }

      setShowEditModal(true)
    } catch (error) {
      console.error('Failed to load coupon details:', error)
      setEditingCoupon(normalizeCoupon(coupon))
      setShowEditModal(true)
    } finally {
      setLoadingCoupon(false)
    }
  }

  const handleBulkStatusUpdate = async (status: CouponStatus) => {
    if (selectedCoupons.length === 0) return

    try {
      const response = await apiService.bulkUpdateCouponStatus(selectedCoupons, status)
      if (response.ok) {
        setSelectedCoupons([])
        loadCoupons()
      }
    } catch (error) {
      console.error('Failed to update coupon status:', error)
    }
  }

  const getStatusBadgeClass = (status: CouponStatus) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      expired: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-red-100 text-red-800',
    }
    return classes[status] || classes.active
  }

  const getDiscountTypeLabel = (type: DiscountType) => {
    const labels = {
      percentage: 'Percentage',
      fixed_amount: 'Fixed Amount',
      free_shipping: 'Free Shipping',
      buy_x_get_y: 'Buy X Get Y',
    }
    return labels[type] || type
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`
    } else if (coupon.discountType === 'fixed_amount') {
      return `$${coupon.discountValue}`
    } else if (coupon.discountType === 'free_shipping') {
      return 'Free Shipping'
    } else {
      return `Buy ${coupon.buyXGetYConfig?.buyQuantity} Get ${coupon.buyXGetYConfig?.getQuantity}`
    }
  }

  return (
    <div className="overflow-x-hidden min-w-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Coupons & Discounts</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage coupon codes and discount campaigns
        </p>
      </div>

      {/* When loading: show only spinner (same as Shipping Zones / Brands) */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        </div>
      ) : (
        <>
      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search coupons..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          {/* Status Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={filters.status || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as CouponStatus, page: 1 }))}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="archived">Archived</option>
          </select>

          {/* Type Filter */}
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            value={filters.discountType || ''}
            onChange={(e) => setFilters((prev) => ({ ...prev, discountType: e.target.value as DiscountType, page: 1 }))}
          >
            <option value="">All Types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed_amount">Fixed Amount</option>
            <option value="free_shipping">Free Shipping</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
          </select>
        </div>

        <div className="flex gap-3">
          {selectedCoupons.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusUpdate('active')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Activate ({selectedCoupons.length})
              </button>
              <button
                onClick={() => handleBulkStatusUpdate('paused')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                Pause ({selectedCoupons.length})
              </button>
            </div>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium"
          >
            Create Coupon
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      {coupons.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">No coupons found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Create Your First Coupon
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto overflow-y-visible min-w-0" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '640px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedCoupons.length === coupons.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCoupons(coupons.map(c => c.id))
                      } else {
                        setSelectedCoupons([])
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="hidden sm:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="hidden md:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="hidden lg:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="hidden xl:table-cell px-3 py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-2 sm:px-3 py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 sm:py-4">
                    <input
                      type="checkbox"
                      checked={selectedCoupons.includes(coupon.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCoupons([...selectedCoupons, coupon.id])
                        } else {
                          setSelectedCoupons(selectedCoupons.filter(id => id !== coupon.id))
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-3 py-3 sm:py-4 whitespace-nowrap">
                    <span className="font-mono font-medium text-xs sm:text-sm text-gray-900">{coupon.code}</span>
                  </td>
                  <td className="px-3 py-3 sm:py-4">
                    <div className="text-xs sm:text-sm font-medium text-gray-900">{coupon.name}</div>
                    {coupon.description && (
                      <div className="hidden sm:block text-xs text-gray-500 truncate max-w-xs">{coupon.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900">{formatDiscount(coupon)}</span>
                  </td>
                  <td className="hidden sm:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                    <span className="text-xs sm:text-sm text-gray-500">{getDiscountTypeLabel(coupon.discountType)}</span>
                  </td>
                  <td className="hidden md:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs sm:text-sm text-gray-900">
                      {coupon.totalUsageCount}{coupon.maxUsageTotal && ` / ${coupon.maxUsageTotal}`}
                    </div>
                  </td>
                  <td className="hidden lg:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500">
                      {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                    </div>
                  </td>
                  <td className="hidden xl:table-cell px-3 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusBadgeClass(coupon.status)}`}>
                      {coupon.status}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 py-3 sm:py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(coupon)}
                        className="text-gray-600 hover:text-orange-600 text-xs sm:text-sm p-1"
                           title="Edit Coupon"
                      >
                                    <Pencil className="h-4 w-4" />

                      </button>
                      <button
                        onClick={() => handleDeleteClick(coupon)}
                        disabled={deleteLoading}
                        className="text-gray-600 hover:text-red-600 text-xs sm:text-sm p-1 disabled:opacity-50"
                        title="Delete Coupon"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {coupons.length > 0 && (
        <div className="mt-4">
          <Pagination
            totalItems={total}
            currentPage={filters.page || 1}
            totalPages={totalPages}
            itemsPerPage={filters.limit || 20}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleLimitChange}
            itemLabel="coupons"
            selectId="coupons-per-page-select"
          />
        </div>
      )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
          <CreateCouponModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              // Reset to page 1 and clear search/status so the new coupon shows in the table (useEffect will refetch)
              setFilters((f) => ({ ...f, page: 1, limit: f.limit || 20, search: undefined, status: undefined }))
            }}
          />
        </Suspense>
      )}

      {/* Edit Modal */}
      {loadingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg px-6 py-4 flex items-center space-x-3">
            <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
            <span className="text-gray-700">Loading coupon details...</span>
          </div>
        </div>
      )}
      {showEditModal && editingCoupon && !loadingCoupon && (
        <Suspense fallback={<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>}>
          <EditCouponModal
            coupon={editingCoupon}
            onClose={() => {
              setShowEditModal(false)
              setEditingCoupon(null)
            }}
            onSuccess={() => {
              setShowEditModal(false)
              setEditingCoupon(null)
              loadCoupons()
            }}
          />
        </Suspense>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && couponToDelete && (
        <Suspense fallback={null}>
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setCouponToDelete(null)
            }}
            onConfirm={handleDeleteConfirm}
            title="Delete Coupon"
            itemType="coupon"
            itemName={couponToDelete.code || couponToDelete.name || 'this coupon'}
          />
        </Suspense>
      )}

    </div>
  )
}
