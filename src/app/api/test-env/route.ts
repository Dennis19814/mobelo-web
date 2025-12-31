import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_STRIPE_PUBLIC_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'NOT_FOUND',
    hasKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
  });
}
