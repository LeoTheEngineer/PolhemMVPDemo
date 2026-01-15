import { createServerClient } from '@/lib/supabase';
import OrdersPageClient from './OrdersPageClient';
import { calculateAllOrderStatuses } from '@/lib/utils';

async function getOrdersData() {
  const supabase = createServerClient();

  const [customersResult, productsResult, ordersResult, predictedResult, blocksResult] =
    await Promise.all([
      supabase.from('customers').select('id, name').order('name'),
      supabase
        .from('products')
        .select('id, name, sku, customer_id')
        .order('name'),
      supabase
        .from('orders')
        .select('*, customer:customers(id, name), product:products(id, name, sku)')
        .order('due_date'),
      supabase
        .from('predicted_orders')
        .select(
          '*, customer:customers(id, name), product:products(id, name, sku)'
        )
        .order('predicted_date'),
      supabase
        .from('production_blocks')
        .select('id, product_id, batch_size, start_time, end_time')
        .order('start_time'),
    ]);

  const orders = ordersResult.data || [];
  const predictedOrders = predictedResult.data || [];
  const productionBlocks = blocksResult.data || [];

  // Calculate real-time statuses based on production blocks
  const statusMap = calculateAllOrderStatuses(orders, predictedOrders, productionBlocks);

  // Find orders that need status updates in the database
  const orderUpdates = [];

  for (const order of orders) {
    const calculatedStatus = statusMap[order.id];
    if (calculatedStatus && calculatedStatus !== order.status) {
      orderUpdates.push({ id: order.id, status: calculatedStatus });
    }
  }

  // Batch update orders in database if any changed
  if (orderUpdates.length > 0) {
    await Promise.all(
      orderUpdates.map(({ id, status }) =>
        supabase.from('orders').update({ status }).eq('id', id)
      )
    );

    // Update local data to reflect changes
    for (const update of orderUpdates) {
      const order = orders.find(o => o.id === update.id);
      if (order) order.status = update.status;
    }
  }

  // Add calculated status to reliable predicted orders only
  // Unreliable predictions (confidence < 0.75) don't get a status - they're visual reference only
  const RELIABILITY_THRESHOLD = 0.75;
  const predictedOrdersWithStatus = predictedOrders.map(pred => ({
    ...pred,
    // Only reliable predictions get a status
    status: pred.confidence_score >= RELIABILITY_THRESHOLD 
      ? (statusMap[pred.id] || 'pending')
      : null,
  }));

  return {
    customers: customersResult.data || [],
    products: productsResult.data || [],
    orders,
    predictedOrders: predictedOrdersWithStatus,
  };
}

export default async function OrdersPage() {
  const data = await getOrdersData();

  return <OrdersPageClient {...data} />;
}
