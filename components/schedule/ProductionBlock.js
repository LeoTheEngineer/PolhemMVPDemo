'use client';

import { useRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';

export default function ProductionBlock({
  block,
  style = {},
  onClick,
  isDragging = false,
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingState } = useDraggable({
    id: block.id,
    data: block,
  });

  // Track if this is a click vs drag
  const mouseDownPos = useRef(null);
  const [wasDragged, setWasDragged] = useState(false);

  const dragStyle = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  // Custom mouse handlers to differentiate click from drag
  const handleMouseDown = (e) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setWasDragged(false);
    // Call original DnD listener
    listeners?.onMouseDown?.(e);
  };

  const handleMouseMove = (e) => {
    if (mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      // If moved more than 5 pixels, consider it a drag
      if (dx > 5 || dy > 5) {
        setWasDragged(true);
      }
    }
  };

  const handleMouseUp = (e) => {
    // Only trigger click if we didn't drag
    if (!wasDragged && mouseDownPos.current) {
      const dx = Math.abs(e.clientX - mouseDownPos.current.x);
      const dy = Math.abs(e.clientY - mouseDownPos.current.y);
      // Click threshold: less than 5 pixels of movement
      if (dx < 5 && dy < 5) {
        onClick?.(block);
      }
    }
    mouseDownPos.current = null;
    setWasDragged(false);
  };

  // Touch handlers for mobile
  const touchStartPos = useRef(null);

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    setWasDragged(false);
    listeners?.onTouchStart?.(e);
  };

  const handleTouchEnd = (e) => {
    if (!wasDragged && touchStartPos.current && e.changedTouches[0]) {
      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx < 10 && dy < 10) {
        onClick?.(block);
      }
    }
    touchStartPos.current = null;
    setWasDragged(false);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      suppressHydrationWarning
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={listeners?.onKeyDown}
      className={cn(
        'absolute rounded cursor-pointer',
        'bg-accent hover:bg-accent/80 transition-colors',
        'border border-accent/50',
        'hover:shadow-lg hover:z-10',
        (isDragging || isDraggingState) && 'opacity-50 z-50 cursor-grabbing'
      )}
      style={{
        ...dragStyle,
        ...style, // style comes after dragStyle so height/top/left/width from parent take precedence
      }}
      role="button"
      tabIndex={0}
      aria-label={`Production block: ${block.customer?.name || 'Customer'}, ${formatNumber(block.batch_size)} units`}
    >
      <div className="px-1.5 truncate h-full flex items-center pointer-events-none">
        <span className="text-[10px] font-medium text-white truncate">
          {block.customer?.name || 'Customer'} - {formatNumber(block.batch_size)}
        </span>
      </div>
    </div>
  );
}
