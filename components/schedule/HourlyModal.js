'use client';

import Modal from '@/components/shared/Modal';
import { formatDateLocale, formatNumber } from '@/lib/utils';

const WORK_START_HOUR = 6;
const WORK_END_HOUR = 22;
const TOTAL_HOURS = WORK_END_HOUR - WORK_START_HOUR;

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
      <div className="relative" style={{ height: `${TOTAL_HOURS * 32}px` }}>
        {/* Hour grid lines */}
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-zinc-800/50 flex items-start"
            style={{ top: `${index * 32}px`, height: '32px' }}
          >
            <span className="w-16 text-xs text-zinc-500 pr-2 text-right flex-shrink-0">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
        
        {/* Production blocks */}
        {dayBlocks.map((block, index) => {
          const style = calculateBlockStyle(block, date);
          if (!style) return null;
          return (
            <div
              key={block.id || index}
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

function calculateBlockStyle(block, date) {
  const dayStart = new Date(date);
  dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
  
  const blockStart = new Date(block.start_time);
  const blockEnd = new Date(block.end_time);
  
  // Clamp to this day's work hours
  const dayWorkStart = new Date(date);
  dayWorkStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const dayWorkEnd = new Date(date);
  dayWorkEnd.setHours(WORK_END_HOUR, 0, 0, 0);
  
  const visibleStart = blockStart < dayWorkStart ? dayWorkStart : blockStart;
  const visibleEnd = blockEnd > dayWorkEnd ? dayWorkEnd : blockEnd;
  
  // If block doesn't overlap work hours, don't render
  if (visibleEnd <= visibleStart) return null;
  
  const startOffset = (visibleStart - dayWorkStart) / (1000 * 60 * 60); // hours from start
  const duration = (visibleEnd - visibleStart) / (1000 * 60 * 60); // hours
  
  return {
    top: `${startOffset * 32}px`,
    height: `${Math.max(duration * 32, 24)}px`, // minimum height of 24px
  };
}
