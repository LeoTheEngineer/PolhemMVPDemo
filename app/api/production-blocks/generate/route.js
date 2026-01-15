import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { generateSchedule, calculateScheduleMetrics } from '@/models/schedule-generator';

export async function POST(request) {
  // Rate limit: 5 requests per minute (heavy computation)
  const rateLimitResult = withRateLimit(request, RATE_LIMITS.SCHEDULE_GENERATE);
  if (rateLimitResult.limited) {
    return NextResponse.json(
      { error: rateLimitResult.response.error },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();

    // 1. Get all pending orders and predicted orders
    const [ordersResult, predictedResult, machinesResult, productsResult, settingsResult] = await Promise.all([
      supabase.from('orders').select('*, product:products(*)').in('status', ['pending', 'scheduled']),
      supabase.from('predicted_orders').select('*, product:products(*)'),
      supabase.from('machines').select('*').eq('status', 'available'),
      supabase.from('products').select('*'),
      supabase.from('settings').select('*').eq('id', 'main').single(),
    ]);

    if (ordersResult.error) throw ordersResult.error;
    if (predictedResult.error) throw predictedResult.error;
    if (machinesResult.error) throw machinesResult.error;
    if (productsResult.error) throw productsResult.error;
    if (settingsResult.error) throw settingsResult.error;

    const orders = ordersResult.data || [];
    const predictedOrders = predictedResult.data || [];
    const machines = machinesResult.data || [];
    const products = productsResult.data || [];
    const settings = settingsResult.data;

    // 2. Delete existing production blocks
    const { error: deleteError } = await supabase
      .from('production_blocks')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all rows

    if (deleteError) throw deleteError;

    // 3. Generate new schedule
    const blocks = generateSchedule({
      orders,
      predictedOrders,
      machines,
      products,
      settings,
    });

    // 4. Insert new blocks
    if (blocks.length > 0) {
      const { error: insertError } = await supabase
        .from('production_blocks')
        .insert(blocks);

      if (insertError) throw insertError;
    }

    // 5. Calculate and update metrics
    const metrics = calculateScheduleMetrics(blocks, machines, settings);

    const { error: metricsError } = await supabase
      .from('settings')
      .update({
        schedule_metrics: {
          ...metrics,
          has_manual_edits: false,
          last_generated_at: new Date().toISOString(),
        },
      })
      .eq('id', 'main');

    if (metricsError) throw metricsError;

    // 6. Return the generated blocks with related data
    const { data: resultBlocks, error: fetchError } = await supabase
      .from('production_blocks')
      .select(`
        *,
        machine:machines(id, name, code),
        product:products(id, name, sku),
        customer:customers(id, name)
      `)
      .order('start_time', { ascending: true });

    if (fetchError) throw fetchError;

    return NextResponse.json(
      {
        data: resultBlocks,
        metrics,
        message: `Generated ${blocks.length} production blocks`,
      },
      { headers: rateLimitResult.headers }
    );
  } catch (error) {
    console.error('POST /api/production-blocks/generate error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500, headers: rateLimitResult.headers }
    );
  }
}
