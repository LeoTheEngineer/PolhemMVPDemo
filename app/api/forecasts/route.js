import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.FORECASTS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const productId = searchParams.get('product_id');

    const supabase = createServerClient();
    let query = supabase
      .from('product_forecasts')
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .order('forecast_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/forecasts error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
