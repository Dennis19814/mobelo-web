import { logger } from '@/lib/logger'
/**
 * Application Configuration
 * Centralized configuration management using environment variables
 */

import { DEFAULT_API_PORT } from '@mobile-app-designer/shared-types';

// Helper function to get environment variable with fallback
function getEnvVar(key: string, fallback?: string): string {
  const value = process.env[key]
  if (value === undefined && fallback === undefined) {
    throw new Error(`Environment variable ${key} is required but not set`)
  }
  return value || fallback || ''
}

// Helper function to get boolean environment variable
function getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
  const value = process.env[key]
  if (!value) return fallback
  return value.toLowerCase() === 'true' || value === '1'
}

// Helper function to get number environment variable
function getNumberEnvVar(key: string, fallback: number): number {
  const value = process.env[key]
  if (!value) return fallback
  const num = parseInt(value, 10)
  return isNaN(num) ? fallback : num
}

// Application Configuration
export const config = {
  // App Information
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Mobile App Designer'),
    description: getEnvVar('NEXT_PUBLIC_APP_DESCRIPTION', 'AI-powered mobile app design tool'),
    version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
    environment: getEnvVar('NODE_ENV', 'development'),
  },

  // API Configuration
  api: {
    baseUrl: getEnvVar('NEXT_PUBLIC_API_URL', `http://localhost:${DEFAULT_API_PORT}/api`),
    timeout: getNumberEnvVar('NEXT_PUBLIC_API_TIMEOUT', 10000),
  },

  // Authentication Configuration
  auth: {
    jwtSecret: getEnvVar('NEXT_PUBLIC_JWT_SECRET', 'your-jwt-secret-here'),
    otpLength: getNumberEnvVar('NEXT_PUBLIC_OTP_LENGTH', 6),
    otpExpiryMinutes: getNumberEnvVar('NEXT_PUBLIC_OTP_EXPIRY_MINUTES', 10),
  },

  // Feature Flags
  features: {
    enableAnalytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS'),
    enableErrorReporting: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ERROR_REPORTING'),
    enableMockData: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_MOCK_DATA', true),
  },

  // Development Settings
  development: {
    debugMode: getBooleanEnvVar('NEXT_PUBLIC_DEBUG_MODE', true),
    showPerformanceMetrics: getBooleanEnvVar('NEXT_PUBLIC_SHOW_PERFORMANCE_METRICS'),
    disableDirectApi: getBooleanEnvVar('NEXT_PUBLIC_DISABLE_DIRECT_API_IN_DEV', false),
  },

  // External Services
  services: {
    googleAnalyticsId: getEnvVar('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', ''),
    sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN', ''),
    // IMPORTANT: Must use direct access (not getEnvVar) for webpack replacement to work
    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '',
  },

  // File Upload Configuration
  uploads: {
    maxFileSize: getNumberEnvVar('NEXT_PUBLIC_MAX_FILE_SIZE', 5000000), // 5MB
    allowedFileTypes: getEnvVar('NEXT_PUBLIC_ALLOWED_FILE_TYPES', 'image/jpeg,image/png,image/gif').split(','),
  },

  // Rate Limiting
  rateLimit: {
    requests: getNumberEnvVar('NEXT_PUBLIC_RATE_LIMIT_REQUESTS', 100),
    windowMs: getNumberEnvVar('NEXT_PUBLIC_RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
  },

  // URLs and Paths
  urls: {
    homepage: '/',
    signIn: '/signin',
    signUp: '/signup',
    dashboard: '/dashboard',
    myApps: '/my-apps',
    settings: '/settings',
    help: '/help',
  },
} as const

// Export individual config sections for convenience
export const appConfig = config.app
export const apiConfig = config.api
export const authConfig = config.auth
export const featureFlags = config.features
export const devConfig = config.development

// Helper functions for common config checks
export const isDevelopment = () => config.app.environment === 'development'
export const isProduction = () => config.app.environment === 'production'
export const isDebugMode = () => config.development.debugMode && isDevelopment()
export const isMockDataEnabled = () => config.features.enableMockData

// Validate required configuration on startup
export function validateConfig(): void {
  const requiredInProduction = [
    'NEXT_PUBLIC_API_URL',
  ]

  if (isProduction()) {
    for (const key of requiredInProduction) {
      if (!process.env[key]) {
        throw new Error(`Required environment variable ${key} is not set in production`)
      }
    }
  }
}

// Log configuration on startup (excluding sensitive data)
export function logConfig(): void {
  if (isDebugMode()) {
    console.group('🔧 Application Configuration')
    logger.debug('App Name:', { value: config.app.name })
    logger.debug('Version:', { value: config.app.version })
    logger.debug('Environment:', { value: config.app.environment })
    logger.debug('API Base URL:', { value: config.api.baseUrl })
    logger.debug('Mock Data Enabled:', { value: config.features.enableMockData })
    logger.debug('Debug Mode:', { value: config.development.debugMode })
    console.groupEnd()
  }
}