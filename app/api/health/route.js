import { NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 120 requests per minute (for monitoring)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.HEALTH_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
    { headers: rateLimitResult.headers }
  );
}
