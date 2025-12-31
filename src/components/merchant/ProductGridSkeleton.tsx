/**
 * ProductGridSkeleton Component
 *
 * High-performance skeleton loader for product grid view
 *
 * Features:
 * - Content-aware skeleton shapes (image, text, price)
 * - Responsive grid layout matching ProductGrid
 * - Subtle animation for better UX
 * - Optimized rendering with minimal DOM nodes
 */

interface ProductGridSkeletonProps {
  count?: number
}

export default function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="bg-white rounded-lg border border-gray-200 overflow-hidden"
        >
          {/* Image skeleton */}
          <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            {/* Title skeleton - 2 lines */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/5"></div>
            </div>

            {/* Price skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-6 bg-gray-300 rounded animate-pulse w-20"></div>
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
            </div>

            {/* Rating skeleton */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-4 h-4 bg-gray-200 rounded-sm animate-pulse"></div>
                ))}
              </div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-12"></div>
            </div>

            {/* Status badge skeleton */}
            <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
