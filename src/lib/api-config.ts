/**
 * API Configuration for Proxy Routes
 *
 * This file provides centralized API URL configuration for all proxy routes.
 * It uses the shared configuration from the shared-types package to ensure
 * consistency across the entire application.
 */

import { getApiBaseUrl as getSharedApiBaseUrl, getApiFullUrl as getSharedApiFullUrl } from '@mobile-app-designer/shared-types';

/**
 * Get the base URL for the API (without /api suffix)
 * This uses the centralized configuration from shared-types package
 * and respects the NEXT_PUBLIC_API_URL environment variable if set.
 *
 * @returns The base API URL (e.g., "http://localhost:3030")
 */
export const getApiBaseUrl = (): string => {
  return getSharedApiBaseUrl();
};

/**
 * Get the full API URL (with /api suffix)
 * This is the most commonly used configuration for proxy routes.
 *
 * @returns The full API URL (e.g., "http://localhost:3030/api")
 */
export const getApiFullUrl = (): string => {
  return getSharedApiFullUrl();
};

/**
 * Build a complete API URL with a specific path
 *
 * @param path - The API path to append (e.g., "/products")
 * @returns The complete API URL with path
 */
export const buildApiUrl = (path?: string): string => {
  const fullUrl = getApiFullUrl();
  if (!path) return fullUrl;

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${fullUrl}${normalizedPath}`;
};

/**
 * Constants for commonly used API URLs
 * These are exported for convenience and backward compatibility
 */
export const API_BASE_URL = getApiBaseUrl();
export const API_FULL_URL = getApiFullUrl();