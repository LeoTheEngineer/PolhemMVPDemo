'use client';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import StatusBadge from '@/components/shared/StatusBadge';

export default function OrderCard({
  order,
  type = 'real',
  onClick,
  className,
}) {
  const isReal = type === 'real';
  const status = order.status;

  return (
    <div
      onClick={() => onClick?.(order)}
      className={cn(
        'p-2 rounded border cursor-pointer transition-all hover:scale-105 relative',
        'bg-zinc-700/50 border-zinc-600/50 hover:bg-zinc-600/50',
        className
      )}
    >
      {/* "P" marker for predicted orders - top right corner */}
      {!isReal && (
        <div className="absolute top-1 right-1 w-4 h-4 rounded text-[10px] font-bold flex items-center justify-center bg-zinc-500/40 text-zinc-300">
          P
        </div>
      )}

      <p className="text-base font-bold text-white leading-tight">
        {formatNumber(order.quantity || order.predicted_quantity)}
      </p>
      
      {status && (
        <div className="mt-1">
          <StatusBadge status={status} size="small" />
        </div>
      )}
    </div>
  );
}
