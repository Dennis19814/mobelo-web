'use client'
import { logger } from '@/lib/logger'

import React, { Component, ReactNode } from 'react'
import { handleError } from '@/lib/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info in state for debugging
    this.setState({ errorInfo })

    // Only log non-extension errors
    if (!this.isExtensionError(error)) {
      const errorDetails = handleError(error, 'ErrorBoundary')
      logger.error('ErrorBoundary caught an error:', { ...errorDetails, errorInfo })
    }
  }

  isExtensionError(error: Error): boolean {
    const errorString = error.toString()
    const stackString = error.stack || ''
    
    // Check for common extension-related errors
    const extensionPatterns = [
      'extension://',
      'chrome-extension://',
      'moz-extension://',
      'features.js',
      'webpack.js',
      '_app.js',
      '_error.js',
      'express-fte',
      'local-storage.js',
      'fte-utils.js',
      'frame_start.js',
      'sidePanelUtil.js',
      'main.js',
      'react-refresh.js',
      'my-apps:0',
      'content-script-utils.js:18',
      'GenAIWebpageEligibilitySet',
      'ShowOneChild.js:18',
      'frame_start.js:2',
      'express-fte-utils.js:18',
      'EmbeddedPDFTouchPointController',
      'features:0'
    ]
    
    return extensionPatterns.some(pattern => 
      errorString.includes(pattern) || stackString.includes(pattern)
    )
  }

  render() {
    if (this.state.hasError) {
      // Don't show error UI for extension errors
      if (this.state.error && this.isExtensionError(this.state.error)) {
        // Still render children but suppress the error
        return this.props.children
      }

      // Show fallback UI for actual application errors
      return this.props.fallback || (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              {/* Error Icon */}
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Something went wrong
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {/* Error Details (development only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="w-full mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 mb-2">
                    Technical Details
                  </summary>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-mono text-red-600 mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="text-xs font-mono text-gray-600 overflow-auto max-h-40">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Actions */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <p className="text-sm text-gray-500 mt-4">
                If the problem persists, please contact support
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary