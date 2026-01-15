import { createServerClient } from '@/lib/supabase';
import SchedulePageClient from './SchedulePageClient';

async function getScheduleData() {
  const supabase = createServerClient();

  const [machinesResult, blocksResult, settingsResult] = await Promise.all([
    supabase.from('machines').select('*').eq('status', 'available').order('code'),
    supabase
      .from('production_blocks')
      .select('*, machine:machines(*), product:products(*), customer:customers(*)')
      .order('start_time'),
    supabase.from('settings').select('*').eq('id', 'main').single(),
  ]);

  return {
    machines: machinesResult.data || [],
    blocks: blocksResult.data || [],
    settings: settingsResult.data,
  };
}

export default async function SchedulePage() {
  const data = await getScheduleData();
  return <SchedulePageClient {...data} />;
}
