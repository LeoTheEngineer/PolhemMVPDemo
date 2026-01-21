import { createServerClient } from '@/lib/supabase';
import SchedulePageClient from './SchedulePageClient';

/**
 * Natural sort for machine codes (e.g., M1, M2, M10, M11)
 * Extracts the numeric part and sorts by that number
 */
function naturalSortMachines(machines) {
  return [...machines].sort((a, b) => {
    // Extract numbers from machine codes (e.g., "M10" -> 10, "M2" -> 2)
    const numA = parseInt(a.code.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.code.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
}

async function getScheduleData() {
  const supabase = createServerClient();

  const [machinesResult, blocksResult, settingsResult, latestBlockResult] = await Promise.all([
    supabase.from('machines').select('*').eq('status', 'available'),
    supabase
      .from('production_blocks')
      .select('*, machine:machines(*), product:products(*), customer:customers(*)')
      .order('start_time'),
    supabase.from('settings').select('*').eq('id', 'main').single(),
    // Fetch the latest production block end_time for timeline calculation
    supabase.from('production_blocks').select('end_time').order('end_time', { ascending: false }).limit(1),
  ]);

  // Calculate the latest end date from production blocks
  const latestBlockEndTime = latestBlockResult.data?.[0]?.end_time || null;

  // Use the latest production block end_time for timeline end calculation
  let latestDueDate = latestBlockEndTime;

  // Sort machines by natural number order (M1, M2, M10, not M1, M10, M2)
  const sortedMachines = naturalSortMachines(machinesResult.data || []);

  return {
    machines: sortedMachines,
    blocks: blocksResult.data || [],
    settings: settingsResult.data,
    latestDueDate,
  };
}

export default async function SchedulePage() {
  const data = await getScheduleData();
  return <SchedulePageClient {...data} />;
}
