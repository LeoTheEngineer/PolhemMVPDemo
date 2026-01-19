'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RegenerationBanner({ needsRegeneration }) {
  const router = useRouter();
  
  if (!needsRegeneration) return null;

  const handleClick = () => {
    router.push('/schedule?regenerate=true');
  };

  return (
    <div className="fixed top-0 left-64 right-0 z-50 bg-accent/90 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5" />
        <span className="text-sm font-medium">
          Data has changed. A new production schedule is available.
        </span>
      </div>
      <button
        onClick={handleClick}
        className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
      >
        Regenerate Schedule
      </button>
    </div>
  );
}
