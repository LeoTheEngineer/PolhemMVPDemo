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
  onMachineClick,
}) {
  const [activeBlock, setActiveBlock] = useState(null);
  const [dragOverMachine, setDragOverMachine] = useState(null);

  const days = getDateRange(startDate, endDate);
  
  // Parse ISO date string treating it as local time (ignore timezone)
  const parseLocalTime = (isoString) => {
    const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!match) return new Date(isoString);
    const [, year, month, day, hour, minute] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
  };
  
  // Filter blocks to only those that overlap with the visible date range
  const visibleBlocks = blocks.filter(block => {
    const blockStart = parseLocalTime(block.start_time);
    const blockEnd = parseLocalTime(block.end_time);
    
    // Get range boundaries
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);
    
    // Block is visible if it overlaps with the range
    return blockStart <= rangeEnd && blockEnd >= rangeStart;
  });

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
      <div className="border border-zinc-800 rounded-lg overflow-x-auto">
        {/* Header with day labels */}
        <div className="flex border-b border-zinc-800 bg-zinc-900 min-w-fit">
          <div className="w-32 flex-shrink-0 px-4 py-2 border-r border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400">MACHINE</span>
          </div>
          <div className="flex" style={{ width: `${days.length * 180}px` }}>
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className="px-2 py-2 text-center border-r border-zinc-800/50"
                style={{ width: '180px', flexShrink: 0 }}
              >
                <span className="text-xs text-zinc-400">
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <br />
                <span className="text-xs font-medium text-white">
                  {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Machine rows */}
        {machines.map((machine) => {
          const machineBlocks = visibleBlocks.filter(
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
              onMachineClick={onMachineClick}
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
