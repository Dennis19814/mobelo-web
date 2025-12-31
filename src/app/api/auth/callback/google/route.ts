import { NextRequest } from 'next/server'
import { getApiFullUrl } from '@/lib/api-config'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code') || ''
  const state = searchParams.get('state') || ''

  const apiUrl = getApiFullUrl()
  let html = ''

  try {
    // CRITICAL: Must use HTTPS and the public domain, not localhost
    // Next.js behind nginx proxy might have req.nextUrl.origin as http://localhost:5173
    // But Google OAuth requires the exact same redirect_uri used in the initial request
    const redirectUri = `https://mobelo.dev${req.nextUrl.pathname}`

    console.log('[Google OAuth Callback] Debug info:', {
      requestOrigin: req.nextUrl.origin,
      requestPathname: req.nextUrl.pathname,
      constructedRedirectUri: redirectUri,
      codeLength: code?.length || 0,
    })

    const res = await fetch(`${apiUrl}/v1/platform/auth/social/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', code, redirect_uri: redirectUri, state }),
    })

    if (!res.ok) {
      const err = await res.text()
      html = renderResultHtml({ ok: false, error: `exchange_failed:${res.status}:${err}` })
    } else {
      const data = await res.json()
      html = renderResultHtml({ ok: true, data })
    }
  } catch (e: any) {
    html = renderResultHtml({ ok: false, error: e?.message || 'unknown_error' })
  }

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function renderResultHtml(payload: any) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Auth Callback</title></head>
<body>
<script>
  (function(){
    try {
      var data = ${JSON.stringify(payload)};
      if (window.opener && window.opener.postMessage) {
        window.opener.postMessage(data, window.location.origin);
      }
    } catch (e) {}
    window.close();
  })();
  </script>
</body></html>`
}
