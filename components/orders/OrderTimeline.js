'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, getWeekNumber } from '@/lib/utils';
import OrderCard from './OrderCard';

export default function OrderTimeline({
  orders = [],
  predictedOrders = [],
  onOrderClick,
  onPredictionClick,
}) {
  // Group orders by week
  const weeklyData = useMemo(() => {
    const weeks = {};

    // Process real orders
    orders.forEach((order) => {
      const weekNum = getWeekNumber(order.due_date);
      const year = new Date(order.due_date).getFullYear();
      const key = `${year}-W${weekNum}`;

      if (!weeks[key]) {
        weeks[key] = {
          week: weekNum,
          year,
          key,
          orders: [],
          predictions: [],
        };
      }
      weeks[key].orders.push(order);
    });

    // Process predicted orders
    predictedOrders.forEach((pred) => {
      const weekNum = getWeekNumber(pred.predicted_date);
      const year = new Date(pred.predicted_date).getFullYear();
      const key = `${year}-W${weekNum}`;

      if (!weeks[key]) {
        weeks[key] = {
          week: weekNum,
          year,
          key,
          orders: [],
          predictions: [],
        };
      }
      weeks[key].predictions.push(pred);
    });

    // Sort by date
    return Object.values(weeks).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week - b.week;
    });
  }, [orders, predictedOrders]);

  if (weeklyData.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No orders to display. Select a customer and product to view timeline.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {weeklyData.map((week) => (
          <WeekColumn
            key={week.key}
            week={week}
            onOrderClick={onOrderClick}
            onPredictionClick={onPredictionClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 mt-6 pt-4 border-t border-zinc-800">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Order Type:</span>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
          <span className="text-sm text-zinc-400">Real Order</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50 relative">
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-yellow-400">P</span>
          </div>
          <span className="text-sm text-zinc-400">Predicted</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50 relative">
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-red-400">P</span>
          </div>
          <span className="text-sm text-zinc-400">Unreliable Prediction</span>
        </div>
      </div>
    </div>
  );
}

function WeekColumn({ week, onOrderClick, onPredictionClick }) {
  const totalOrders =
    week.orders.reduce((sum, o) => sum + o.quantity, 0) +
    week.predictions.reduce((sum, p) => sum + p.predicted_quantity, 0);

  return (
    <div className="flex flex-col min-w-[140px]">
      {/* Week header */}
      <div className="text-center pb-3 border-b border-zinc-800 mb-3">
        <p className="text-sm font-medium text-white">W{week.week}</p>
        <p className="text-xs text-zinc-500">{week.year}</p>
      </div>

      {/* Orders */}
      <div className="flex-1 space-y-2">
        {week.orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            type="real"
            onClick={() => onOrderClick?.(order)}
          />
        ))}

        {week.predictions.map((pred) => (
          <OrderCard
            key={pred.id}
            order={pred}
            type="predicted"
            onClick={() => onPredictionClick?.(pred)}
          />
        ))}
      </div>

      {/* Total */}
      <div className="pt-3 mt-3 border-t border-zinc-800 text-center">
        <p className="text-xs text-zinc-500">Total</p>
        <p className="text-sm font-medium text-white">
          {formatNumber(totalOrders)}
        </p>
      </div>
    </div>
  );
}
