import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple proxy route from the Next.js app to the Nest API
 * so the test page can call a relative /api URL.
 *
 * Expects POST body:
 * {
 *   appId: number,
 *   appName: string,
 *   industry?: string,
 *   demographic?: string,
 *   productOrNiche?: string,
 *   style?: string,
 *   language?: string,
 *   tone?: string
 * }
 */

export async function POST(req: NextRequest) {
  const body = await req.json()

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'

  const res = await fetch(
    `${apiBase}/api/v1/admin/content-generation/jobs/test`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )

  const data = await res.json().catch(() => null)

  return NextResponse.json(
    data ?? { ok: false, message: 'Invalid JSON from API' },
    { status: res.status },
  )
}

