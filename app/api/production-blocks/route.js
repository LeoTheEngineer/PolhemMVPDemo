import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request) {
  // Rate limit: 120 requests per minute (high-traffic for Gantt chart)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTION_BLOCKS_GET);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machine_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    const supabase = createServerClient();
    let query = supabase
      .from('production_blocks')
      .select(`
        *,
        machine:machines(id, name, code, hourly_rate),
        product:products(id, name, sku, cycle_time, cavity_count),
        customer:customers(id, name)
      `)
      .order('start_time', { ascending: true });

    if (machineId) query = query.eq('machine_id', machineId);
    if (startDate) query = query.gte('start_time', startDate);
    if (endDate) query = query.lte('end_time', endDate);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('GET /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function POST(request) {
  // Rate limit: 30 requests per minute
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTION_BLOCKS_POST);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const body = await request.json();
    const { machine_id, product_id, customer_id, batch_size, start_time, end_time, setup_time_minutes } = body;

    // Validation
    if (!machine_id || !product_id || !customer_id || !batch_size || !start_time || !end_time) {
      return NextResponse.json(
        { error: { message: 'machine_id, product_id, customer_id, batch_size, start_time, and end_time are required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('production_blocks')
      .insert({
        machine_id,
        product_id,
        customer_id,
        batch_size,
        start_time,
        end_time,
        setup_time_minutes: setup_time_minutes || 0,
      })
      .select(`
        *,
        machine:machines(id, name, code),
        product:products(id, name, sku),
        customer:customers(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201, headers: rateLimitResult.headers });
  } catch (error) {
    console.error('POST /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function PUT(request) {
  // Rate limit: 60 requests per minute (for drag-drop operations)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.PRODUCTION_BLOCKS_PUT);
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
    delete updates.machine;
    delete updates.product;
    delete updates.customer;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('production_blocks')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        machine:machines(id, name, code),
        product:products(id, name, sku),
        customer:customers(id, name)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('PUT /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const deleteAll = searchParams.get('all');

  // Different rate limits for single delete vs bulk delete
  const rateLimit = deleteAll === 'true' 
    ? RATE_LIMITS.PRODUCTION_BLOCKS_DELETE_ALL  // 2 requests per hour (dangerous)
    : RATE_LIMITS.PRODUCTION_BLOCKS_DELETE;     // 20 requests per minute

  const rateLimitResult = withRateLimit(request, rateLimit);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();

    if (deleteAll === 'true') {
      // Delete all production blocks (very restrictive: 2/hour)
      const { error } = await supabase
        .from('production_blocks')
        .delete()
        .gte('created_at', '1970-01-01'); // Delete all rows

      if (error) throw error;

      return NextResponse.json(
        { success: true, message: 'All blocks deleted' },
        { headers: rateLimitResult.headers }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: { message: 'ID is required' } },
        { status: 400, headers: rateLimitResult.headers }
      );
    }

    const { error } = await supabase
      .from('production_blocks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { headers: rateLimitResult.headers });
  } catch (error) {
    console.error('DELETE /api/production-blocks error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
