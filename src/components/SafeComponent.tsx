'use client'
import { logger } from '@/lib/logger'

import React, { ReactNode, Suspense } from 'react'
import ErrorBoundary from './ErrorBoundary'
import { cn } from '@/lib/css-utils'
import { isValidProps } from '@/lib/type-guards'

interface SafeComponentProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
  className?: string
  errorMessage?: string
  onError?: (error: Error) => void
}

/**
 * SafeComponent - Wraps components with error boundary and loading states
 * Provides consistent error handling and loading states across the app
 */
export default function SafeComponent({
  children,
  fallback,
  loadingFallback,
  className,
  errorMessage = 'Something went wrong',
  onError
}: SafeComponentProps) {
  const LoadingFallback = () => (
    <div className={cn('loading-container', className)}>
      <div className="spinner" />
      <p className="mt-4 text-sm text-gray-600">Loading...</p>
    </div>
  )

  const ErrorFallback = () => (
    <div className={cn('error-fallback', className)}>
      <div className="error-card">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">
          {errorMessage}
        </h2>
        <p className="text-sm text-center text-gray-600 mb-4">
          Please try refreshing the page or contact support if the problem persists.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )

  return (
    <ErrorBoundary fallback={fallback || <ErrorFallback />}>
      <Suspense fallback={loadingFallback || <LoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}

/**
 * SafeRender - Safely renders components with prop validation
 */
export function SafeRender<T extends Record<string, unknown>>({
  Component,
  props,
  fallback = null
}: {
  Component: React.ComponentType<T>
  props: unknown
  fallback?: ReactNode
}): ReactNode {
  if (!isValidProps(props)) {
    logger.warn('Invalid props passed to SafeRender:', { value: props })
    return fallback
  }

  try {
    return <Component {...(props as T)} />
  } catch (error) {
    logger.error('Error rendering component:', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    return fallback
  }
}

/**
 * SafeImage - Image component with error handling
 */
export function SafeImage({
  src,
  alt,
  className,
  fallbackSrc,
  ...props
}: {
  src?: string
  alt: string
  className?: string
  fallbackSrc?: string
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [imageSrc, setImageSrc] = React.useState(src)
  const [hasError, setHasError] = React.useState(false)

  const handleError = () => {
    if (fallbackSrc && !hasError) {
      setImageSrc(fallbackSrc)
      setHasError(true)
    }
  }

  if (!imageSrc || imageSrc.includes('undefined') || imageSrc === '') {
    return null
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      className={cn(className)}
      onError={handleError}
    />
  )
}