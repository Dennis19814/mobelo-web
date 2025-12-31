/**
 * Centralized Configuration for Mobile App Designer
 *
 * This file contains all shared configuration values that need to be
 * consistent across both frontend (Next.js) and backend (NestJS) applications.
 *
 * The configuration can be overridden by environment variables but provides
 * sensible defaults for development.
 */

/**
 * Application-wide configuration constants
 */
export const APP_CONFIG = {
  /**
   * API Configuration
   */
  API: {
    /** Default port for the API server - UPDATED to match current backend */
    DEFAULT_PORT: 3000,
    /** Default host for the API server */
    DEFAULT_HOST: 'localhost',
    /** Default protocol for the API server */
    DEFAULT_PROTOCOL: 'http',
  },

  /**
   * Frontend Configuration
   */
  FRONTEND: {
    /** Default port for the frontend server */
    DEFAULT_PORT: 5173,
    /** Default host for the frontend server */
    DEFAULT_HOST: 'localhost',
    /** Default protocol for the frontend server */
    DEFAULT_PROTOCOL: 'http',
  },

  /**
   * Authentication Configuration
   */
  AUTH: {
    /** JWT expiry time */
    JWT_EXPIRES_IN: '7d',
    /** OTP length */
    OTP_LENGTH: 6,
    /** OTP expiry in minutes */
    OTP_EXPIRY_MINUTES: 10,
  },

  /**
   * Get the base URL for the API (without /api suffix)
   * Respects environment variables: PORT, API_HOST, API_PROTOCOL
   */
  get API_BASE_URL() {
    // First check for NEXT_PUBLIC_API_URL which works in both browser and server contexts
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) {
      // Remove /api suffix if present to get base URL
      return process.env.NEXT_PUBLIC_API_URL.replace(/\/api$/, '');
    }

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      // Browser fallback to defaults
      return `${this.API.DEFAULT_PROTOCOL}://${this.API.DEFAULT_HOST}:${this.API.DEFAULT_PORT}`;
    }

    // Server-side can use additional environment variables
    const port = process.env.PORT || process.env.API_PORT || this.API.DEFAULT_PORT;
    const host = process.env.API_HOST || this.API.DEFAULT_HOST;
    const protocol = process.env.API_PROTOCOL || this.API.DEFAULT_PROTOCOL;
    return `${protocol}://${host}:${port}`;
  },

  /**
   * Get the full API URL (with /api suffix)
   */
  get API_FULL_URL() {
    return `${this.API_BASE_URL}/api`;
  },

  /**
   * Get the frontend URL
   */
  get FRONTEND_URL() {
    // First check for NEXT_PUBLIC_APP_URL which works in both browser and server contexts
    if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      // Browser fallback to defaults
      return `${this.FRONTEND.DEFAULT_PROTOCOL}://${this.FRONTEND.DEFAULT_HOST}:${this.FRONTEND.DEFAULT_PORT}`;
    }

    // Server-side can use additional environment variables
    const port = process.env.FRONTEND_PORT || this.FRONTEND.DEFAULT_PORT;
    const host = process.env.FRONTEND_HOST || this.FRONTEND.DEFAULT_HOST;
    const protocol = process.env.FRONTEND_PROTOCOL || this.FRONTEND.DEFAULT_PROTOCOL;
    return `${protocol}://${host}:${port}`;
  }
} as const;

/**
 * Export individual constants for convenience
 */
export const DEFAULT_API_PORT = APP_CONFIG.API.DEFAULT_PORT;
export const DEFAULT_API_HOST = APP_CONFIG.API.DEFAULT_HOST;
export const DEFAULT_API_PROTOCOL = APP_CONFIG.API.DEFAULT_PROTOCOL;
export const DEFAULT_FRONTEND_PORT = APP_CONFIG.FRONTEND.DEFAULT_PORT;
export const DEFAULT_FRONTEND_HOST = APP_CONFIG.FRONTEND.DEFAULT_HOST;
export const DEFAULT_FRONTEND_PROTOCOL = APP_CONFIG.FRONTEND.DEFAULT_PROTOCOL;

/**
 * Export authentication constants
 */
export const JWT_EXPIRES_IN = APP_CONFIG.AUTH.JWT_EXPIRES_IN;
export const OTP_LENGTH = APP_CONFIG.AUTH.OTP_LENGTH;
export const OTP_EXPIRY_MINUTES = APP_CONFIG.AUTH.OTP_EXPIRY_MINUTES;

/**
 * Helper function to build API URL
 * This is useful for proxy routes and API clients
 */
export function buildApiUrl(path?: string): string {
  const baseUrl = APP_CONFIG.API_FULL_URL;
  if (!path) return baseUrl;

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Get the API base URL (without /api suffix)
 * This respects environment variables and provides consistent URL across the app
 */
export function getApiBaseUrl(): string {
  return APP_CONFIG.API_BASE_URL;
}

/**
 * Get the full API URL (with /api suffix)
 * This is the most commonly used configuration for API calls
 */
export function getApiFullUrl(): string {
  return APP_CONFIG.API_FULL_URL;
}

/**
 * Get the frontend URL
 */
export function getFrontendUrl(): string {
  return APP_CONFIG.FRONTEND_URL;
}


/**
 * Validate environment configuration
 */
export function validateConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if we're in browser or server environment
  const isBrowser = typeof window !== 'undefined';

  if (!isBrowser && typeof process !== 'undefined') {
    // Server-side validation
    if (!process.env.PORT && !process.env.API_PORT) {
      warnings.push('No PORT or API_PORT set, using default 3030');
    }

    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET is required in production');
    }

    if (process.env.NODE_ENV === 'production') {
      if (!process.env.DATABASE_URL) {
        errors.push('DATABASE_URL is required in production');
      }
    }
  } else if (isBrowser && typeof process !== 'undefined') {
    // Client-side validation
    if (!process.env.NEXT_PUBLIC_API_URL) {
      warnings.push('NEXT_PUBLIC_API_URL not set, using default');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Legacy exports for backward compatibility
 */
export const DEFAULT_API_URL = `${DEFAULT_API_PROTOCOL}://${DEFAULT_API_HOST}:${DEFAULT_API_PORT}/api`;