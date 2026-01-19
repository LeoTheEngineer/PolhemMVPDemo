'use client';

import { useRouter } from 'next/navigation';
import ModelSettings from '@/components/settings/ModelSettings';

export default function SettingsPageClient({ settings }) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">
          Configure model parameters and system settings
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <ModelSettings settings={settings} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
