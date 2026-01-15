'use client';

import Modal from '@/components/shared/Modal';
import { formatDateLocale, formatNumber } from '@/lib/utils';

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

  // Generate hourly slots (06:00 - 22:00)
  const hours = [];
  for (let h = 6; h <= 22; h++) {
    hours.push(h);
  }

  const getBlockAtHour = (hour) => {
    const hourStart = new Date(date);
    hourStart.setHours(hour, 0, 0, 0);
    const hourEnd = new Date(date);
    hourEnd.setHours(hour, 59, 59, 999);

    return dayBlocks.find((b) => {
      const blockStart = new Date(b.start_time);
      const blockEnd = new Date(b.end_time);
      return blockStart <= hourEnd && blockEnd >= hourStart;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${machine.code} - ${formatDateLocale(date)}`}
      size="default"
    >
      <div className="space-y-1">
        {hours.map((hour) => {
          const block = getBlockAtHour(hour);
          return (
            <div
              key={hour}
              className={`flex items-center gap-4 p-2 rounded ${
                block ? 'bg-accent/20' : 'bg-zinc-800/30'
              }`}
            >
              <span className="w-16 text-sm text-zinc-400">
                {hour.toString().padStart(2, '0')}:00
              </span>
              {block ? (
                <div className="flex-1">
                  <span className="text-sm text-white font-medium">
                    {block.product?.name}
                  </span>
                  <span className="text-xs text-zinc-400 ml-2">
                    ({formatNumber(block.batch_size)} units)
                  </span>
                </div>
              ) : (
                <span className="text-sm text-zinc-600">Available</span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
