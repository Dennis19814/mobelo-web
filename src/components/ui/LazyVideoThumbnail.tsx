'use client'

import React, { useState, useRef, useEffect } from 'react'
import VideoThumbnail, { VideoThumbnailProps } from './VideoThumbnail'

interface LazyVideoThumbnailProps extends VideoThumbnailProps {
  rootMargin?: string
  threshold?: number
  placeholder?: React.ReactNode
  onVisible?: () => void
}

export default function LazyVideoThumbnail({
  rootMargin = '50px',
  threshold = 0.1,
  placeholder,
  onVisible,
  className = '',
  ...videoProps
}: LazyVideoThumbnailProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (!hasBeenVisible) {
              setHasBeenVisible(true)
              onVisible?.()
            }
          } else {
            // Keep videos loaded once they've been visible to avoid re-loading
            if (!hasBeenVisible) {
              setIsVisible(false)
            }
          }
        })
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [rootMargin, threshold, hasBeenVisible, onVisible])

  // Default placeholder
  const defaultPlaceholder = (
    <div 
      className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
      style={{ 
        width: videoProps.width || 400, 
        height: videoProps.height || 300 
      }}
    >
      <div className="text-gray-400 text-center">
        <div className="w-8 h-8 mx-auto mb-2 bg-gray-300 rounded" />
        <div className="text-xs">Loading video...</div>
      </div>
    </div>
  )

  return (
    <div ref={elementRef} className="relative">
      {isVisible || hasBeenVisible ? (
        <VideoThumbnail
          {...videoProps}
          className={className}
          // Only preload metadata when visible to save bandwidth
          preload={isVisible ? 'metadata' : 'none'}
        />
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  )
}

// Export type for use in other components
export type { LazyVideoThumbnailProps }