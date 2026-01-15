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
