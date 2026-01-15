import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.MACHINES_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('code');

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/machines error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.MACHINES_PUT);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('machines')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/machines error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
