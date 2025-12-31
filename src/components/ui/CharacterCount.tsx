import React from 'react'

interface CharacterCountProps {
  current: number
  max: number
  recommended?: number
  className?: string
  showRecommended?: boolean
}

export default function CharacterCount({
  current,
  max,
  recommended,
  className = '',
  showRecommended = false
}: CharacterCountProps) {
  const percentage = (current / max) * 100

  // Determine color based on percentage
  const getColor = () => {
    if (percentage >= 100) return 'text-red-600'
    if (percentage >= 90) return 'text-orange-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-gray-500'
  }

  const getProgressBarColor = () => {
    if (percentage >= 100) return 'bg-red-500'
    if (percentage >= 90) return 'bg-orange-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className={`flex items-center justify-between text-xs mt-1 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`${getColor()} tabular-nums`}>
          {current}/{max} characters
        </span>
        {showRecommended && recommended && current <= max && (
          <span className="text-gray-400">
            (recommended: {recommended})
          </span>
        )}
      </div>

      {/* Mini progress bar */}
      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${getProgressBarColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}