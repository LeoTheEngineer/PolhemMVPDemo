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
  const status = order.status;

  return (
    <div
      onClick={() => onClick?.(order)}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:scale-105',
        'bg-zinc-700/50 border-zinc-600/50 hover:bg-zinc-600/50',
        className
      )}
    >
      <p className="text-lg font-bold text-white">
        {formatNumber(order.quantity || order.predicted_quantity)}
      </p>
      
      {status && (
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  );
}
