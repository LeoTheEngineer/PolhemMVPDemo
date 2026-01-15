'use client';

import { cn } from '@/lib/utils';
import { formatNumber, formatDateLocale } from '@/lib/utils';
import StatusBadge from '@/components/shared/StatusBadge';

export default function OrderCard({
  order,
  type = 'real', // 'real' or 'predicted'
  onClick,
  className,
}) {
  const isReal = type === 'real';
  const isReliable = type === 'predicted' ? order.confidence_score >= 0.75 : true;
  // Only real orders and reliable predictions have status
  // Unreliable predictions have status = null
  const status = order.status;

  // Card colors based on order TYPE (not status)
  // Green = Real orders, Yellow = Predicted, Red = Unreliable predicted
  const getCardStyle = () => {
    if (isReal) {
      return 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30';
    }
    return isReliable
      ? 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30'
      : 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30';
  };

  return (
    <div
      onClick={() => onClick?.(order)}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 relative',
        getCardStyle(),
        className
      )}
    >
      {/* "P" marker for predicted orders - top right corner */}
      {!isReal && (
        <div
          className={cn(
            'absolute top-2 right-2 w-5 h-5 rounded text-xs font-bold flex items-center justify-center',
            isReliable
              ? 'bg-yellow-500/40 text-yellow-300'
              : 'bg-red-500/40 text-red-300'
          )}
        >
          P
        </div>
      )}

      <p className="text-lg font-bold text-white">
        {formatNumber(order.quantity || order.predicted_quantity)}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {formatDateLocale(order.due_date || order.predicted_date)}
      </p>

      {/* Status badge for real orders and reliable predictions only */}
      {/* Unreliable predictions don't show status - they're for visual reference only */}
      {status && (
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  );
}
