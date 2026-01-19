'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, getWeekNumber } from '@/lib/utils';
import OrderCard from './OrderCard';

// Reliability threshold - predictions below this are hidden
const RELIABILITY_THRESHOLD = 0.75;

export default function OrderTimeline({
  orders = [],
  predictedOrders = [],
  onOrderClick,
  onPredictionClick,
}) {
  // Filter out unreliable predictions
  const reliablePredictions = useMemo(() => {
    return predictedOrders.filter(pred => pred.confidence_score >= RELIABILITY_THRESHOLD);
  }, [predictedOrders]);

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

    // Process reliable predicted orders only
    reliablePredictions.forEach((pred) => {
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
  }, [orders, reliablePredictions]);

  if (weeklyData.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No orders to display. Select a customer and product to view timeline.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-2 min-w-max">
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
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-zinc-800">
        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-zinc-700/50 border border-zinc-600/50" />
          <span className="text-xs text-zinc-400">Real Order</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-zinc-700/50 border border-zinc-600/50 relative">
            <span className="absolute inset-0 flex items-center justify-center text-[6px] font-bold text-zinc-300">P</span>
          </div>
          <span className="text-xs text-zinc-400">Predicted</span>
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
    <div className="flex flex-col min-w-[100px]">
      {/* Week header */}
      <div className="text-center pb-2 border-b border-zinc-800 mb-2">
        <p className="text-sm font-medium text-white">W{week.week}</p>
        <p className="text-xs text-zinc-500">{week.year}</p>
      </div>

      {/* Orders */}
      <div className="flex-1 space-y-1">
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
      <div className="pt-2 mt-2 border-t border-zinc-800 text-center">
        <p className="text-xs text-zinc-500">Total</p>
        <p className="text-sm font-medium text-white">
          {formatNumber(totalOrders)}
        </p>
      </div>
    </div>
  );
}
