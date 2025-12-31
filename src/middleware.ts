import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add security headers to prevent external script issues
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Block requests from known extension URLs
  const url = request.url.toLowerCase()
  const pathname = request.nextUrl.pathname.toLowerCase()
  
  const blockedPatterns = [
    'features.js',
    'webpack.js',
    'main.js',
    'react-refresh.js',
    '_app.js',
    '_error.js',
    'express-fte',
    'local-storage.js',
    'fte-utils.js',
    'frame_start.js',
    'frame_ant.js',
    'sidePanelUtil.js',
    'express-fte-utils.js',
    'content-script-utils.js',
    'embeddedpdftouchpointcontroller',
    'showonechild.js',
    'features:0',
    '.crx',
    '.xpi'
  ]
  
  // Check if the request URL or pathname contains any blocked patterns
  if (blockedPatterns.some(pattern => url.includes(pattern.toLowerCase()) || pathname.includes(pattern.toLowerCase()))) {
    // Return an empty 204 response for blocked resources
    return new NextResponse(null, { 
      status: 204,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Length': '0'
      }
    })
  }
  
  // Block requests from browser extension user agents
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
  if (userAgent.includes('extension') || userAgent.includes('chrome-extension')) {
    return new NextResponse(null, { status: 204 })
  }
  
  return response
}

// Apply middleware to all routes except static files and API routes
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}