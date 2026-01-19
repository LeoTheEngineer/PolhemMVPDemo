/**
 * Debug script to test block position calculation
 * Run with: node test/debug-block-position.js
 */

// Work hour constants
const WORK_START_HOUR = 6;   // 06:00
const WORK_END_HOUR = 22;    // 22:00

// Simulate getDateRange
function getDateRange(start, end) {
  const dates = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Parse an ISO date string and extract date/time components
 * This treats the time as "intended local time" regardless of timezone
 */
function parseBlockTime(isoString) {
  const match = isoString.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return new Date(isoString);
  
  const [, year, month, day, hour, minute] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    0,
    0
  );
}

// The actual calculation function (same as in MachineRow.js)
function calculateBlockPosition(block, days, workHoursPerDay) {
  if (days.length === 0) return { left: 0, width: 0, display: 'none' };

  const blockStart = parseBlockTime(block.start_time);
  const blockEnd = parseBlockTime(block.end_time);
  
  console.log(`\n  Block: ${block.start_time} to ${block.end_time}`);
  console.log(`  Parsed: ${blockStart.toISOString()} to ${blockEnd.toISOString()}`);
  console.log(`  Local:  ${blockStart.toString()} to ${blockEnd.toString()}`);
  
  const blockStartDate = new Date(blockStart.getFullYear(), blockStart.getMonth(), blockStart.getDate());
  const blockEndDate = new Date(blockEnd.getFullYear(), blockEnd.getMonth(), blockEnd.getDate());
  
  const firstDay = new Date(days[0]);
  firstDay.setHours(0, 0, 0, 0);
  const lastDay = new Date(days[days.length - 1]);
  lastDay.setHours(23, 59, 59, 999);
  
  console.log(`  Days range: ${firstDay.toDateString()} to ${lastDay.toDateString()}`);
  console.log(`  Block date range: ${blockStartDate.toDateString()} to ${blockEndDate.toDateString()}`);
  
  if (blockEndDate < firstDay || blockStartDate > lastDay) {
    console.log(`  HIDDEN: Block outside visible range`);
    return { left: 0, width: 0, display: 'none' };
  }

  const dayWidthPercent = 100 / days.length;
  const workHoursMs = workHoursPerDay * 60 * 60 * 1000;

  let leftPercent = null;
  let rightPercent = 0;

  for (let i = 0; i < days.length; i++) {
    const dayDate = new Date(days[i]);
    dayDate.setHours(0, 0, 0, 0);
    
    const dayWorkStart = new Date(dayDate);
    dayWorkStart.setHours(WORK_START_HOUR, 0, 0, 0);
    const dayWorkEnd = new Date(dayDate);
    dayWorkEnd.setHours(WORK_END_HOUR, 0, 0, 0);

    if (blockEnd <= dayWorkStart || blockStart >= dayWorkEnd) {
      continue;
    }

    const overlapStart = blockStart > dayWorkStart ? blockStart : dayWorkStart;
    const overlapEnd = blockEnd < dayWorkEnd ? blockEnd : dayWorkEnd;
    
    const dayStartOffset = Math.max(0, Math.min(1, (overlapStart - dayWorkStart) / workHoursMs));
    const dayEndOffset = Math.max(0, Math.min(1, (overlapEnd - dayWorkStart) / workHoursMs));
    
    const blockLeftInDay = i * dayWidthPercent + dayStartOffset * dayWidthPercent;
    const blockRightInDay = i * dayWidthPercent + dayEndOffset * dayWidthPercent;

    console.log(`  Day ${i} (${dayDate.toDateString()}): overlap ${dayStartOffset.toFixed(2)} to ${dayEndOffset.toFixed(2)} -> left: ${blockLeftInDay.toFixed(2)}%, right: ${blockRightInDay.toFixed(2)}%`);

    if (leftPercent === null) {
      leftPercent = blockLeftInDay;
    }
    
    rightPercent = blockRightInDay;
  }

  if (leftPercent === null) {
    console.log(`  HIDDEN: No overlap found`);
    return { left: 0, width: 0, display: 'none' };
  }

  const widthPercent = rightPercent - leftPercent;

  const result = {
    left: `${Math.max(0, Math.min(100, leftPercent))}%`,
    width: `${Math.max(0.5, Math.min(100 - leftPercent, widthPercent))}%`,
  };
  
  console.log(`  RESULT: left=${result.left}, width=${result.width}`);
  return result;
}

// Test with sample data
console.log('='.repeat(60));
console.log('BLOCK POSITION DEBUG TEST');
console.log('='.repeat(60));

// Create a date range: Jan 17 to Jan 31 (15 days)
const startDate = '2026-01-17';
const endDate = '2026-01-31';
const days = getDateRange(startDate, endDate);

console.log(`\nDate Range: ${startDate} to ${endDate}`);
console.log(`Days array (${days.length} days):`);
days.forEach((d, i) => console.log(`  [${i}] ${d.toDateString()}`));

// Test blocks
const testBlocks = [
  // Block on Jan 17, full day
  { start_time: '2026-01-17T06:00:00.000Z', end_time: '2026-01-17T22:00:00.000Z', name: 'Jan 17 full day (UTC)' },
  
  // Block on Jan 23, full day
  { start_time: '2026-01-23T06:00:00.000Z', end_time: '2026-01-23T22:00:00.000Z', name: 'Jan 23 full day (UTC)' },
  
  // Block spanning Jan 20-21
  { start_time: '2026-01-20T06:00:00.000Z', end_time: '2026-01-21T22:00:00.000Z', name: 'Jan 20-21 (UTC)' },
  
  // Block from database example (with T05:00 which is T06:00 local in UTC+1)
  { start_time: '2026-01-16T05:00:00.000Z', end_time: '2026-01-16T21:00:00.000Z', name: 'Jan 16 database example (UTC)' },
];

console.log('\n' + '='.repeat(60));
console.log('TESTING BLOCKS');
console.log('='.repeat(60));

testBlocks.forEach(block => {
  console.log(`\n--- ${block.name} ---`);
  calculateBlockPosition(block, days, 16);
});

console.log('\n' + '='.repeat(60));
console.log('EXPECTED POSITIONS:');
console.log('='.repeat(60));
console.log(`
Each day = ${(100/15).toFixed(2)}% width (100% / 15 days)

Jan 17 full day: should be at left=0%, width=6.67%
Jan 23 full day: should be at left=40% (day index 6 * 6.67%), width=6.67%
Jan 20-21: should span days 3-4, left=20%, width=13.33%
Jan 16: should be HIDDEN (before range starts)
`);

console.log('Done.');
