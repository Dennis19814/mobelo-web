import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')

    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      )
    }

    const response = await fetch(`${API_URL}/auth/api-keys`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization
      }
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    logger.error('Error fetching API keys:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    )
  }
}