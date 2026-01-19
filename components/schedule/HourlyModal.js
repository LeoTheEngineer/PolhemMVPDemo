'use client';

import Modal from '@/components/shared/Modal';
import { formatDateLocale, formatNumber } from '@/lib/utils';

const WORK_START_HOUR = 6;
const WORK_END_HOUR = 22;
const TOTAL_HOURS = WORK_END_HOUR - WORK_START_HOUR;
const PIXELS_PER_HOUR = 36;
const BLOCK_GAP = 4; // Gap in pixels between blocks

export default function HourlyModal({
  isOpen,
  onClose,
  date,
  machine,
  blocks,
}) {
  if (!date || !machine) return null;

  // Filter blocks for this day and machine
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayBlocks = blocks.filter((b) => {
    if (b.machine_id !== machine.id) return false;
    const blockStart = new Date(b.start_time);
    const blockEnd = new Date(b.end_time);
    return blockStart <= dayEnd && blockEnd >= dayStart;
  });

  // Sort blocks by start time to properly calculate gaps
  const sortedBlocks = [...dayBlocks].sort((a, b) => 
    new Date(a.start_time) - new Date(b.start_time)
  );

  // Pre-calculate work start time for this day
  const dayWorkStart = new Date(date);
  dayWorkStart.setHours(WORK_START_HOUR, 0, 0, 0);

  // Pre-calculate which blocks need gaps (blocks followed by another block)
  // and store the next block's start hour for accurate positioning
  const blockGapInfo = new Map(); // blockId -> { needsGap, nextBlockStartHour }
  for (let i = 0; i < sortedBlocks.length - 1; i++) {
    const currentBlock = sortedBlocks[i];
    const nextBlock = sortedBlocks[i + 1];
    
    const currentEnd = new Date(currentBlock.end_time);
    const nextStart = new Date(nextBlock.start_time);
    
    // If blocks are adjacent (within 1 minute), current block needs a gap
    if (Math.abs(currentEnd - nextStart) < 60000) {
      // Calculate the start hour of the next block
      const nextBlockStartHour = Math.floor((nextStart - dayWorkStart) / (1000 * 60 * 60));
      blockGapInfo.set(currentBlock.id, { needsGap: true, nextBlockStartHour });
    }
  }

  // Generate hour markers
  const hours = [];
  for (let h = WORK_START_HOUR; h <= WORK_END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${machine.code} - ${formatDateLocale(date)}`}
      size="default"
    >
      <div className="relative" style={{ height: `${TOTAL_HOURS * PIXELS_PER_HOUR}px` }}>
          {/* Hour grid lines */}
          {hours.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-zinc-800/50 flex items-start"
              style={{ top: `${index * PIXELS_PER_HOUR}px`, height: `${PIXELS_PER_HOUR}px` }}
            >
              <span className="w-16 text-xs text-zinc-500 pr-2 text-right flex-shrink-0">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
          
          {/* Production blocks */}
          {sortedBlocks.map((block) => {
            const gapInfo = blockGapInfo.get(block.id);
            const needsGap = gapInfo?.needsGap || false;
            const nextBlockStartHour = gapInfo?.nextBlockStartHour ?? null;
            const style = calculateBlockStyle(block, date, needsGap, nextBlockStartHour);
            if (!style) return null;
            return (
              <div
                key={block.id}
                className="absolute left-16 right-2 bg-accent/30 border-l-4 border-accent rounded-r px-2 py-1 overflow-hidden"
                style={style}
              >
                <p className="text-sm font-medium text-white truncate">
                  {block.product?.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {formatNumber(block.batch_size)} units
                </p>
              </div>
            );
          })}
        </div>
    </Modal>
  );
}

function calculateBlockStyle(block, date, needsGap, nextBlockStartHour) {
  const dayWorkStart = new Date(date);
  dayWorkStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const dayWorkEnd = new Date(date);
  dayWorkEnd.setHours(WORK_END_HOUR, 0, 0, 0);
  
  const blockStart = new Date(block.start_time);
  const blockEnd = new Date(block.end_time);
  
  const visibleStart = blockStart < dayWorkStart ? dayWorkStart : blockStart;
  const visibleEnd = blockEnd > dayWorkEnd ? dayWorkEnd : blockEnd;
  
  // If block doesn't overlap work hours, don't render
  if (visibleEnd <= visibleStart) return null;
  
  // Snap to the hour where the block starts (floor to nearest hour)
  const startHour = Math.floor((visibleStart - dayWorkStart) / (1000 * 60 * 60));
  
  // Calculate top position aligned to the start hour
  const topPx = startHour * PIXELS_PER_HOUR;
  
  // Calculate end position: if there's a next block, end at that block's start hour minus gap
  // Otherwise, calculate based on the block's actual end time
  let bottomPx;
  if (needsGap && nextBlockStartHour !== null) {
    // End exactly at the next block's start position, minus the gap
    bottomPx = (nextBlockStartHour * PIXELS_PER_HOUR) - BLOCK_GAP;
  } else {
    // No next block adjacent, calculate based on actual end time
    const endHour = Math.ceil((visibleEnd - dayWorkStart) / (1000 * 60 * 60));
    bottomPx = endHour * PIXELS_PER_HOUR;
  }
  
  const heightPx = bottomPx - topPx;
  
  return {
    top: `${topPx}px`,
    height: `${Math.max(heightPx, 24)}px`,
  };
}
