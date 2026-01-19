# Feature: Fix Production Schedule Page Bugs

## Overview

This document describes the code changes required to fix three bugs on the Production Schedule page:

1. **OEE Calculation Bug** - OEE values exceed 100% for some machines after generating a schedule
2. **Production Block Visual Cramping** - Blocks overlap and are too cramped to read text
3. **Missing Click Interaction** - Cannot click on production blocks to open detail popup

---

## Bug 1: OEE Calculation Exceeds 100%

### Problem Description

After generating a production schedule, some machines display OEE (Overall Equipment Effectiveness) values greater than 100%, which is mathematically impossible. OEE should always be a value between 0% and 100%.

### Root Cause Analysis

The OEE calculation in `MachineRow.js` does NOT cap the result at 100%, unlike the global OEE calculation in `schedule-generator.js` which uses `Math.min(100, ...)`.

**Problem Location:** `components/schedule/MachineRow.js` lines 21-28

```javascript
// Current buggy code (line 21-28):
const totalBlockHours = blocks.reduce((sum, block) => {
  const start = new Date(block.start_time);
  const end = new Date(block.end_time);
  return sum + (end - start) / (1000 * 60 * 60);
}, 0);
const availableHours = days.length * workHoursPerDay;
const oee = availableHours > 0 ? (totalBlockHours / availableHours) * 100 : 0;
```

**Issues identified:**

1. The OEE calculation is NOT capped at 100%
2. `totalBlockHours` counts the FULL duration of blocks even if they extend beyond the visible date range
3. Blocks are filtered by `machine_id` but not by the visible date range, so blocks outside the view contribute to OEE

### Required Code Changes

**File:** `components/schedule/MachineRow.js`

#### Change 1: Fix OEE calculation to only count hours within visible date range and cap at 100%

**Replace lines 21-28:**

```javascript
// OLD CODE (REMOVE):
const totalBlockHours = blocks.reduce((sum, block) => {
  const start = new Date(block.start_time);
  const end = new Date(block.end_time);
  return sum + (end - start) / (1000 * 60 * 60);
}, 0);
const availableHours = days.length * workHoursPerDay;
const oee = availableHours > 0 ? (totalBlockHours / availableHours) * 100 : 0;
```

**With:**

```javascript
// NEW CODE (ADD):
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
```

### Verification Steps

1. Generate a new production schedule
2. Verify no machine shows OEE > 100%
3. Change the date range and verify OEE recalculates correctly
4. Verify OEE is 0% for machines with no blocks in the visible range

---

## Bug 2: Production Blocks Visual Cramping/Overlap

### Problem Description

Production blocks in the graphical Gantt view are crammed very tightly together and overlap with other blocks. The text inside the blocks is unreadable.

### Root Cause Analysis

The `calculateBlockPosition()` function in `MachineRow.js` calculates block positions based on a 24-hour day (full calendar days), but production blocks only span work hours (06:00-22:00, which is 16 hours by default).

**Problem Location:** `components/schedule/MachineRow.js` lines 88-120

```javascript
// Current calculation uses 24-hour day span:
const rangeStart = new Date(days[0]);
rangeStart.setHours(0, 0, 0, 0);     // Midnight
const rangeEnd = new Date(days[days.length - 1]);
rangeEnd.setHours(23, 59, 59, 999);   // End of day

const totalMs = rangeEnd.getTime() - rangeStart.getTime(); // 24 hours * days
const leftPercent = ((visibleStart - rangeStart) / totalMs) * 100;
const widthPercent = ((visibleEnd - visibleStart) / totalMs) * 100;
```

**Issues identified:**

1. A 16-hour block (full work day) only occupies ~66% of the visual width (16/24 = 0.667)
2. Blocks starting at 06:00 don't align to the left edge of the day column
3. Multiple blocks on the same day compete for the same cramped space
4. The fixed `height: '40px'` and `top: '4px'` in `ProductionBlock.js` (line 39-40) leaves minimal vertical space

### Required Code Changes

**File:** `components/schedule/MachineRow.js`

#### Change 2: Update position calculation to use work hours instead of 24-hour days

**Replace the entire `calculateBlockPosition` function (lines 88-120):**

```javascript
// OLD FUNCTION (REMOVE):
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

**With:**

```javascript
// NEW FUNCTION (ADD):
// Work hour constants (should match schedule-generator.js)
const WORK_START_HOUR = 6;   // 06:00
const WORK_END_HOUR = 22;    // 22:00

function calculateBlockPosition(block, days, workHoursPerDay) {
  if (days.length === 0) return { left: 0, width: 0, display: 'none' };

  const blockStart = new Date(block.start_time);
  const blockEnd = new Date(block.end_time);

  // Define range boundaries (using work hours, not full 24-hour days)
  const rangeStartDate = new Date(days[0]);
  rangeStartDate.setHours(WORK_START_HOUR, 0, 0, 0);
  
  const rangeEndDate = new Date(days[days.length - 1]);
  rangeEndDate.setHours(WORK_END_HOUR, 0, 0, 0);

  // Check if block is completely outside visible range
  if (blockEnd <= rangeStartDate || blockStart >= rangeEndDate) {
    return { left: 0, width: 0, display: 'none' };
  }

  // Clamp block times to visible range
  const visibleStart = blockStart < rangeStartDate ? rangeStartDate : blockStart;
  const visibleEnd = blockEnd > rangeEndDate ? rangeEndDate : blockEnd;

  // Calculate position based on WORK HOURS only
  // Total work hours in the visible range
  const totalWorkHours = days.length * workHoursPerDay;
  const totalWorkMs = totalWorkHours * 60 * 60 * 1000;

  // Calculate the position within work hours
  // Need to convert absolute time to "work time" (ignoring non-work hours)
  const workMsFromStart = calculateWorkMilliseconds(rangeStartDate, visibleStart, days, workHoursPerDay);
  const blockWorkMs = calculateWorkMilliseconds(visibleStart, visibleEnd, days, workHoursPerDay);

  const leftPercent = (workMsFromStart / totalWorkMs) * 100;
  const widthPercent = (blockWorkMs / totalWorkMs) * 100;

  return {
    left: `${Math.max(0, leftPercent)}%`,
    width: `${Math.max(0.5, widthPercent)}%`, // Minimum 0.5% width so block is visible
  };
}

/**
 * Calculate work milliseconds between two dates
 * Only counts time during work hours (06:00-22:00)
 */
function calculateWorkMilliseconds(start, end, days, workHoursPerDay) {
  if (start >= end) return 0;
  
  let totalMs = 0;
  const current = new Date(start);
  const workHoursMs = workHoursPerDay * 60 * 60 * 1000;
  
  while (current < end) {
    const dayStart = new Date(current);
    dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
    
    const dayEnd = new Date(current);
    dayEnd.setHours(WORK_END_HOUR, 0, 0, 0);
    
    // If we're before work hours, jump to work start
    if (current < dayStart) {
      current.setTime(dayStart.getTime());
    }
    
    // If we're past work hours, jump to next day's work start
    if (current >= dayEnd) {
      current.setDate(current.getDate() + 1);
      current.setHours(WORK_START_HOUR, 0, 0, 0);
      continue;
    }
    
    // Calculate work time for this day
    const effectiveStart = current > dayStart ? current : dayStart;
    const effectiveEnd = end < dayEnd ? end : dayEnd;
    
    if (effectiveEnd > effectiveStart) {
      totalMs += effectiveEnd - effectiveStart;
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
    current.setHours(WORK_START_HOUR, 0, 0, 0);
  }
  
  return totalMs;
}
```

**File:** `components/schedule/ProductionBlock.js`

#### Change 3: Increase block height and adjust styling for better readability

**Replace lines 36-41:**

```javascript
// OLD CODE (REMOVE):
      style={{
        ...style,
        ...dragStyle,
        height: '40px',
        top: '4px',
      }}
```

**With:**

```javascript
// NEW CODE (ADD):
      style={{
        ...style,
        ...dragStyle,
        height: '42px',
        top: '3px',
        minWidth: '60px', // Ensure minimum readable width
      }}
```

**File:** `components/schedule/MachineRow.js`

#### Change 4: Increase row height to accommodate larger blocks

**Replace line 54:**

```javascript
// OLD CODE (REMOVE):
      <div className="flex-1 relative bg-zinc-800/20 min-h-[50px]">
```

**With:**

```javascript
// NEW CODE (ADD):
      <div className="flex-1 relative bg-zinc-800/20 min-h-[52px]">
```

### Verification Steps

1. Generate a production schedule with multiple blocks
2. Verify blocks now span the full width of their respective day columns
3. Verify text inside blocks is readable
4. Verify blocks don't overlap incorrectly
5. Test with blocks spanning multiple days

---

## Bug 3: Cannot Click on Production Blocks

### Problem Description

Clicking on production blocks does not open a popup/modal showing block details (start time, quantity, product, customer, etc.). The expected behavior per the brand guide and PRD is that clicking a block should open a detail panel/modal.

### Root Cause Analysis

The drag-and-drop listeners from `@dnd-kit/core` are capturing mouse events before the `onClick` handler can process them.

**Problem Location:** `components/schedule/ProductionBlock.js` lines 24-29

```javascript
// Current code - DnD listeners spread BEFORE onClick:
    <div
      ref={setNodeRef}
      {...listeners}      // <-- DnD listeners capture events first
      {...attributes}
      onClick={() => onClick?.(block)}  // <-- Never fires because DnD intercepts
```

The `useDraggable` hook's `listeners` object contains `onMouseDown`, `onTouchStart`, and other event handlers that intercept user interactions for drag detection. When spread before `onClick`, the DnD library may prevent the click event from firing, especially if:
- The library waits for a drag threshold before deciding if it's a drag or click
- The `onMouseDown` prevents default behavior
- The click happens too quickly or in a specific way

### Required Code Changes

**File:** `components/schedule/ProductionBlock.js`

#### Change 5: Fix click handling by using onPointerUp and preventing DnD from blocking clicks

**Replace the entire component (lines 1-54):**

```javascript
// OLD CODE (REMOVE ENTIRE FILE CONTENTS)
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

**With:**

```javascript
// NEW CODE (ADD):
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
        ...style,
        ...dragStyle,
        height: '42px',
        top: '3px',
        minWidth: '60px',
      }}
      role="button"
      tabIndex={0}
      aria-label={`Production block: ${block.product?.name || 'Product'}, ${formatNumber(block.batch_size)} units`}
    >
      <div className="px-2 py-1 truncate h-full flex flex-col justify-center pointer-events-none">
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

### Verification Steps

1. Generate a production schedule with blocks
2. Click on any production block
3. Verify the BlockEditModal opens showing:
   - Product name
   - Customer name
   - Batch size
   - Duration
   - Machine selection
   - Start/End time inputs
4. Verify you can still drag blocks to different machines
5. Test on touch devices if possible

---

## Summary of All File Changes

| File | Change Type | Lines Affected |
|------|-------------|----------------|
| `components/schedule/MachineRow.js` | Modify | Lines 21-28 (OEE calculation) |
| `components/schedule/MachineRow.js` | Modify | Line 54 (row height) |
| `components/schedule/MachineRow.js` | Replace | Lines 88-120 (position calculation function) |
| `components/schedule/MachineRow.js` | Add | New helper function `calculateWorkMilliseconds` |
| `components/schedule/ProductionBlock.js` | Replace | Entire file (click handling fix) |

---

## Testing Checklist

### OEE Bug Tests
- [ ] No machine shows OEE > 100% after schedule generation
- [ ] OEE updates correctly when date range changes
- [ ] OEE is 0% for machines with no blocks
- [ ] Global OEE in metrics bar is still correct

### Visual Cramping Bug Tests
- [ ] Blocks span appropriate width based on duration
- [ ] Blocks for a full work day (16 hours) span approximately one day column
- [ ] Multi-day blocks extend across multiple columns correctly
- [ ] Text inside blocks is readable
- [ ] Blocks don't overlap incorrectly on same machine
- [ ] Minimum block width ensures visibility for short blocks

### Click Interaction Bug Tests
- [ ] Clicking a block opens the BlockEditModal
- [ ] Modal shows correct block details (product, customer, batch size, times)
- [ ] Dragging a block still works (drag to different machine)
- [ ] Click vs drag is correctly differentiated (small movement = click, large = drag)
- [ ] Keyboard accessibility works (Enter/Space opens modal)
- [ ] Touch interaction works on mobile devices

---

## Implementation Order

1. **Fix OEE calculation first** (Bug 1) - Quick win, isolated change
2. **Fix click interaction** (Bug 3) - Improves UX, allows testing other changes
3. **Fix visual cramping** (Bug 2) - Most complex change, requires position calculation rewrite

---

## Notes for Implementation

- The work hour constants (`WORK_START_HOUR = 6`, `WORK_END_HOUR = 22`) should ideally be imported from a shared location or passed as props to ensure consistency with `schedule-generator.js`
- Consider adding these constants to a config file or the settings table for configurability
- The `calculateWorkMilliseconds` helper function is somewhat complex; consider adding unit tests
- After implementing these fixes, run the full application and generate a new schedule to verify all fixes work together

---

## Related Documentation

- `Docs/brand-guide.md` - See "Machine Schedule Components" section for expected UI behavior
- `Docs/prd.md` - See section 4.3 "Machine Schedule / Results Module" for functional requirements
- `Docs/database.md` - See `production_blocks` table definition for data structure

---

**Document Version:** 1.0  
**Created:** 2026-01-16  
**Status:** Ready for Implementation
