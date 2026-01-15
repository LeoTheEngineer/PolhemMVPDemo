/**
 * Schedule Generator (Simplified for Demo)
 * 
 * Generates production schedule using sequential machine assignment.
 * No optimization - just assigns orders to first compatible machine.
 * 
 * KEY FEATURE: Automatically splits long production runs across multiple
 * work days, respecting work hour boundaries (default: 06:00 - 22:00).
 * 
 * NOTE: Only reliable predicted orders (confidence >= 75%) are included
 * in schedule generation. Unreliable predictions are for visual reference only.
 */

import { checkMachineCompatibility, calculateProductionTime } from './machine-prep';

// Work hour constants
const WORK_START_HOUR = 6;  // 06:00
const WORK_END_HOUR = 22;   // 22:00

/**
 * Generate production schedule
 * @param {Object} params
 * @param {Array} params.orders - Real orders to schedule
 * @param {Array} params.predictedOrders - Predicted orders (optional)
 * @param {Array} params.machines - Available machines
 * @param {Array} params.products - Product data
 * @param {Object} params.settings - Application settings
 * @returns {Array} Production blocks
 */
export function generateSchedule({
  orders = [],
  predictedOrders = [],
  machines = [],
  products = [],
  settings = {},
}) {
  const blocks = [];
  const {
    setup_time_minutes = 45,
    work_hours_per_day = 16,
    delivery_buffer_days = 2,
    prediction_error_threshold = 25,
  } = settings;
  
  // Track machine availability (end time of last block per machine)
  const machineEndTimes = {};
  machines.forEach(m => {
    machineEndTimes[m.id] = new Date();
    // Start from beginning of today's work hours (06:00)
    machineEndTimes[m.id].setHours(WORK_START_HOUR, 0, 0, 0);
  });
  
  // Combine orders and reliable predictions only
  // Unreliable predictions (confidence < 75%) are excluded from scheduling
  const RELIABILITY_THRESHOLD = 0.75;
  
  const allOrders = [
    ...orders.map(o => ({ ...o, isReal: true })),
    ...predictedOrders
      .filter(p => p.confidence_score >= RELIABILITY_THRESHOLD)
      .map(p => ({
        id: p.id,
        customer_id: p.customer_id,
        product_id: p.product_id,
        quantity: p.predicted_quantity,
        due_date: p.predicted_date,
        product: p.product,
        isReal: false,
      })),
  ];
  
  // Sort by due date, then by priority
  allOrders.sort((a, b) => {
    const dateA = new Date(a.due_date);
    const dateB = new Date(b.due_date);
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA - dateB;
    }
    return (a.priority || 5) - (b.priority || 5);
  });
  
  // Process each order
  for (const order of allOrders) {
    // Get product data
    const product = order.product || products.find(p => p.id === order.product_id);
    if (!product) continue;
    
    // Find compatible machines
    const compatibleMachines = machines.filter(machine => {
      // Check if product specifies compatible machines
      if (product.compatible_machines && product.compatible_machines.length > 0) {
        return product.compatible_machines.includes(machine.id);
      }
      // Otherwise check basic compatibility
      const result = checkMachineCompatibility(machine, product);
      return result.compatible;
    });
    
    if (compatibleMachines.length === 0) {
      console.warn(`No compatible machine for product ${product.name}`);
      continue;
    }
    
    // Find machine with earliest availability (sequential assignment)
    let selectedMachine = compatibleMachines[0];
    let earliestTime = machineEndTimes[selectedMachine.id];
    
    for (const machine of compatibleMachines) {
      const endTime = machineEndTimes[machine.id];
      if (endTime < earliestTime) {
        earliestTime = endTime;
        selectedMachine = machine;
      }
    }
    
    // Calculate total production time needed
    const productionTime = calculateProductionTime({
      quantity: order.quantity,
      cycleTime: product.cycle_time || 20,
      cavityCount: product.cavity_count || 1,
      setupMinutes: setup_time_minutes,
    });
    
    // Get start time, adjusted to work hours
    let currentStart = adjustToWorkHours(new Date(machineEndTimes[selectedMachine.id]));
    
    // Split into work-day-sized blocks
    const orderBlocks = createMultiDayBlocks({
      totalMinutes: productionTime.totalMinutes,
      startTime: currentStart,
      machineId: selectedMachine.id,
      productId: product.id,
      customerId: order.customer_id,
      batchSize: order.quantity,
      setupMinutes: setup_time_minutes,
      workHoursPerDay: work_hours_per_day,
      product,
      machine: selectedMachine,
    });
    
    // Add all blocks for this order
    blocks.push(...orderBlocks);
    
    // Update machine availability to end of last block
    if (orderBlocks.length > 0) {
      machineEndTimes[selectedMachine.id] = new Date(orderBlocks[orderBlocks.length - 1].end_time);
    }
  }
  
  return blocks;
}

/**
 * Adjust a time to be within work hours
 * If before work start, move to work start
 * If after work end, move to next day's work start
 */
function adjustToWorkHours(time) {
  const result = new Date(time);
  
  // If before work hours, move to start of work day
  if (result.getHours() < WORK_START_HOUR) {
    result.setHours(WORK_START_HOUR, 0, 0, 0);
  }
  
  // If after work hours, move to next day's work start
  if (result.getHours() >= WORK_END_HOUR) {
    result.setDate(result.getDate() + 1);
    result.setHours(WORK_START_HOUR, 0, 0, 0);
  }
  
  return result;
}

/**
 * Create multiple production blocks for orders that span multiple work days
 * 
 * Example: 48-hour order with 16 work hours/day becomes:
 * - Block 1: Day 1, 06:00-22:00 (16 hours)
 * - Block 2: Day 2, 06:00-22:00 (16 hours)
 * - Block 3: Day 3, 06:00-22:00 (16 hours)
 * 
 * The batch_size is kept on the FIRST block only (the total order quantity).
 * Subsequent blocks have batch_size = 0 to indicate they're continuations.
 */
function createMultiDayBlocks({
  totalMinutes,
  startTime,
  machineId,
  productId,
  customerId,
  batchSize,
  setupMinutes,
  workHoursPerDay,
  product,
  machine,
}) {
  const blocks = [];
  const workMinutesPerDay = workHoursPerDay * 60;
  let remainingMinutes = totalMinutes;
  let currentStart = new Date(startTime);
  let isFirstBlock = true;
  
  while (remainingMinutes > 0) {
    // Ensure we start within work hours
    currentStart = adjustToWorkHours(currentStart);
    
    // Calculate how many minutes until end of work day
    const workDayEnd = new Date(currentStart);
    workDayEnd.setHours(WORK_END_HOUR, 0, 0, 0);
    const minutesUntilDayEnd = (workDayEnd - currentStart) / (1000 * 60);
    
    // Determine this block's duration (min of remaining time and day capacity)
    const blockMinutes = Math.min(remainingMinutes, minutesUntilDayEnd);
    
    // Calculate end time for this block
    const blockEnd = new Date(currentStart.getTime() + blockMinutes * 60 * 1000);
    
    // Create the block
    const block = {
      machine_id: machineId,
      product_id: productId,
      customer_id: customerId,
      // Only the first block carries the full batch size
      // Subsequent blocks are continuations with batch_size = 0
      batch_size: isFirstBlock ? batchSize : 0,
      start_time: currentStart.toISOString(),
      end_time: blockEnd.toISOString(),
      // Only first block has setup time
      setup_time_minutes: isFirstBlock ? setupMinutes : 0,
      estimated_cost: isFirstBlock 
        ? calculateEstimatedCost(batchSize, product, machine)
        : 0,
    };
    
    blocks.push(block);
    
    // Update for next iteration
    remainingMinutes -= blockMinutes;
    isFirstBlock = false;
    
    // Next block starts at end of this one (will be adjusted to next work day if needed)
    currentStart = new Date(blockEnd);
    
    // If we ended at work day end, move to next day's work start
    if (currentStart.getHours() >= WORK_END_HOUR) {
      currentStart.setDate(currentStart.getDate() + 1);
      currentStart.setHours(WORK_START_HOUR, 0, 0, 0);
    }
  }
  
  return blocks;
}

/**
 * Calculate estimated cost for a production block
 */
function calculateEstimatedCost(quantity, product, machine) {
  const materialCost = (product.weight_per_unit || 0) * (product.material?.cost_per_kg || 2.5) * quantity / 1000;
  const productionHours = (quantity / (product.cavity_count || 1)) * (product.cycle_time || 20) / 3600;
  const laborCost = productionHours * (machine.hourly_rate || 150);
  
  return Math.round((materialCost + laborCost) * 100) / 100;
}

/**
 * Calculate schedule metrics
 * @param {Array} blocks - Production blocks
 * @param {Array} machines - All machines
 * @param {Object} settings - Settings with work hours
 * @returns {Object} Schedule metrics
 */
export function calculateScheduleMetrics(blocks, machines, settings) {
  const { work_hours_per_day = 16 } = settings;
  
  if (!blocks || blocks.length === 0) {
    return {
      total_oee: 0,
      total_production_hours: 0,
      total_setup_hours: 0,
      total_blocks: 0,
      machines_used: 0,
      machine_oee: {},
      estimated_revenue: 0,
      work_days: 0,
      has_manual_edits: false,
      last_calculated_at: new Date().toISOString(),
    };
  }
  
  // Calculate total production hours
  let totalProductionMinutes = 0;
  const machineStats = {};
  
  blocks.forEach(block => {
    const startTime = new Date(block.start_time);
    const endTime = new Date(block.end_time);
    const minutes = (endTime - startTime) / (1000 * 60);
    totalProductionMinutes += minutes;
    
    // Track per machine
    if (!machineStats[block.machine_id]) {
      machineStats[block.machine_id] = { productionMinutes: 0, setupMinutes: 0, blocks: 0 };
    }
    machineStats[block.machine_id].productionMinutes += minutes;
    machineStats[block.machine_id].setupMinutes += block.setup_time_minutes || 0;
    machineStats[block.machine_id].blocks += 1;
  });
  
  // Calculate date range from blocks
  const minDate = new Date(Math.min(...blocks.map(b => new Date(b.start_time))));
  const maxDate = new Date(Math.max(...blocks.map(b => new Date(b.end_time))));
  
  // Calculate number of work days (at least 1)
  const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  const workDays = Math.max(1, Math.ceil(daysDiff) + 1); // +1 because both start and end day count
  
  // Available hours = machines * work days * hours per day
  const availableMinutes = machines.length * workDays * work_hours_per_day * 60;
  
  // Calculate OEE (capped at 100%)
  const totalOEE = availableMinutes > 0 
    ? Math.min(100, Math.round((totalProductionMinutes / availableMinutes) * 100 * 10) / 10)
    : 0;
  
  // Per-machine OEE
  const machineOEE = {};
  machines.forEach(m => {
    const stats = machineStats[m.id] || { productionMinutes: 0 };
    const machineAvailable = workDays * work_hours_per_day * 60;
    machineOEE[m.id] = machineAvailable > 0
      ? Math.min(100, Math.round((stats.productionMinutes / machineAvailable) * 100 * 10) / 10)
      : 0;
  });
  
  // Estimate revenue (simple: quantity * avg price)
  // Only count blocks with batch_size > 0 (first blocks of multi-day orders)
  const estimatedRevenue = blocks
    .filter(b => b.batch_size > 0)
    .reduce((sum, b) => sum + (b.batch_size * 5), 0); // Assume 5 SEK per unit
  
  // Total setup time
  const totalSetupMinutes = blocks.reduce((sum, b) => sum + (b.setup_time_minutes || 0), 0);
  
  return {
    total_oee: totalOEE,
    total_production_hours: Math.round(totalProductionMinutes / 60 * 10) / 10,
    total_setup_hours: Math.round(totalSetupMinutes / 60 * 10) / 10,
    total_blocks: blocks.length,
    machines_used: Object.keys(machineStats).length,
    machine_oee: machineOEE,
    estimated_revenue: estimatedRevenue,
    work_days: workDays,
    has_manual_edits: false,
    last_calculated_at: new Date().toISOString(),
  };
}

/**
 * Update schedule metrics after manual edit
 * Call this when a block is moved/modified
 */
export function recalculateMetricsAfterEdit(blocks, machines, settings) {
  const metrics = calculateScheduleMetrics(blocks, machines, settings);
  metrics.has_manual_edits = true;
  return metrics;
}
