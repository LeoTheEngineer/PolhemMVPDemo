import { createServerClient } from '@/lib/supabase';
import SettingsPageClient from './SettingsPageClient';

async function getSettingsData() {
  const supabase = createServerClient();
  
  const settingsResult = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'main')
    .single();

  return {
    settings: settingsResult.data,
  };
}

export default async function SettingsPage() {
  const data = await getSettingsData();
  return <SettingsPageClient {...data} />;
}
