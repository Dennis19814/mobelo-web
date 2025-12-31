'use client'
import { logger } from '@/lib/logger'

import { useEffect } from 'react'

export default function ResourceLoadingOptimizer() {
  useEffect(() => {
    // Temporarily disabled to prevent fetch interference
    // This component was overriding fetch and createElement causing issues
    logger.debug('ResourceLoadingOptimizer: Temporarily disabled')
    
    // Simple error handler for resource loading errors without fetch override
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement
      if (target && (target.tagName === 'SCRIPT' || target.tagName === 'LINK')) {
        const src = (target as any).src || (target as any).href
        if (src) {
          // Silently handle extension-related errors without console spam
          const extensionPatterns = ['extension://', 'chrome-extension://', 'moz-extension://']
          if (extensionPatterns.some(pattern => src.includes(pattern))) {
            event.preventDefault()
            event.stopPropagation()
          }
        }
      }
    }
    
    // Only add error listener without overriding fetch or createElement
    document.addEventListener('error', handleResourceError, true)
    
    // Cleanup function
    return () => {
      document.removeEventListener('error', handleResourceError, true)
    }
  }, [])

  return null
}