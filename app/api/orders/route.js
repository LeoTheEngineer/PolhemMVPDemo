import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 120 requests per minute (high-traffic endpoint)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_GET);
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
    const status = searchParams.get('status');

    const supabase = createServerClient();
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku, cycle_time, cavity_count)
      `)
      .order('due_date', { ascending: true });

    if (customerId) query = query.eq('customer_id', customerId);
    if (productId) query = query.eq('product_id', productId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function POST(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_POST);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { customer_id, product_id, quantity, due_date, priority, notes } = body;

    // Validation
    if (!customer_id || !product_id || !quantity || !due_date) {
      return NextResponse.json(
        { error: { message: 'customer_id, product_id, quantity, and due_date are required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .insert({
        customer_id,
        product_id,
        quantity,
        due_date,
        priority: priority || 5,
        notes: notes || null,
        status: 'pending',
      })
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201, headers: rateLimitResult.headers });
  } catch (error) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 60 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_PUT);
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

    // Remove nested objects if present
    delete updates.customer;
    delete updates.product;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, name),
        product:products(id, name, sku)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function DELETE(request) {
  // Rate limit: 20 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.ORDERS_DELETE);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('DELETE /api/orders error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
