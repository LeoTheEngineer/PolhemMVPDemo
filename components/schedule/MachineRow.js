'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import ProductionBlock from './ProductionBlock';

export default function MachineRow({
  machine,
  blocks,
  days,
  workHoursPerDay,
  onBlockClick,
  onDayClick,
  isCompatibleTarget,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `machine-${machine.id}`,
    data: { machineId: machine.id },
  });

  // Calculate OEE for this machine
  const totalBlockHours = blocks.reduce((sum, block) => {
    const start = new Date(block.start_time);
    const end = new Date(block.end_time);
    return sum + (end - start) / (1000 * 60 * 60);
  }, 0);
  const availableHours = days.length * workHoursPerDay;
  const oee = availableHours > 0 ? (totalBlockHours / availableHours) * 100 : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex border-b border-zinc-800',
        isOver && isCompatibleTarget && 'bg-accent/10',
        isOver && !isCompatibleTarget && 'bg-red-500/10'
      )}
    >
      {/* Machine label */}
      <div className="w-32 flex-shrink-0 px-4 py-3 bg-zinc-900 border-r border-zinc-800">
        <div className="text-sm font-semibold text-white">{machine.code}</div>
        <div className="text-xs text-zinc-500">{machine.name}</div>
        <div
          className={cn(
            'text-xs font-medium mt-1',
            oee >= 80 ? 'text-green-400' : oee >= 50 ? 'text-yellow-400' : 'text-zinc-500'
          )}
        >
          OEE: {oee.toFixed(0)}%
        </div>
      </div>

      {/* Timeline area */}
      <div className="flex-1 relative bg-zinc-800/20 min-h-[50px]">
        {/* Day columns */}
        <div className="absolute inset-0 flex">
          {days.map((day, index) => (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(machine, day)}
              className={cn(
                'flex-1 border-r border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer',
                index % 2 === 0 && 'bg-zinc-900/20'
              )}
            />
          ))}
        </div>

        {/* Blocks */}
        {blocks.map((block) => {
          const blockStyle = calculateBlockPosition(block, days, workHoursPerDay);
          // Skip rendering blocks that are completely outside the visible range
          if (blockStyle.display === 'none') return null;
          return (
            <ProductionBlock
              key={block.id}
              block={block}
              style={blockStyle}
              onClick={onBlockClick}
            />
          );
        })}
      </div>
    </div>
  );
}

function calculateBlockPosition(block, days, workHoursPerDay) {
  if (days.length === 0) return { left: 0, width: 0, display: 'none' };

  // Define visible range boundaries
  const rangeStart = new Date(days[0]);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(days[days.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const blockStart = new Date(block.start_time);
  const blockEnd = new Date(block.end_time);

  // Check if block is completely outside visible range
  if (blockEnd < rangeStart || blockStart > rangeEnd) {
    return { left: 0, width: 0, display: 'none' };
  }

  // Clamp block times to visible range
  const visibleStart = blockStart < rangeStart ? rangeStart : blockStart;
  const visibleEnd = blockEnd > rangeEnd ? rangeEnd : blockEnd;

  // Calculate total duration of visible range in ms
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  
  // Calculate position as percentage of visible range
  const leftPercent = ((visibleStart - rangeStart) / totalMs) * 100;
  const widthPercent = ((visibleEnd - visibleStart) / totalMs) * 100;

  return {
    left: `${leftPercent}%`,
    width: `${Math.max(1, widthPercent)}%`, // Minimum 1% width so block is visible
  };
}
