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

      {/* Timeline area - width is fixed based on number of days */}
      {(() => {
        // Calculate positions for all blocks first
        const blockPositions = blocks.map(block => ({
          block,
          position: calculateBlockPosition(block, days, workHoursPerDay),
        })).filter(bp => bp.position.display !== 'none');
        
        // Sort by left position for consistent stacking
        blockPositions.sort((a, b) => {
          const leftA = parseFloat(a.position.left) || 0;
          const leftB = parseFloat(b.position.left) || 0;
          return leftA - leftB;
        });
        
        // Assign vertical slots to prevent visual overlap
        // Track which horizontal ranges are occupied at each vertical level
        const levels = []; // Array of arrays, each containing occupied ranges [{left, right}]
        
        blockPositions.forEach(bp => {
          const left = parseFloat(bp.position.left) || 0;
          const width = parseFloat(bp.position.width) || 60;
          const right = left + width;
          
          // Find the first level where this block doesn't overlap
          let assignedLevel = 0;
          for (let level = 0; level < levels.length; level++) {
            const hasOverlap = levels[level].some(range => 
              left < range.right + BLOCK_GAP_PX && right > range.left - BLOCK_GAP_PX
            );
            if (!hasOverlap) {
              assignedLevel = level;
              break;
            }
            assignedLevel = level + 1;
          }
          
          // Add this block to the assigned level
          if (!levels[assignedLevel]) {
            levels[assignedLevel] = [];
          }
          levels[assignedLevel].push({ left, right });
          bp.verticalLevel = assignedLevel;
        });
        
        // Calculate row height based on number of levels
        const blockHeight = 22; // Height of each block
        const verticalGap = BLOCK_GAP_PX;
        const topPadding = 4;
        const bottomPadding = 4;
        const numLevels = Math.max(1, levels.length);
        const rowHeight = topPadding + numLevels * blockHeight + (numLevels - 1) * verticalGap + bottomPadding;
        
        return (
          <div 
            className="relative bg-zinc-800/20"
            style={{ 
              width: `${days.length * DAY_COLUMN_WIDTH_PX}px`,
              minHeight: `${Math.max(30, rowHeight)}px`,
            }}
          >
            {/* Day columns */}
            <div className="absolute inset-0 flex">
              {days.map((day, index) => (
                <div
                  key={day.toISOString()}
                  onClick={() => onDayClick?.(machine, day)}
                  className={cn(
                    'border-r border-zinc-800/50 hover:bg-zinc-800/30 cursor-pointer',
                    index % 2 === 0 && 'bg-zinc-900/20'
                  )}
                  style={{ width: `${DAY_COLUMN_WIDTH_PX}px`, flexShrink: 0 }}
                />
              ))}
            </div>

            {/* Blocks */}
            {blockPositions.map(({ block, position, verticalLevel }) => (
              <ProductionBlock
                key={block.id}
                block={block}
                style={{
                  ...position,
                  top: `${topPadding + verticalLevel * (blockHeight + verticalGap)}px`,
                  height: `${blockHeight}px`,
                }}
                onClick={onBlockClick}
              />
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// Work hour constants (should match schedule-generator.js)
const WORK_START_HOUR = 6;   // 06:00
const WORK_END_HOUR = 22;    // 22:00

// Day column width in pixels - 180px gives more room for blocks
const DAY_COLUMN_WIDTH_PX = 180;

// Gap between blocks in pixels
const BLOCK_GAP_PX = 3;

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
 * Find the index of a date in the days array
 * Returns -1 if not found
 */
function findDayIndex(days, targetDate) {
  const targetDateStr = `${targetDate.getFullYear()}-${targetDate.getMonth()}-${targetDate.getDate()}`;
  
  for (let i = 0; i < days.length; i++) {
    const dayDate = new Date(days[i]);
    const dayDateStr = `${dayDate.getFullYear()}-${dayDate.getMonth()}-${dayDate.getDate()}`;
    if (dayDateStr === targetDateStr) {
      return i;
    }
  }
  return -1;
}

/**
 * Calculate block position using pixel-based positioning
 * 
 * Each day column is exactly DAY_COLUMN_WIDTH_PX pixels wide.
 * Within each day, time is mapped from WORK_START_HOUR to WORK_END_HOUR.
 * 
 * This uses pixel values instead of percentages to ensure correct alignment
 * with the day columns which use min-w-[120px].
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

  const workHoursMs = workHoursPerDay * 60 * 60 * 1000;
  
  // Find which days the block spans and calculate pixel positions
  let leftPx = null;
  let rightPx = 0;

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
    
    // Convert to pixel position
    // Each day column starts at (i * DAY_COLUMN_WIDTH_PX) pixels
    const dayStartPx = i * DAY_COLUMN_WIDTH_PX;
    const blockLeftInDay = dayStartPx + (dayStartOffset * DAY_COLUMN_WIDTH_PX);
    const blockRightInDay = dayStartPx + (dayEndOffset * DAY_COLUMN_WIDTH_PX);

    if (leftPx === null) {
      // First day of the block - set left position
      leftPx = blockLeftInDay;
    }
    
    // Always update right position to extend to current day's end
    rightPx = blockRightInDay;
  }

  // If block wasn't found in any day, hide it
  if (leftPx === null) {
    return { left: 0, width: 0, display: 'none' };
  }

  const widthPx = rightPx - leftPx;

  // Use pixel values for positioning
  // No minimum width - let blocks be their actual size to avoid fake overlaps
  return {
    left: `${leftPx}px`,
    width: `${Math.max(2, widthPx)}px`, // Minimum 2px so block is at least visible as a line
  };
}
