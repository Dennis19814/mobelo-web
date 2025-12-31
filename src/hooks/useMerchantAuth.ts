import { useMemo } from 'react';

/**
 * Custom hook for managing merchant authentication headers
 *
 * Centralizes API key and app secret header construction to eliminate duplication
 * across merchant panel sections. Headers are automatically memoized for performance.
 *
 * @param apiKey - User API key for authentication
 * @param appSecretKey - App-specific secret key
 * @returns Memoized headers object with lowercase keys (x-api-key, x-app-secret)
 *
 * @example
 * const { headers, isReady } = useMerchantAuth(apiKey, appSecretKey);
 *
 * if (isReady) {
 *   const response = await fetch('/api/proxy/products', { headers });
 * }
 */
export function useMerchantAuth(apiKey?: string, appSecretKey?: string) {
  /**
   * Memoize headers to prevent unnecessary re-renders
   * Headers are only recreated when apiKey or appSecretKey changes
   *
   * CRITICAL: Uses lowercase headers (x-api-key, x-app-secret) to prevent
   * header duplication issues that cause 401 authentication errors
   */
  const headers = useMemo(() => {
    if (!apiKey || !appSecretKey) {
      return null;
    }

    return {
      'x-api-key': apiKey,
      'x-app-secret': appSecretKey
    };
  }, [apiKey, appSecretKey]);

  /**
   * Check if authentication is ready
   * Useful for conditional rendering and preventing premature API calls
   */
  const isReady = useMemo(() => {
    return !!(apiKey && appSecretKey);
  }, [apiKey, appSecretKey]);

  return {
    headers,
    isReady,
    apiKey,
    appSecretKey
  };
}
