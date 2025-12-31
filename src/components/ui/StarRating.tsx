'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number | string
  totalReviews?: number
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  showNumber?: boolean
  showCount?: boolean
  interactive?: boolean
  onRatingChange?: (rating: number) => void
  className?: string
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4', 
  lg: 'w-5 h-5'
}

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

export default function StarRating({
  rating,
  totalReviews,
  maxStars = 5,
  size = 'md',
  showNumber = true,
  showCount = true,
  interactive = false,
  onRatingChange,
  className
}: StarRatingProps) {
  // Convert rating to number if it's a string (from database)
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating
  const safeRating = isNaN(numericRating) ? 0 : numericRating
  
  const fullStars = Math.floor(safeRating)
  const hasHalfStar = safeRating % 1 !== 0
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0)

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, index) => (
          <Star
            key={`full-${index}`}
            className={cn(
              sizeClasses[size],
              'fill-yellow-400 text-yellow-400',
              interactive && 'cursor-pointer hover:scale-110 transition-transform'
            )}
            onClick={() => handleStarClick(index)}
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star
              className={cn(sizeClasses[size], 'text-gray-300')}
              onClick={() => handleStarClick(fullStars)}
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                className={cn(
                  sizeClasses[size],
                  'fill-yellow-400 text-yellow-400',
                  interactive && 'cursor-pointer'
                )}
                onClick={() => handleStarClick(fullStars)}
              />
            </div>
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, index) => (
          <Star
            key={`empty-${index}`}
            className={cn(
              sizeClasses[size],
              'text-gray-300',
              interactive && 'cursor-pointer hover:text-yellow-400 hover:scale-110 transition-all'
            )}
            onClick={() => handleStarClick(fullStars + (hasHalfStar ? 1 : 0) + index)}
          />
        ))}
      </div>

      {/* Rating number and review count */}
      <div className="flex items-center gap-1">
        {showNumber && safeRating > 0 && (
          <span className={cn('font-medium text-gray-700', textSizeClasses[size])}>
            {safeRating.toFixed(1)}
          </span>
        )}
        
        {showCount && totalReviews !== undefined && (
          <span className={cn('text-gray-500', textSizeClasses[size])}>
            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>
    </div>
  )
}

// Export StarRating component for use in other files
export { StarRating }