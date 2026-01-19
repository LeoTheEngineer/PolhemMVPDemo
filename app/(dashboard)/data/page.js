import { createServerClient } from '@/lib/supabase';
import DataPageClient from './DataPageClient';

async function getDataPageData() {
  const supabase = createServerClient();

  const [materialsResult, machinesResult, productsResult, customersResult] =
    await Promise.all([
      supabase.from('materials').select('*').order('name'),
      supabase.from('machines').select('*').order('code'),
      supabase.from('products').select('*, customer:customers(id, name), material:materials(id, name)').order('name'),
      supabase.from('customers').select('*').order('name'),
    ]);

  return {
    materials: materialsResult.data || [],
    machines: machinesResult.data || [],
    products: productsResult.data || [],
    customers: customersResult.data || [],
  };
}

export default async function DataPage() {
  const data = await getDataPageData();
  return <DataPageClient {...data} />;
}
