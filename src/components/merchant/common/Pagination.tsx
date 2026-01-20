'use client'

import { memo } from 'react'

export interface PaginationProps {
  /** Total number of items */
  totalItems: number
  /** Current page number (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Items per page */
  itemsPerPage: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Callback when items per page changes */
  onItemsPerPageChange?: (itemsPerPage: number) => void
  /** Available items per page options */
  itemsPerPageOptions?: number[]
  /** Optional label for the items (e.g., "products", "orders") */
  itemLabel?: string
  /** Optional custom ID for the per-page select (for accessibility) */
  selectId?: string
}

/**
 * Reusable Pagination Component
 * 
 * Based on the Products section pagination implementation.
 * Provides consistent pagination UI/UX across all sections.
 * 
 * Features:
 * - Mobile-responsive (Previous/Next on mobile, full controls on desktop)
 * - Shows "Showing X to Y of Z results"
 * - Items per page selector
 * - Page number navigation (shows up to 5 page numbers)
 * - Accessible with proper ARIA labels
 */
const Pagination = ({
  totalItems,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [15, 20, 30],
  itemLabel = 'results',
  selectId = 'per-page-select'
}: PaginationProps) => {
  // Don't render if there are no items
  if (totalItems === 0) {
    return null
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 sm:px-6 rounded-lg border border-gray-200">
      {/* Mobile: Previous/Next buttons */}
      <div className="flex flex-1 justify-between sm:hidden">
        {totalPages > 1 && (
          <>
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </>
        )}
      </div>

      {/* Desktop: Full pagination controls */}
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between sm:gap-4">
        {/* Results count */}
        <div>
          <p className="text-xs text-gray-700">
            Showing{' '}
            <span className="font-medium">{startItem}</span>{' '}
            to{' '}
            <span className="font-medium">{endItem}</span>{' '}
            of{' '}
            <span className="font-medium">{totalItems}</span>{' '}
            {itemLabel}
          </p>
        </div>

        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <label htmlFor={selectId} className="text-xs text-gray-700 whitespace-nowrap">
              Per page:
            </label>
            <select
              id={selectId}
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 cursor-pointer h-7"
            >
              {itemsPerPageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <div>
            <nav className="inline-flex items-center gap-1" aria-label="Pagination">
              {/* Previous button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <span className="sr-only">Previous</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers (shows up to 5 pages) */}
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
                    onClick={() => onPageChange(pageNum)}
                    className={`
                      inline-flex items-center justify-center min-w-[32px] h-8 px-3 border rounded-md text-sm font-medium transition-colors
                      ${currentPage === pageNum
                        ? 'bg-orange-50 border-orange-500 text-orange-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                    aria-label={`Page ${pageNum}`}
                    aria-current={currentPage === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {/* Next button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <span className="sr-only">Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(Pagination)
