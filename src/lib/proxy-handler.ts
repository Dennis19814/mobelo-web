import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import FormDataNode from 'form-data';
import { getApiBaseUrl } from '@/lib/api-config';

// Default API URL for proxying to backend
// Use shared config to ensure consistency (defaults to port 3000)
const API_URL = getApiBaseUrl();
const DEBUG_PROXY = process.env.NEXT_PUBLIC_DEBUG_PROXY === 'true';

interface ProxyOptions {
  basePath?: string;
}

/**
 * Shared proxy handler for all API routes
 * Centralizes common logic for proxying requests to the backend API
 */
export async function handleProxyRequest(
  req: NextRequest,
  params: { path: string[] },
  method: string,
  options: ProxyOptions = {}
) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { basePath = '' } = options;
    const path = params.path.join('/');
    const url = new URL(req.url);
    const queryString = url.search;

    if (DEBUG_PROXY) {
      console.log(`\n========== [PROXY REQUEST ${requestId}] START ==========`);
      console.log(`[${requestId}] Method: ${method}`);
      console.log(`[${requestId}] Original URL: ${req.url}`);
      console.log(`[${requestId}] Path params:`, params.path);
      console.log(`[${requestId}] BasePath option: "${basePath}"`);
      console.log(`[${requestId}] Query string: ${queryString}`);
    }

    // Extract auth headers
    const apiKey = req.headers.get('x-api-key');
    const appSecret = req.headers.get('x-app-secret');
    const authToken = req.headers.get('authorization');

    if (DEBUG_PROXY) {
      console.log(`[${requestId}] Auth Headers Check:`);
      console.log(`  - x-api-key: ${apiKey ? `${apiKey.substring(0, 15)}...` : 'MISSING'}`);
      console.log(`  - x-app-secret: ${appSecret ? `${appSecret.substring(0, 15)}...` : 'MISSING'}`);
      console.log(`  - authorization: ${authToken ? `${authToken.substring(0, 20)}...` : 'MISSING'}`);
    }

    // Debug logging for authentication headers
    logger.debug('[PROXY] Authentication Headers:', {
      hasApiKey: !!apiKey,
      hasAppSecret: !!appSecret,
      hasAuthToken: !!authToken,
      apiKeyPreview: apiKey?.substring(0, 15) + '...',
      appSecretPreview: appSecret?.substring(0, 15) + '...',
      path: params.path.join('/'),
      basePath,
      method
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (apiKey) headers['x-api-key'] = apiKey;
    if (appSecret) headers['x-app-secret'] = appSecret;
    if (authToken) headers['authorization'] = authToken;
    const sessionId = req.headers.get('x-session-id');
    if (sessionId) headers['x-session-id'] = sessionId;

    const fetchOptions: RequestInit = {
      method,
      headers
    };

    // Handle request body
    let formDataNode: FormDataNode | null = null;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentType = req.headers.get('content-type');
      if (DEBUG_PROXY) console.log(`[${requestId}] Request Content-Type: ${contentType}`);

      if (contentType?.includes('multipart/form-data')) {
        // Convert Next.js FormData to Node.js form-data
        const webFormData = await req.formData();
        formDataNode = new FormDataNode();

        let entriesCount = 0;
        for (const [key, value] of (webFormData as any).entries()) {
          entriesCount++;
          if (value instanceof File) {
            // Convert File to Buffer for form-data
            const buffer = Buffer.from(await value.arrayBuffer());
            formDataNode.append(key, buffer, {
              filename: value.name,
              contentType: value.type,
            });
            if (DEBUG_PROXY) console.log(`[${requestId}] Added file: ${key} = ${value.name} (${value.size} bytes)`);
          } else {
            // Regular form field
            formDataNode.append(key, value as string);
            if (DEBUG_PROXY) console.log(`[${requestId}] Added field: ${key} = ${value}`);
          }
        }
        console.log(`[${requestId}] Converted FormData with ${entriesCount} entries`);
      } else {
        const body = await req.text();
        if (body) {
          fetchOptions.body = body;
          if (DEBUG_PROXY) {
            console.log(`[${requestId}] Body size: ${body.length} bytes`);
            console.log(`[${requestId}] Body preview: ${body.substring(0, 200)}...`);
          }
        }
      }
    }

    // Construct backend URL
    const backendPath = basePath ? `${basePath}/${path}` : path;
    const backendUrl = `${API_URL}/${backendPath}${queryString}`;

    if (DEBUG_PROXY) {
      console.log(`[${requestId}] URL Construction:`);
      console.log(`  - API_URL: ${API_URL}`);
      console.log(`  - basePath: "${basePath}"`);
      console.log(`  - path: "${path}"`);
      console.log(`  - backendPath: "${backendPath}"`);
      console.log(`  - FINAL URL: ${backendUrl}`);
      console.log(`[${requestId}] 🔥 CRITICAL DEBUG - Method: ${method}, Full Backend URL: ${backendUrl}`);
      console.log(`[${requestId}] Making fetch request to backend...`);
    }

    /**
     * Dynamic timeout configuration based on endpoint complexity
     *
     * Timeouts:
     * - AI endpoints (getAppSpec): 180s - OpenAI API takes 40-60s, need buffer for slow responses
     * - Heavy write operations (products, coupons): 180s - Large payloads, image processing, bulk updates
     * - Standard endpoints: 60s - Normal CRUD operations
     *
     * CRITICAL: Proxy timeout must exceed backend operation time to prevent 504 Gateway Timeout errors.
     * The proxy acts as a gateway between frontend and backend, so if proxy times out before backend
     * completes, the frontend receives 504 even though backend is still processing.
     *
     * Examples:
     * - getAppSpec: OpenAI takes 40-60s → proxy timeout 180s (3x buffer for safety)
     * - Product create with images: S3 upload + DB write can take 30-60s → 180s timeout
     * - Simple GET: Usually < 1s → 60s timeout is sufficient
     */
    const isProductsPath = path.includes('products');
    const isWrite = method === 'PUT' || method === 'POST' || method === 'PATCH';
    const proxyTimeoutMs = path.includes('getAppSpec')
      ? 180000 // AI endpoint: OpenAI takes 40-60s, timeout at 180s for safety
      : (path.includes('coupons') && method === 'PATCH')
        ? 180000 // Bulk coupon updates
        : (isProductsPath && isWrite)
          ? 180000 // Product create/update with images
          : 60000; // Standard endpoints
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log(`[${requestId}] ⏱️  REQUEST TIMEOUT after ${proxyTimeoutMs} ms!`);
      controller.abort();
    }, proxyTimeoutMs);

    try {
      if (DEBUG_PROXY) {
        console.log(`[${requestId}] 🚀 Sending request to: ${backendUrl}`);
        console.log(`[${requestId}] Request options:`, {
          method: fetchOptions.method,
          headers: fetchOptions.headers,
          hasBody: !!fetchOptions.body || !!formDataNode,
          bodyType: formDataNode ? 'FormData (form-data)' : (fetchOptions.body ? 'string' : 'none')
        });
      }

      const fetchStart = Date.now();
      if (DEBUG_PROXY) {
        console.log(`[${requestId}] ⏰ Starting request at ${new Date(fetchStart).toISOString()}`);
        console.log(`[${requestId}] 🔧 Using ${formDataNode ? 'form-data library (multipart)' : 'Node.js http module'}`);
      }

      // Parse backend URL
      const parsedUrl = new URL(backendUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      // Prepare request body and headers
      let requestBody: string | FormDataNode | undefined;
      const requestHeaders: Record<string, string> = { ...headers };

      if (formDataNode) {
        // Using form-data library for multipart uploads
        requestBody = formDataNode;
        // Merge form-data headers (includes Content-Type with boundary)
        Object.assign(requestHeaders, formDataNode.getHeaders());
        if (DEBUG_PROXY) {
          console.log(`[${requestId}] 📝 Body: FormData multipart`);
          console.log(`[${requestId}] 📝 Content-Type: ${requestHeaders['Content-Type'] || requestHeaders['content-type']}`);
        }
      } else if (fetchOptions.body) {
        if (typeof fetchOptions.body === 'string') {
          requestBody = fetchOptions.body;
          requestHeaders['Content-Length'] = Buffer.byteLength(requestBody).toString();
          if (DEBUG_PROXY) {
            console.log(`[${requestId}] 📝 Body: ${requestBody.substring(0, 200)}...`);
            console.log(`[${requestId}] 📝 Content-Length: ${requestHeaders['Content-Length']}`);
          }
        } else {
          throw new Error('Unsupported body type');
        }
      } else {
        if (DEBUG_PROXY) console.log(`[${requestId}] 📝 No body`);
      }

      // Create http request
      const response = await new Promise<{ statusCode: number; statusMessage: string; headers: any; body: string }>((resolve, reject) => {
        const options = {
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname + parsedUrl.search,
          method: fetchOptions.method,
          headers: requestHeaders,
          timeout: proxyTimeoutMs
        };

        if (DEBUG_PROXY) {
          console.log(`[${requestId}] 🌐 HTTP Options:`, {
            hostname: options.hostname,
            port: options.port,
            path: options.path,
            method: options.method
          });
        }

        const req = httpModule.request(options, (res) => {
          if (DEBUG_PROXY) console.log(`[${requestId}] ✅ Got response: ${res.statusCode} ${res.statusMessage}`);

          const chunks: Buffer[] = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            const body = Buffer.concat(chunks).toString('utf-8');
            if (DEBUG_PROXY) console.log(`[${requestId}] 📦 Response body size: ${body.length} bytes`);

            resolve({
              statusCode: res.statusCode || 500,
              statusMessage: res.statusMessage || 'Unknown',
              headers: res.headers,
              body
            });
          });
        });

        req.on('error', (err) => {
          console.error(`[${requestId}] ❌ Request error:`, err);
          reject(err);
        });

        req.on('timeout', () => {
          console.error(`[${requestId}] ⏱️  Request timeout after ${proxyTimeoutMs} ms!`);
          req.destroy();
          reject(new Error('Request timeout'));
        });

        // Write body if present
        if (requestBody) {
          if (requestBody instanceof FormDataNode) {
            // Pipe FormData stream to request
            console.log(`[${requestId}] ✍️  Piping FormData stream...`);
            requestBody.pipe(req);
          } else if (typeof requestBody === 'string') {
            // Write string body
            console.log(`[${requestId}] ✍️  Writing request body...`);
            req.write(requestBody);
            req.end();
          }
        } else {
          req.end();
        }

        if (DEBUG_PROXY) console.log(`[${requestId}] 📤 Request sent`);
      });

      clearTimeout(timeoutId);
      const fetchDuration = Date.now() - fetchStart;
      if (DEBUG_PROXY) {
        console.log(`[${requestId}] 🎉 Request completed after ${fetchDuration}ms`);
        console.log(`[${requestId}] Response status: ${response.statusCode} ${response.statusMessage}`);
        console.log(`[${requestId}] Response preview: ${response.body.substring(0, 200)}...`);
      }

      const totalDuration = Date.now() - startTime;
      if (DEBUG_PROXY) console.log(`[${requestId}] ========== PROXY REQUEST END (${totalDuration}ms) ==========\n`);

      // Handle 204 No Content (some endpoints may return 204 without body)
      if (response.statusCode === 204) {
        // Normalize to 200 with a simple JSON payload to avoid Response constructor issues
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // If body is empty but status is success, still return a valid JSON payload
      const safeBody = response.body && response.body.length > 0 ? response.body : JSON.stringify({ ok: true });

      return new NextResponse(safeBody, {
        status: response.statusCode,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const totalDuration = Date.now() - startTime;

      console.error(`[${requestId}] ❌ HTTP ERROR after ${totalDuration}ms:`, fetchError);
      console.error(`[${requestId}] Error name: ${fetchError instanceof Error ? fetchError.name : 'unknown'}`);
      console.error(`[${requestId}] Error message: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);

      if (fetchError instanceof Error && fetchError.message === 'Request timeout') {
        console.error(`[${requestId}] 🚨 REQUEST TIMEOUT`);
        logger.error('Proxy request timeout', { url: backendUrl, timeout: proxyTimeoutMs, requestId });
        return NextResponse.json(
          {
            error: 'Request timeout',
            details: `The backend request took too long to respond (timeout: ${proxyTimeoutMs}ms)`,
            url: backendUrl,
            requestId
          },
          { status: 504 }
        );
      }

      throw fetchError;
    }
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    console.error(`[${requestId}] ❌ PROXY ERROR after ${totalDuration}ms:`, error);
    console.error(`[${requestId}] Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`[${requestId}] Error message: ${error instanceof Error ? error.message : String(error)}`);
    console.error(`[${requestId}] Stack trace:`, error instanceof Error ? error.stack : 'N/A');

    logger.error('Proxy request failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      duration: totalDuration
    });
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    );
  }
}

/**
 * Standard OPTIONS handler for CORS
 */
export function handleOptions() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, Authorization, x-api-key, x-app-secret, x-session-id, x-app-environment, x-app-id'
    }
  });
}
