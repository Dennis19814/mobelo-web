'use client'
import { logger } from '@/lib/logger'

import { useEffect } from 'react'

export default function NetworkErrorFilter() {
  useEffect(() => {
    // Temporarily disabled to prevent fetch interference
    // This component was causing issues with legitimate API calls
    logger.debug('NetworkErrorFilter: Temporarily disabled')
    
    // If you need to re-enable this, ensure proper error handling
    // and avoid interfering with legitimate API calls
    
    return () => {
      // Cleanup if needed
    }
  }, [])

  return null
}