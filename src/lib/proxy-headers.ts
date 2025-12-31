import { logger } from '@/lib/logger'
import { NextRequest } from 'next/server'
import { getAuthHeaders } from './auth-headers'

/**
 * Standardized header management for API proxy routes
 * Handles dual-key authentication headers with case-insensitive support
 */

/**
 * Gets header value case-insensitively from NextRequest
 * Supports both lowercase and uppercase header formats
 */
function getHeaderCaseInsensitive(request: NextRequest, headerName: string): string | null {
  // Try exact match first (most common case)
  const exactMatch = request.headers.get(headerName);
  if (exactMatch) {
    return exactMatch;
  }

  // Try common variations
  const variations = [
    headerName.toLowerCase(),
    headerName.toUpperCase(),
    toPascalCase(headerName)
  ];

  for (const variation of variations) {
    const value = request.headers.get(variation);
    if (value) {
      return value;
    }
  }

  return null;
}

/**
 * Convert kebab-case to PascalCase (e.g., x-api-key -> X-Api-Key)
 */
function toPascalCase(str: string): string {
  return str.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join('-');
}

/**
 * Builds complete headers for backend API calls
 * Combines auth headers with dual-key headers from request
 */
export async function buildProxyHeaders(request: NextRequest): Promise<Record<string, string>> {
  // Get base auth headers (JWT token)
  const headers = await getAuthHeaders();

  // Extract API keys from request headers (case-insensitive)
  const apiKey = getHeaderCaseInsensitive(request, 'x-api-key');
  const appSecretKey = getHeaderCaseInsensitive(request, 'x-app-secret');

  // Add API keys as lowercase headers (backend expects lowercase)
  if (apiKey) {
    headers['x-api-key'] = apiKey;
  }
  if (appSecretKey) {
    headers['x-app-secret'] = appSecretKey;
  }

  // Always include Content-Type for API calls
  headers['Content-Type'] = 'application/json';

  return headers;
}

/**
 * Logs header information for debugging (without exposing sensitive data)
 */
export function logHeaders(request: NextRequest, endpoint: string): void {
  const apiKey = getHeaderCaseInsensitive(request, 'x-api-key');
  const appSecretKey = getHeaderCaseInsensitive(request, 'x-app-secret');

  logger.debug(`Proxy ${endpoint} - Headers:`, {
    hasApiKey: !!apiKey,
    hasAppSecret: !!appSecretKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
    appSecretPrefix: appSecretKey ? appSecretKey.substring(0, 15) + '...' : 'none'
  });
}

/**
 * Validates that required headers are present
 */
export function validateRequiredHeaders(request: NextRequest): { valid: boolean; missing: string[] } {
  const apiKey = getHeaderCaseInsensitive(request, 'x-api-key');
  const appSecretKey = getHeaderCaseInsensitive(request, 'x-app-secret');

  const missing: string[] = [];

  if (!apiKey) {
    missing.push('x-api-key');
  }
  if (!appSecretKey) {
    missing.push('x-app-secret');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}