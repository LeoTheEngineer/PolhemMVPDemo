# 13 - Schedule Page

## Purpose

Create the Production Schedule page with:
- Gantt chart visualization
- Drag-and-drop block repositioning
- Date range selection
- Hourly detail modal
- Block edit modal
- Generate/Regenerate schedule functionality
- OEE metrics display

---

## Prerequisites

- `12-settings-page.md` completed
- `@dnd-kit/core` installed
- Production blocks API working

---

## Files to Create

```
app/(dashboard)/schedule/page.js
app/(dashboard)/schedule/SchedulePageClient.js
components/schedule/
├── ScheduleGantt.js
├── MachineRow.js
├── ProductionBlock.js
├── BlockEditModal.js
├── HourlyModal.js
└── DateRangePicker.js
```

---

## Implementation

### Step 1: Create `components/schedule/DateRangePicker.js`

```javascript
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
```

---

### Step 2: Create `components/schedule/ProductionBlock.js`

```javascript
'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

export default function ProductionBlock({
  block,
  style = {},
  onClick,
  isDragging = false,
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: block.id,
    data: block,
  });

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClick?.(block)}
      className={cn(
        'absolute rounded cursor-grab active:cursor-grabbing',
        'bg-accent hover:bg-accent/80 transition-colors',
        'border border-accent/50',
        isDragging && 'opacity-50 z-50'
      )}
      style={{
        ...style,
        ...dragStyle,
        height: '40px',
        top: '4px',
      }}
    >
      <div className="px-2 py-1 truncate h-full flex flex-col justify-center">
        <span className="text-xs font-semibold text-white truncate">
          {block.product?.name || 'Product'}
        </span>
        <span className="text-[10px] text-white/70">
          {formatNumber(block.batch_size)} units
        </span>
      </div>
    </div>
  );
}
```

---

### Step 3: Create `components/schedule/MachineRow.js`

```javascript
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
```

---

### Step 4: Create `components/schedule/BlockEditModal.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { Select, DateTimeInput, Input } from '@/components/shared/FormFields';
import { formatNumber, hoursBetween } from '@/lib/utils';

export default function BlockEditModal({
  isOpen,
  onClose,
  block,
  machines,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    if (block) {
      setFormData({
        machine_id: block.machine_id,
        start_time: block.start_time?.slice(0, 16) || '',
        end_time: block.end_time?.slice(0, 16) || '',
      });
    }
  }, [block]);

  // Calculate duration
  const duration = formData.start_time && formData.end_time
    ? hoursBetween(formData.start_time, formData.end_time)
    : 0;

  // Get compatible machines for this block's product
  const compatibleMachines = machines.filter((m) => {
    if (!block?.product?.compatible_machines) return true;
    return block.product.compatible_machines.includes(m.id);
  });

  const handleStartChange = (newStart) => {
    if (!formData.end_time) {
      setFormData({ ...formData, start_time: newStart });
      return;
    }

    // Keep duration fixed, adjust end time
    const currentDuration = hoursBetween(formData.start_time, formData.end_time);
    const newEnd = new Date(new Date(newStart).getTime() + currentDuration * 60 * 60 * 1000);
    setFormData({
      ...formData,
      start_time: newStart,
      end_time: newEnd.toISOString().slice(0, 16),
    });
  };

  const handleEndChange = (newEnd) => {
    if (!formData.start_time) {
      setFormData({ ...formData, end_time: newEnd });
      return;
    }

    // Keep duration fixed, adjust start time
    const currentDuration = hoursBetween(formData.start_time, formData.end_time);
    const newStart = new Date(new Date(newEnd).getTime() - currentDuration * 60 * 60 * 1000);
    setFormData({
      ...formData,
      start_time: newStart.toISOString().slice(0, 16),
      end_time: newEnd,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/production-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: block.id,
          machine_id: formData.machine_id,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Block updated');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error('Failed to update block');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!block) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Production Block"
      size="default"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Read-only info */}
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Product:</span> {block.product?.name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Customer:</span> {block.customer?.name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Batch Size:</span> {formatNumber(block.batch_size)} units
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Duration:</span> {duration.toFixed(1)} hours
          </p>
        </div>

        {/* Machine selection */}
        <Select
          label="Machine"
          value={formData.machine_id}
          onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
          options={compatibleMachines.map((m) => ({
            value: m.id,
            label: `${m.code} - ${m.name}`,
          }))}
        />

        {/* Time inputs */}
        <DateTimeInput
          label="Start Time"
          value={formData.start_time}
          onChange={(e) => handleStartChange(e.target.value)}
        />

        <DateTimeInput
          label="End Time"
          value={formData.end_time}
          onChange={(e) => handleEndChange(e.target.value)}
        />

        <p className="text-xs text-zinc-500">
          Changing start or end time will maintain the block duration.
        </p>
      </div>
    </Modal>
  );
}
```

---

### Step 5: Create `components/schedule/HourlyModal.js`

```javascript
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
```

---

### Step 6: Create `components/schedule/ScheduleGantt.js`

```javascript
'use client';

import { useState } from 'react';
import { DndContext, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { toast } from 'sonner';
import MachineRow from './MachineRow';
import ProductionBlock from './ProductionBlock';
import { getDateRange } from '@/lib/utils';

export default function ScheduleGantt({
  machines,
  blocks,
  startDate,
  endDate,
  workHoursPerDay,
  onBlockClick,
  onDayClick,
  onBlockMove,
}) {
  const [activeBlock, setActiveBlock] = useState(null);
  const [dragOverMachine, setDragOverMachine] = useState(null);

  const days = getDateRange(startDate, endDate);

  const handleDragStart = (event) => {
    const block = event.active.data.current;
    setActiveBlock(block);
  };

  const handleDragOver = (event) => {
    const overId = event.over?.id;
    if (overId && String(overId).startsWith('machine-')) {
      const machineId = String(overId).replace('machine-', '');
      setDragOverMachine(machineId);
    } else {
      setDragOverMachine(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveBlock(null);
    setDragOverMachine(null);

    if (!over) return;

    const block = active.data.current;
    const overId = String(over.id);

    if (overId.startsWith('machine-')) {
      const newMachineId = overId.replace('machine-', '');

      if (newMachineId !== block.machine_id) {
        // Check compatibility
        const newMachine = machines.find((m) => m.id === newMachineId);
        const isCompatible =
          !block.product?.compatible_machines ||
          block.product.compatible_machines.includes(newMachineId);

        if (!isCompatible) {
          toast.error('Machine not compatible with this product');
          return;
        }

        // Move block to new machine
        await onBlockMove?.(block.id, newMachineId);
      }
    }
  };

  // Check if dragged block is compatible with target machine
  const isCompatibleTarget = (machineId) => {
    if (!activeBlock) return true;
    if (!activeBlock.product?.compatible_machines) return true;
    return activeBlock.product.compatible_machines.includes(machineId);
  };

  return (
    <DndContext
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        {/* Header with day labels */}
        <div className="flex border-b border-zinc-800 bg-zinc-900">
          <div className="w-32 flex-shrink-0 px-4 py-2 border-r border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">MACHINE</span>
          </div>
          <div className="flex-1 flex">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="flex-1 px-2 py-2 text-center border-r border-zinc-800/50"
              >
                <span className="text-xs text-zinc-400">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <br />
                <span className="text-xs font-medium text-white">
                  {day.getDate()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Machine rows */}
        {machines.map((machine) => {
          const machineBlocks = blocks.filter(
            (b) => b.machine_id === machine.id
          );
          return (
            <MachineRow
              key={machine.id}
              machine={machine}
              blocks={machineBlocks}
              days={days}
              workHoursPerDay={workHoursPerDay}
              onBlockClick={onBlockClick}
              onDayClick={onDayClick}
              isCompatibleTarget={isCompatibleTarget(machine.id)}
            />
          );
        })}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeBlock && (
          <div className="bg-accent rounded px-2 py-1 shadow-lg">
            <span className="text-xs font-semibold text-white">
              {activeBlock.product?.name}
            </span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

---

### Step 7: Create Schedule Page `app/(dashboard)/schedule/page.js`

```javascript
import { createServerClient } from '@/lib/supabase';
import SchedulePageClient from './SchedulePageClient';

async function getScheduleData() {
  const supabase = createServerClient();

  const [machinesResult, blocksResult, settingsResult] = await Promise.all([
    supabase.from('machines').select('*').eq('status', 'available').order('code'),
    supabase
      .from('production_blocks')
      .select('*, machine:machines(*), product:products(*), customer:customers(*)')
      .order('start_time'),
    supabase.from('settings').select('*').eq('id', 'main').single(),
  ]);

  return {
    machines: machinesResult.data || [],
    blocks: blocksResult.data || [],
    settings: settingsResult.data,
  };
}

export default async function SchedulePage() {
  const data = await getScheduleData();
  return <SchedulePageClient {...data} />;
}
```

---

### Step 8: Create `app/(dashboard)/schedule/SchedulePageClient.js`

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import Button from '@/components/shared/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DateRangePicker from '@/components/schedule/DateRangePicker';
import ScheduleGantt from '@/components/schedule/ScheduleGantt';
import BlockEditModal from '@/components/schedule/BlockEditModal';
import HourlyModal from '@/components/schedule/HourlyModal';
import { formatDate, addDays } from '@/lib/utils';

export default function SchedulePageClient({ machines, blocks, settings }) {
  const router = useRouter();
  
  // Date range state
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(formatDate(addDays(new Date(), 14)));
  
  // Modal states
  const [editBlock, setEditBlock] = useState(null);
  const [hourlyView, setHourlyView] = useState({ date: null, machine: null });
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  
  // Loading states
  const [generating, setGenerating] = useState(false);

  // Get metrics from settings
  const metrics = settings?.schedule_metrics || {};
  const hasManualEdits = metrics.has_manual_edits || false;

  const handleGenerate = async () => {
    setGenerating(true);
    setShowConfirmGenerate(false);

    try {
      const response = await fetch('/api/production-blocks/generate', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate');

      const result = await response.json();
      toast.success(`Generated ${result.data?.length || 0} production blocks`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to generate schedule');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleBlockMove = async (blockId, newMachineId) => {
    try {
      const response = await fetch('/api/production-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blockId, machine_id: newMachineId }),
      });

      if (!response.ok) throw new Error('Failed to move block');

      // Mark as manual edit
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_metrics: { ...metrics, has_manual_edits: true },
        }),
      });

      toast.success('Block moved');
      router.refresh();
    } catch (error) {
      toast.error('Failed to move block');
      console.error(error);
    }
  };

  const handleBlockEdit = () => {
    router.refresh();
    setEditBlock(null);
  };

  const handleDayClick = (machine, day) => {
    // Check if block duration is < 16 hours
    // For simplicity, always open hourly view
    setHourlyView({ machine, date: day });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Schedule</h1>
          <p className="text-zinc-400 mt-1">
            View and manage production planning
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasManualEdits && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Manual edits
            </div>
          )}
          <Button
            onClick={() =>
              hasManualEdits ? setShowConfirmGenerate(true) : handleGenerate()
            }
            loading={generating}
          >
            <RefreshCw className="w-4 h-4" />
            {blocks.length === 0 ? 'Generate Schedule' : 'Regenerate'}
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics.total_oee !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Global OEE"
            value={`${metrics.total_oee}%`}
            color={metrics.total_oee >= 80 ? 'text-green-400' : 'text-yellow-400'}
          />
          <MetricCard
            label="Production Hours"
            value={metrics.total_production_hours || 0}
          />
          <MetricCard label="Total Blocks" value={metrics.total_blocks || 0} />
          <MetricCard
            label="Machines Used"
            value={`${metrics.machines_used || 0}/${machines.length}`}
          />
        </div>
      )}

      {/* Date Range Picker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      {/* Gantt Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">No production blocks scheduled.</p>
            <Button onClick={handleGenerate} loading={generating}>
              Generate Schedule
            </Button>
          </div>
        ) : (
          <ScheduleGantt
            machines={machines}
            blocks={blocks}
            startDate={startDate}
            endDate={endDate}
            workHoursPerDay={settings?.work_hours_per_day || 16}
            onBlockClick={setEditBlock}
            onDayClick={handleDayClick}
            onBlockMove={handleBlockMove}
          />
        )}
      </div>

      {/* Block Edit Modal */}
      <BlockEditModal
        isOpen={!!editBlock}
        onClose={() => setEditBlock(null)}
        block={editBlock}
        machines={machines}
        onSave={handleBlockEdit}
      />

      {/* Hourly View Modal */}
      <HourlyModal
        isOpen={!!hourlyView.date}
        onClose={() => setHourlyView({ date: null, machine: null })}
        date={hourlyView.date}
        machine={hourlyView.machine}
        blocks={blocks}
      />

      {/* Confirm Regenerate Dialog */}
      <ConfirmDialog
        isOpen={showConfirmGenerate}
        onClose={() => setShowConfirmGenerate(false)}
        onConfirm={handleGenerate}
        title="Regenerate Schedule?"
        description="You have manual edits that will be lost. Are you sure you want to regenerate the entire schedule?"
        confirmText="Regenerate"
        variant="danger"
        loading={generating}
      />
    </div>
  );
}

function MetricCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
```

---

## Folder Structure Commands

```bash
mkdir -p "app/(dashboard)/schedule"
mkdir -p components/schedule
```

---

## Verification

1. **Navigate to Schedule:** `http://localhost:3000/schedule`

2. **Test generation:** Click "Generate Schedule" → blocks should appear

3. **Test drag-drop:** Drag a block to a different machine row

4. **Test modals:**
   - Click a block → edit modal opens
   - Click a day cell → hourly modal opens

5. **Test regenerate warning:** After manual edits, confirm dialog appears

---

## Next Step

Proceed to `14-deployment.md` for DigitalOcean deployment configuration.
