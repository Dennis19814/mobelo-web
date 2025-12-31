import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Proxy route for merchant inventory endpoints
// Handles: /api/proxy/merchant/inventory/*
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${API_URL}/v1/merchant/inventory/${path}${searchParams ? `?${searchParams}` : ''}`;

    // Forward headers from the request
    const headers: Record<string, string> = {};

    // Copy authentication headers
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const appSecret = request.headers.get('x-app-secret');
    if (appSecret) {
      headers['x-app-secret'] = appSecret;
    }

    const appId = request.headers.get('x-app-id');
    if (appId) {
      headers['x-app-id'] = appId;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Inventory proxy GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const url = `${API_URL}/v1/merchant/inventory/${path}`;
    const body = await request.json();

    // Forward headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const appSecret = request.headers.get('x-app-secret');
    if (appSecret) {
      headers['x-app-secret'] = appSecret;
    }

    const appId = request.headers.get('x-app-id');
    if (appId) {
      headers['x-app-id'] = appId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Inventory proxy POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory movement' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const path = params.path.join('/');
    const url = `${API_URL}/v1/merchant/inventory/${path}`;
    const body = await request.json();

    // Forward headers from the request
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    const appSecret = request.headers.get('x-app-secret');
    if (appSecret) {
      headers['x-app-secret'] = appSecret;
    }

    const appId = request.headers.get('x-app-id');
    if (appId) {
      headers['x-app-id'] = appId;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Inventory proxy PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
