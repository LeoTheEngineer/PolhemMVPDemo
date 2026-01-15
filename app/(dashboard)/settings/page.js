import { createServerClient } from '@/lib/supabase';
import SettingsPageClient from './SettingsPageClient';

async function getSettingsData() {
  const supabase = createServerClient();

  const [materialsResult, machinesResult, productsResult, customersResult, predictedOrdersResult, settingsResult] =
    await Promise.all([
      supabase.from('materials').select('*').order('name'),
      supabase.from('machines').select('*').order('code'),
      supabase.from('products').select('*, customer:customers(id, name), material:materials(id, name)').order('name'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('predicted_orders').select('*, customer:customers(id, name), product:products(id, name, sku)').order('predicted_date'),
      supabase.from('settings').select('*').eq('id', 'main').single(),
    ]);

  return {
    materials: materialsResult.data || [],
    machines: machinesResult.data || [],
    products: productsResult.data || [],
    customers: customersResult.data || [],
    predictedOrders: predictedOrdersResult.data || [],
    settings: settingsResult.data,
  };
}

export default async function SettingsPage() {
  const data = await getSettingsData();
  return <SettingsPageClient {...data} />;
}
