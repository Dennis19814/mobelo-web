/**
 * ProductTableSkeleton Component
 *
 * High-performance skeleton loader for product table/list view
 *
 * Features:
 * - Matches table structure exactly
 * - Staggered animation for natural loading feel
 * - Minimal re-renders
 */

interface ProductTableSkeletonProps {
  rows?: number
}

export default function ProductTableSkeleton({ rows = 10 }: ProductTableSkeletonProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table header skeleton */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-1">
            <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="col-span-4">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          </div>
          <div className="col-span-2">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
          <div className="col-span-1">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table rows skeleton */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={`skeleton-row-${index}`}
            className="px-6 py-4"
            style={{
              animationDelay: `${index * 50}ms`, // Staggered animation
            }}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Thumbnail */}
              <div className="col-span-1">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded animate-pulse"></div>
              </div>

              {/* Product info */}
              <div className="col-span-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5"></div>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3"></div>
              </div>

              {/* Price */}
              <div className="col-span-2">
                <div className="h-5 bg-gray-200 rounded animate-pulse w-20"></div>
              </div>

              {/* Stock */}
              <div className="col-span-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
              </div>

              {/* Actions */}
              <div className="col-span-1">
                <div className="h-8 bg-gray-200 rounded animate-pulse w-8"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
