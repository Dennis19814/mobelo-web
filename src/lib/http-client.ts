/**
 * Unified HTTP Client with Interceptors
 * Replaces complex dual-proxy system with standardized request/response handling
 */

import { logger } from '@/lib/logger';

export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  useProxy?: boolean;
  // Optional cancel key to abort in-flight duplicate requests
  cancelKey?: string;
  // Optional external AbortSignal for request cancellation (e.g., on component unmount)
  signal?: AbortSignal;
}

export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  statusText: string;
  data: T;
  headers: Headers;
}

export interface HttpInterceptor {
  request?: (config: HttpRequestConfig) => HttpRequestConfig | Promise<HttpRequestConfig>;
  response?: (response: HttpResponse) => HttpResponse | Promise<HttpResponse>;
  error?: (error: any) => any | Promise<any>;
}

class HttpClient {
  private baseUrl: string;
  private proxyBasePath = '/api/proxy';
  private interceptors: HttpInterceptor[] = [];
  private defaultTimeout = 60000; // Increased to 60s to handle AI operations
  // Track in-flight requests by cancelKey
  private inflight: Map<string, AbortController> = new Map();

  constructor() {
    try {
      const { getApiFullUrl } = require('@mobile-app-designer/shared-types');
      this.baseUrl = getApiFullUrl();
    } catch (error) {
      // Fallback aligned with backend default port (3000)
      this.baseUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api`;
    }

    logger.info('HTTP Client initialized', { baseUrl: this.baseUrl });
  }

  addInterceptor(interceptor: HttpInterceptor): void {
    this.interceptors.push(interceptor);
  }

  private async applyRequestInterceptors(config: HttpRequestConfig): Promise<HttpRequestConfig> {
    let finalConfig = { ...config };

    for (const interceptor of this.interceptors) {
      if (interceptor.request) {
        finalConfig = await interceptor.request(finalConfig);
      }
    }

    return finalConfig;
  }

  private async applyResponseInterceptors(response: HttpResponse): Promise<HttpResponse> {
    let finalResponse = response;

    for (const interceptor of this.interceptors) {
      if (interceptor.response) {
        finalResponse = await interceptor.response(finalResponse);
      }
    }

    return finalResponse;
  }

  private async applyErrorInterceptors(error: any): Promise<any> {
    let finalError = error;

    for (const interceptor of this.interceptors) {
      if (interceptor.error) {
        finalError = await interceptor.error(finalError);
      }
    }

    return finalError;
  }

  async request<T = any>(config: HttpRequestConfig): Promise<HttpResponse<T>> {
    const DEBUG_HTTP = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_DEBUG_HTTP === 'true') : false;
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (DEBUG_HTTP) {
      console.log(`[HTTP-${requestId}] Starting request:`, {
        method: config.method,
        url: config.url,
        timestamp: new Date().toISOString()
      });
    }

    // Ensure processedConfig and didTimeout are visible in catch for cleanup
    let processedConfig: HttpRequestConfig = config;
    let didTimeout = false;
    try {
      // Apply request interceptors
      if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] Applying interceptors...`);
      processedConfig = await this.applyRequestInterceptors(config);

      // Determine URL - use proxy only in development or when explicitly requested
      const shouldUseProxy = processedConfig.useProxy !== false &&
        (process.env.NODE_ENV === 'development' ||
         process.env.NEXT_PUBLIC_DISABLE_DIRECT_API_IN_DEV === 'true');

      const finalUrl = shouldUseProxy
        ? `${this.proxyBasePath}${processedConfig.url}`
        : `${this.baseUrl}${processedConfig.url}`;

      if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] Final URL:`, finalUrl);

      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...processedConfig.headers,
      };

      // Remove Content-Type for FormData
      if (processedConfig.body instanceof FormData) {
        delete headers['Content-Type'];
      }

      // Prepare body
      const body = processedConfig.body instanceof FormData
        ? processedConfig.body
        : processedConfig.body ? JSON.stringify(processedConfig.body) : undefined;

      if (DEBUG_HTTP) {
        console.log(`[HTTP-${requestId}] Headers:`, {
          ...headers,
          Authorization: headers.Authorization ? 'Bearer [REDACTED]' : undefined
        });
      }

      // Setup abort controller with optional external signal or cancelKey tracking
      const controller = new AbortController();
      let effectiveSignal: AbortSignal = controller.signal;

      // If external signal provided, merge it with our internal controller
      if (processedConfig.signal) {
        // If external signal is already aborted, abort our controller immediately
        if (processedConfig.signal.aborted) {
          controller.abort();
        } else {
          // Listen to external signal and forward abort to our controller
          processedConfig.signal.addEventListener('abort', () => {
            controller.abort();
          });
        }
      }

      // Handle cancelKey for duplicate request cancellation
      if (processedConfig.cancelKey) {
        const prev = this.inflight.get(processedConfig.cancelKey);
        if (prev) {
          try { prev.abort(); } catch { /* noop */ }
        }
        this.inflight.set(processedConfig.cancelKey, controller);
      }

      const timeout = processedConfig.timeout || this.defaultTimeout;
      if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] Setting timeout:`, timeout, 'ms');

      const timeoutId = setTimeout(() => {
        didTimeout = true;
        console.error(`[HTTP-${requestId}] ⏰ TIMEOUT - Aborting request after ${timeout}ms`);
        try { (controller as any).abort('timeout'); } catch { controller.abort(); }
      }, timeout);

      // Add abort event listener
      controller.signal.addEventListener('abort', () => {
        if (DEBUG_HTTP) {
          console.error(`[HTTP-${requestId}] 🛑 ABORT SIGNAL RECEIVED`, {
            reason: controller.signal.reason,
            timestamp: new Date().toISOString()
          });
        }
      });

      logger.apiRequest(processedConfig.method, finalUrl, {
        hasBody: !!body,
        isFormData: body instanceof FormData,
      });

      // Check if already aborted before making request
      if (controller.signal.aborted) {
        if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] Request already aborted, skipping fetch`);
        const cancelledError: any = new Error('Request was cancelled');
        cancelledError.code = 'REQUEST_CANCELLED';
        cancelledError.name = 'AbortError';
        throw cancelledError;
      }

      if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] Sending fetch request...`);

      // Make request with AbortError handling
      let response: Response;
      try {
        response = await fetch(finalUrl, {
          method: processedConfig.method,
          headers,
          body,
          signal: controller.signal,
        });
      } catch (fetchError) {
        // If fetch throws AbortError, handle it immediately to prevent unhandled exception
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          clearTimeout(timeoutId);
          if (processedConfig.cancelKey) {
            this.inflight.delete(processedConfig.cancelKey);
          }
          if (didTimeout) {
            const timeoutError: any = new Error(`Request timeout after ${processedConfig.timeout || this.defaultTimeout}ms`);
            timeoutError.code = 'REQUEST_TIMEOUT';
            throw await this.applyErrorInterceptors(timeoutError);
          } else {
            if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] Request cancelled (normal in dev mode)`);
            const cancelledError: any = new Error('Request was cancelled');
            cancelledError.code = 'REQUEST_CANCELLED';
            cancelledError.name = 'AbortError';
            throw cancelledError;
          }
        }
        // Re-throw non-AbortError exceptions
        throw fetchError;
      }

      if (DEBUG_HTTP) {
        console.log(`[HTTP-${requestId}] ✅ Response received:`, {
          status: response.status,
          statusText: response.statusText
        });
      }

      clearTimeout(timeoutId);

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: T;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = (await response.text()) as any;
      }

      const httpResponse: HttpResponse<T> = {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers: response.headers,
      };

      logger.apiResponse(processedConfig.method, finalUrl, response.status);

      // Apply response interceptors FIRST (so unauthorizedInterceptor can handle 401)
      const interceptedResponse = await this.applyResponseInterceptors(httpResponse);

      if (!response.ok) {
        // Special-case 403: return response without throwing so callers can show permission UX
        if (response.status === 403) {
          if (processedConfig.cancelKey) {
            const current = this.inflight.get(processedConfig.cancelKey);
            if (current === controller) this.inflight.delete(processedConfig.cancelKey);
          }
          if (DEBUG_HTTP) console.warn(`[HTTP-${requestId}] 403 Forbidden - returning response for UI handling`);
          return interceptedResponse;
        }

        const error = new Error(
          typeof data === 'object' && data && 'message' in data
            ? (data as any).message
            : `HTTP ${response.status}: ${response.statusText}`
        );
        // Attach metadata for downstream handlers
        (error as any).status = response.status;
        (error as any).url = finalUrl;
        (error as any).data = data;
        throw await this.applyErrorInterceptors(error);
      }

      if (processedConfig.cancelKey) {
        const current = this.inflight.get(processedConfig.cancelKey);
        if (current === controller) this.inflight.delete(processedConfig.cancelKey);
      }
      if (DEBUG_HTTP) console.log(`[HTTP-${requestId}] ✅ Request completed successfully`);
      return interceptedResponse;

    } catch (error) {
      const isAbort = error instanceof Error && (error.name === 'AbortError' || error.message?.toLowerCase?.().includes('abort'));
      if (processedConfig.cancelKey) {
        const current = this.inflight.get(processedConfig.cancelKey);
        if (current) this.inflight.delete(processedConfig.cancelKey);
      }
      if (DEBUG_HTTP && !isAbort) {
        console.error(`[HTTP-${requestId}] ❌ Request failed:`, {
          errorName: error instanceof Error ? error.name : 'Unknown',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
      }

      if (error instanceof Error && error.name === 'AbortError') {
        if (didTimeout) {
          console.error(`[HTTP-${requestId}] 🚨 ABORTERROR (TIMEOUT)`);
          const timeoutError: any = new Error(`Request timeout after ${config.timeout || this.defaultTimeout}ms`);
          timeoutError.code = 'REQUEST_TIMEOUT';
          throw await this.applyErrorInterceptors(timeoutError);
        } else {
          // Intentional cancellation - don't log to console (normal during React Strict Mode)
          if (DEBUG_HTTP) {
            console.log(`[HTTP-${requestId}] Request cancelled (normal in dev mode)`);
          }
          const cancelledError: any = new Error('Request was cancelled');
          cancelledError.code = 'REQUEST_CANCELLED';
          throw await this.applyErrorInterceptors(cancelledError);
        }
      }

      if (!isAbort) logger.apiError(config.method, config.url, error);
      throw await this.applyErrorInterceptors(error);
    }
  }

  // Convenience methods
  async get<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T = any>(url: string, body?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url, body, ...config });
  }

  async put<T = any>(url: string, body?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url, body, ...config });
  }

  async patch<T = any>(url: string, body?: any, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PATCH', url, body, ...config });
  }

  async delete<T = any>(url: string, config?: Partial<HttpRequestConfig>): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }
}

// Helper function to validate JWT token format
function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') return false;

  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  // Each part should be non-empty base64url string
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  return parts.every(part => part.length > 0 && base64urlRegex.test(part));
}

// Auth interceptor for automatic token management
// Handles both platform user tokens and staff tokens
export const authInterceptor: HttpInterceptor = {
  request: async (config) => {
    // Check if this is a staff authentication request (no token needed)
    if (config.url.includes('/staff-auth/')) {
      return config;
    }

    // Read tokens
    let staffAccessToken = localStorage.getItem('staff_access_token');
    let platformAccessToken = localStorage.getItem('access_token');

    // Validate token formats and clear if malformed
    if (staffAccessToken && !isValidJWTFormat(staffAccessToken)) {
      console.warn('[authInterceptor] Malformed staff token detected, clearing...');
      localStorage.removeItem('staff_access_token');
      localStorage.removeItem('staff_refresh_token');
      localStorage.removeItem('staff_user');
      staffAccessToken = null;
    }

    if (platformAccessToken && !isValidJWTFormat(platformAccessToken)) {
      console.warn('[authInterceptor] Malformed platform token detected, clearing...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      platformAccessToken = null;

      // Redirect to home page if on protected route
      if (typeof window !== 'undefined' && !config.url.includes('/auth/')) {
        console.log('[authInterceptor] Redirecting to home due to invalid token');
        window.location.href = '/';
      }
    }

    // Token routing by API namespace:
    // - Platform endpoints (/v1/platform/...) must use owner platform token
    // - Merchant endpoints (/v1/merchant/...) prefer staff token, fall back to platform token
    // - Public endpoints (/v1/public/...) do not require token
    let accessToken: string | null = null;
    if (config.url.startsWith('/v1/platform/')) {
      accessToken = platformAccessToken || null;
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_HTTP === 'true') {
        console.log('[authInterceptor] Using platform token for', config.url, { hasPlatform: !!platformAccessToken });
      }
    } else if (config.url.startsWith('/v1/merchant/')) {
      accessToken = staffAccessToken || platformAccessToken || null;
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_DEBUG_HTTP === 'true') {
        console.log('[authInterceptor] Using', staffAccessToken ? 'staff' : (platformAccessToken ? 'platform' : 'no'), 'token for', config.url);
      }
    } else {
      // Default behavior for other routes
      accessToken = staffAccessToken || platformAccessToken || null;
    }

    if (accessToken && !config.headers?.['Authorization']) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${accessToken}`,
      };
    }

    return config;
  },
};

// API key interceptor for dual-key authentication
export const apiKeyInterceptor: HttpInterceptor = {
  request: async (config) => {
    // Only attach dual-key headers for merchant endpoints
    if (!config.url.startsWith('/v1/merchant/')) {
      return config;
    }

    // Check both 'userApiKey' and 'apiKey' for backward compatibility
    const apiKey = localStorage.getItem('userApiKey') || localStorage.getItem('apiKey');
    const appSecretKey = localStorage.getItem('appSecretKey');

    if (apiKey && !config.headers?.['x-api-key']) {
      config.headers = {
        ...config.headers,
        'x-api-key': apiKey,
      };
    }

    if (appSecretKey && !config.headers?.['x-app-secret']) {
      config.headers = {
        ...config.headers,
        'x-app-secret': appSecretKey,
      };
    }

    return config;
  },
};

// CORS headers interceptor
export const corsInterceptor: HttpInterceptor = {
  response: async (response) => {
    // Response is already processed by server, just pass through
    return response;
  },
};

// Global 401 handler - automatically refresh token or sign out user
// Note: This will be called AFTER a 401 response is received
// The actual retry logic is handled by httpClient.request()
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.map(cb => cb(token));
  refreshSubscribers = [];
}

export const unauthorizedInterceptor: HttpInterceptor = {
  error: async (error) => {
    // Only handle 401 errors
    if (error?.status !== 401) {
      return error;
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return error;
    }

    const originalRequest = error.config;

    // Don't retry auth endpoints
    if (originalRequest?.url?.includes('/auth/') || originalRequest?.url?.includes('/staff-auth/')) {
      logger.warn('401 on auth endpoint - clearing tokens and redirecting');
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('staff_access_token');
      localStorage.removeItem('staff_refresh_token');
      localStorage.removeItem('staff_user');
      window.location.href = '/';
      return error;
    }

    // Try to refresh token
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      logger.warn('401 Unauthorized - No refresh token available, signing out user');
      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('staff_access_token');
      localStorage.removeItem('staff_refresh_token');
      localStorage.removeItem('staff_user');
      window.location.href = '/';
      return error;
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        subscribeTokenRefresh((token: string) => {
          // Token refreshed, resolve with error (caller will retry)
          resolve(error);
        });
      });
    }

    isRefreshing = true;

    try {
      logger.info('Attempting to refresh access token...');

      // Call refresh endpoint directly (bypass interceptors to avoid infinite loop)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1/platform/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.accessToken || data.access_token;
        const newRefreshToken = data.refreshToken || data.refresh_token;

        if (newAccessToken) {
          logger.info('Token refresh successful');
          // Update tokens in localStorage
          localStorage.setItem('access_token', newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem('refresh_token', newRefreshToken);
          }

          // Notify all subscribers
          onRefreshed(newAccessToken);
          isRefreshing = false;

          // Return error - caller should retry the original request
          return error;
        }
      }

      // Refresh failed
      throw new Error('Token refresh failed');

    } catch (refreshError) {
      logger.error('Token refresh failed:', { error: refreshError });
      isRefreshing = false;
      refreshSubscribers = [];

      // Clear all auth data
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('staff_access_token');
      localStorage.removeItem('staff_refresh_token');
      localStorage.removeItem('staff_user');

      // Redirect to home page
      window.location.href = '/';
      return error;
    }
  },
};

// Create singleton instance with default interceptors
const httpClient = new HttpClient();
httpClient.addInterceptor(authInterceptor);
httpClient.addInterceptor(apiKeyInterceptor);
httpClient.addInterceptor(unauthorizedInterceptor);
httpClient.addInterceptor(corsInterceptor);

export { httpClient };
export default httpClient;
