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
  onMachineClick,
  isCompatibleTarget,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `machine-${machine.id}`,
    data: { machineId: machine.id },
  });

  // Calculate OEE only for hours within the visible date range
  const rangeStart = new Date(days[0]);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(days[days.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  const totalBlockHours = blocks.reduce((sum, block) => {
    const blockStart = new Date(block.start_time);
    const blockEnd = new Date(block.end_time);
    
    // Clamp block times to visible range
    const visibleStart = blockStart < rangeStart ? rangeStart : blockStart;
    const visibleEnd = blockEnd > rangeEnd ? rangeEnd : blockEnd;
    
    // Only count if block is within visible range
    if (visibleEnd <= visibleStart) return sum;
    
    return sum + (visibleEnd - visibleStart) / (1000 * 60 * 60);
  }, 0);

  const availableHours = days.length * workHoursPerDay;
  // Cap OEE at 100%
  const oee = availableHours > 0 
    ? Math.min(100, (totalBlockHours / availableHours) * 100) 
    : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex border-b border-zinc-800 min-w-fit',
        isOver && isCompatibleTarget && 'bg-accent/10',
        isOver && !isCompatibleTarget && 'bg-red-500/10'
      )}
    >
      {/* Machine label - simplified, clickable */}
      <div 
        className="w-32 flex-shrink-0 px-4 py-3 bg-zinc-900 border-r border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors flex items-center"
        onClick={() => onMachineClick?.(machine, oee)}
      >
        <div className="text-sm font-semibold text-white">{machine.code}</div>
      </div>

      {/* Timeline area */}
      <div className="flex-1 relative bg-zinc-800/20 min-h-[52px]">
        {/* Day columns */}
        <div className="absolute inset-0 flex">
          {days.map((day, index) => (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick?.(machine, day)}
              className={cn(
                'min-w-[120px] flex-1 border-r border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer',
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

// Work hour constants (should match schedule-generator.js)
const WORK_START_HOUR = 6;   // 06:00
const WORK_END_HOUR = 22;    // 22:00

/**
 * Parse an ISO date string and extract date/time components
 * This treats the time as "intended local time" regardless of timezone
 * because the schedule generator stores times with local work hours in mind
 */
function parseBlockTime(isoString) {
  // Parse ISO string manually to avoid timezone conversion issues
  // Format: 2026-01-17T06:00:00.000Z or 2026-01-17T06:00:00
  const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    // Fallback to regular parsing
    return new Date(isoString);
  }
  
  const [, year, month, day, hour, minute] = match;
  // Create date using local timezone with the parsed values
  return new Date(
    parseInt(year),
    parseInt(month) - 1, // months are 0-indexed
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    0,
    0
  );
}

/**
 * Calculate block position based on day columns
 * Each day column represents 1/N of the total width (where N = number of days)
 * Within each day, time is mapped from WORK_START_HOUR to WORK_END_HOUR
 */
function calculateBlockPosition(block, days, workHoursPerDay) {
  if (days.length === 0) return { left: 0, width: 0, display: 'none' };

  // Parse block times - treat as local times (ignore UTC conversion)
  const blockStart = parseBlockTime(block.start_time);
  const blockEnd = parseBlockTime(block.end_time);
  
  // Get the date portion only (year, month, day) for the block start/end
  const blockStartDate = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate());
  const blockEndDate = new Date(blockEnd.getFullYear(), blockEnd.getMonth(), blockEnd.getDate());
  
  // Get first/last day boundaries
  const firstDay = new Date(days[0]);
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(days[days.length - 1]);
  lastDay.setHours(23, 59, 59, 999);
  
  // Check if block is completely outside visible date range
  if (blockEndDate < firstDay || blockStartDate > lastDay) {
    return { left: 0, width: 0, display: 'none' };
  }

  // Each day takes up (100 / days.length)% of the width
  const dayWidthPercent = 100 / days.length;
  const workHoursMs = workHoursPerDay * 60 * 60 * 1000;

  // Find which days the block spans and calculate position
  let leftPercent = null;
  let rightPercent = 0;

  for (let i = 0; i < days.length; i++) {
    const dayDate = new Date(days[i]);
    dayDate.setHours(0, 0, 0, 0);
    
    // Create work hours boundaries for this day
    const dayWorkStart = new Date(dayDate);
    dayWorkStart.setHours(WORK_START_HOUR, 0, 0, 0);
    const dayWorkEnd = new Date(dayDate);
    dayWorkEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    // Check if block overlaps with this day's work hours
    // Block overlaps if: block starts before day work ends AND block ends after day work starts
    if (blockEnd <= dayWorkStart || blockStart >= dayWorkEnd) {
      continue; // Block doesn't overlap this day's work hours
    }

    // Calculate the overlap with this day's work hours
    const overlapStart = blockStart > dayWorkStart ? blockStart : dayWorkStart;
    const overlapEnd = blockEnd < dayWorkEnd ? blockEnd : dayWorkEnd;
    
    // Position within this day (0 to 1, where 0 = work start, 1 = work end)
    const dayStartOffset = Math.max(0, Math.min(1, (overlapStart - dayWorkStart) / workHoursMs));
    const dayEndOffset = Math.max(0, Math.min(1, (overlapEnd - dayWorkStart) / workHoursMs));
    
    // Convert to percentage of total width
    const blockLeftInDay = i * dayWidthPercent + dayStartOffset * dayWidthPercent;
    const blockRightInDay = i * dayWidthPercent + dayEndOffset * dayWidthPercent;

    if (leftPercent === null) {
      // First day of the block - set left position
      leftPercent = blockLeftInDay;
    }
    
    // Always update right position to extend to current day's end
    rightPercent = blockRightInDay;
  }

  // If block wasn't found in any day, hide it
  if (leftPercent === null) {
    return { left: 0, width: 0, display: 'none' };
  }

  const widthPercent = rightPercent - leftPercent;

  return {
    left: `${Math.max(0, Math.min(100, leftPercent))}%`,
    width: `${Math.max(0.5, Math.min(100 - leftPercent, widthPercent))}%`,
  };
}
