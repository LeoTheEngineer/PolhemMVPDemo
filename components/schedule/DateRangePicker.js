'use client';

import { DateInput } from '@/components/shared/FormFields';

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}) {
  return (
    <div className="flex items-end gap-4">
      <DateInput
        label="Start Date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
      />
      <span className="text-zinc-500 pb-2">to</span>
      <DateInput
        label="End Date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        min={startDate}
      />
    </div>
  );
}
