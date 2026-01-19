/**
 * Test Script: Analyze Production Blocks in Database
 * 
 * This script checks for potential issues with production blocks:
 * 1. Blocks with batch_size = 0 (continuation blocks - expected behavior)
 * 2. Duplicate blocks on same machine/day
 * 3. Overlapping time ranges
 * 4. Missing customer/product relationships
 * 
 * Run with: node test/analyze-production-blocks.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables. Make sure .env.local exists with:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  SUPABASE_SECRET=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeProductionBlocks() {
  console.log('='.repeat(60));
  console.log('PRODUCTION BLOCKS ANALYSIS');
  console.log('='.repeat(60));
  console.log('');

  // Fetch all production blocks with joins
  const { data: blocks, error } = await supabase
    .from('production_blocks')
    .select(`
      *,
      machine:machines(id, name, code),
      product:products(id, name, sku),
      customer:customers(id, name)
    `)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching production blocks:', error);
    return;
  }

  console.log(`Total production blocks: ${blocks.length}`);
  console.log('');

  // Analysis 1: Blocks with batch_size = 0 (continuation blocks)
  console.log('-'.repeat(60));
  console.log('1. CONTINUATION BLOCKS (batch_size = 0)');
  console.log('-'.repeat(60));
  
  const zeroBlocks = blocks.filter(b => b.batch_size === 0);
  const nonZeroBlocks = blocks.filter(b => b.batch_size > 0);
  
  console.log(`Blocks with batch_size > 0: ${nonZeroBlocks.length} (primary blocks)`);
  console.log(`Blocks with batch_size = 0: ${zeroBlocks.length} (continuation blocks)`);
  console.log('');
  
  if (zeroBlocks.length > 0) {
    console.log('NOTE: batch_size = 0 blocks are EXPECTED behavior.');
    console.log('These are continuation blocks for orders spanning multiple days.');
    console.log('The schedule generator sets batch_size = 0 for 2nd, 3rd, etc. blocks');
    console.log('of a multi-day order (see schedule-generator.js lines 183-184, 226).');
    console.log('');
    console.log('Sample continuation blocks:');
    zeroBlocks.slice(0, 5).forEach(b => {
      const start = new Date(b.start_time);
      const end = new Date(b.end_time);
      const hours = (end - start) / (1000 * 60 * 60);
      console.log(`  - Machine: ${b.machine?.code || 'N/A'}, Product: ${b.product?.name || 'N/A'}`);
      console.log(`    Time: ${start.toISOString().slice(0, 16)} to ${end.toISOString().slice(0, 16)} (${hours.toFixed(1)}h)`);
    });
  }
  console.log('');

  // Analysis 2: Check for duplicate blocks (same machine, product, overlapping times)
  console.log('-'.repeat(60));
  console.log('2. POTENTIAL DUPLICATE/OVERLAPPING BLOCKS');
  console.log('-'.repeat(60));
  
  const overlaps = [];
  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i];
      const b = blocks[j];
      
      // Same machine?
      if (a.machine_id !== b.machine_id) continue;
      
      const aStart = new Date(a.start_time).getTime();
      const aEnd = new Date(a.end_time).getTime();
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      
      // Check for overlap
      if (aStart < bEnd && aEnd > bStart) {
        overlaps.push({ blockA: a, blockB: b });
      }
    }
  }
  
  if (overlaps.length === 0) {
    console.log('No overlapping blocks found on same machine.');
  } else {
    console.log(`Found ${overlaps.length} overlapping block pairs:`);
    overlaps.slice(0, 5).forEach(({ blockA, blockB }) => {
      console.log(`  Machine: ${blockA.machine?.code}`);
      console.log(`    Block A: ${blockA.product?.name}, ${blockA.batch_size} units`);
      console.log(`      ${blockA.start_time} - ${blockA.end_time}`);
      console.log(`    Block B: ${blockB.product?.name}, ${blockB.batch_size} units`);
      console.log(`      ${blockB.start_time} - ${blockB.end_time}`);
    });
  }
  console.log('');

  // Analysis 3: Blocks per day per machine
  console.log('-'.repeat(60));
  console.log('3. BLOCKS PER DAY PER MACHINE');
  console.log('-'.repeat(60));
  
  const blocksByMachineDay = {};
  blocks.forEach(b => {
    const day = b.start_time.slice(0, 10);
    const key = `${b.machine?.code || b.machine_id}-${day}`;
    if (!blocksByMachineDay[key]) {
      blocksByMachineDay[key] = [];
    }
    blocksByMachineDay[key].push(b);
  });
  
  const multiBlockDays = Object.entries(blocksByMachineDay)
    .filter(([_, blocks]) => blocks.length > 1)
    .sort((a, b) => b[1].length - a[1].length);
  
  console.log(`Days with multiple blocks on same machine: ${multiBlockDays.length}`);
  if (multiBlockDays.length > 0) {
    console.log('Top 5 days with most blocks:');
    multiBlockDays.slice(0, 5).forEach(([key, dayBlocks]) => {
      console.log(`  ${key}: ${dayBlocks.length} blocks`);
      dayBlocks.forEach(b => {
        const start = new Date(b.start_time);
        const end = new Date(b.end_time);
        console.log(`    - ${b.product?.name || 'N/A'}: ${b.batch_size} units (${start.toTimeString().slice(0,5)}-${end.toTimeString().slice(0,5)})`);
      });
    });
  }
  console.log('');

  // Analysis 4: Missing relationships
  console.log('-'.repeat(60));
  console.log('4. MISSING RELATIONSHIPS');
  console.log('-'.repeat(60));
  
  const missingMachine = blocks.filter(b => !b.machine);
  const missingProduct = blocks.filter(b => !b.product);
  const missingCustomer = blocks.filter(b => !b.customer);
  
  console.log(`Blocks with missing machine: ${missingMachine.length}`);
  console.log(`Blocks with missing product: ${missingProduct.length}`);
  console.log(`Blocks with missing customer: ${missingCustomer.length}`);
  console.log('');

  // Analysis 5: Block duration statistics
  console.log('-'.repeat(60));
  console.log('5. BLOCK DURATION STATISTICS');
  console.log('-'.repeat(60));
  
  const durations = blocks.map(b => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return (end - start) / (1000 * 60 * 60); // hours
  });
  
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  console.log(`Average block duration: ${avgDuration.toFixed(2)} hours`);
  console.log(`Minimum block duration: ${minDuration.toFixed(2)} hours`);
  console.log(`Maximum block duration: ${maxDuration.toFixed(2)} hours`);
  
  const shortBlocks = blocks.filter(b => {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return (end - start) / (1000 * 60 * 60) < 1; // less than 1 hour
  });
  console.log(`Blocks shorter than 1 hour: ${shortBlocks.length}`);
  console.log('');

  // Summary
  console.log('='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log('');
  console.log('The batch_size = 0 blocks are NOT a bug - they are continuation');
  console.log('blocks for multi-day orders. The UI should handle them differently:');
  console.log('  - Show "(cont.)" or similar indicator instead of "0 units"');
  console.log('  - Or hide the units display for continuation blocks');
  console.log('');
  
  if (overlaps.length > 0) {
    console.log('WARNING: Found overlapping blocks - this may indicate a bug');
    console.log('in schedule generation or manual editing.');
  }
  
  console.log('');
  console.log('Done.');
}

analyzeProductionBlocks().catch(console.error);
