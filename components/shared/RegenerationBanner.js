'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RegenerationBanner({ needsRegeneration }) {
  const router = useRouter();
  const [isDismissing, setIsDismissing] = useState(false);

  if (!needsRegeneration) return null;

  const handleClick = () => {
    // Start slide-up animation
    setIsDismissing(true);

    // Navigate after animation completes (300ms)
    setTimeout(() => {
      router.push('/schedule?regenerate=true');
    }, 300);
  };

  return (
    <div
      className={`fixed top-0 left-64 right-0 z-50 bg-accent/90 text-white px-4 py-3 flex items-center justify-between transition-transform duration-300 ease-in-out ${
        isDismissing ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5" />
        <span className="text-sm font-medium">
          Data has changed. A new production schedule is available.
        </span>
      </div>
      <button
        onClick={handleClick}
        disabled={isDismissing}
        className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors disabled:opacity-50"
      >
        Regenerate Schedule
      </button>
    </div>
  );
}
