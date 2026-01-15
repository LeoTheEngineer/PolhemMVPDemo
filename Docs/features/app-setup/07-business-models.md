# 07 - Business Models

## Purpose

Create simplified business logic models for the demo. These models handle:
- Storage cost calculations
- Machine preparation time
- Order forecasting
- Schedule generation (sequential assignment)

**Note:** These are simplified implementations for demo purposes. Production versions would use statistical models and optimization algorithms.

---

## Prerequisites

- `06-api-routes.md` completed
- API routes ready to use the models

---

## Files to Create

```
models/
├── storage-cost.js       # Storage cost calculations
├── machine-prep.js       # Machine setup time calculations
├── order-forecast.js     # Order prediction utilities
└── schedule-generator.js # Schedule generation algorithm
```

---

## Implementation

### Step 1: Create `models/storage-cost.js`

```javascript
/**
 * Storage Cost Model (Simplified for Demo)
 * 
 * Calculates the cost of storing finished goods.
 * Demo version uses simple linear calculations.
 */

/**
 * Calculate storage cost for a batch
 * @param {Object} params
 * @param {number} params.quantity - Number of units
 * @param {number} params.storageCostPerDay - Cost per unit per day
 * @param {number} params.daysInStorage - Days until delivery
 * @returns {Object} Storage cost breakdown
 */
export function calculateStorageCost({
  quantity,
  storageCostPerDay = 0.50,
  daysInStorage = 0,
}) {
  // Simple linear calculation
  const totalCost = quantity * storageCostPerDay * daysInStorage;
  
  return {
    quantity,
    storageCostPerDay,
    daysInStorage,
    totalCost: Math.round(totalCost * 100) / 100,
    costPerUnit: Math.round((totalCost / quantity) * 100) / 100,
  };
}

/**
 * Calculate capital tied up in inventory
 * @param {Object} params
 * @param {number} params.quantity - Number of units
 * @param {number} params.unitCost - Cost per unit (material + production)
 * @param {number} params.interestRate - Annual interest rate (decimal)
 * @param {number} params.daysInStorage - Days in storage
 * @returns {Object} Capital cost breakdown
 */
export function calculateCapitalCost({
  quantity,
  unitCost,
  interestRate = 0.035,
  daysInStorage = 0,
}) {
  const totalValue = quantity * unitCost;
  const dailyRate = interestRate / 365;
  const capitalCost = totalValue * dailyRate * daysInStorage;
  
  return {
    totalValue: Math.round(totalValue * 100) / 100,
    capitalCost: Math.round(capitalCost * 100) / 100,
    dailyInterestCost: Math.round(totalValue * dailyRate * 100) / 100,
  };
}

/**
 * Calculate total holding cost (storage + capital)
 */
export function calculateTotalHoldingCost({
  quantity,
  storageCostPerDay,
  unitCost,
  interestRate,
  daysInStorage,
}) {
  const storage = calculateStorageCost({ quantity, storageCostPerDay, daysInStorage });
  const capital = calculateCapitalCost({ quantity, unitCost, interestRate, daysInStorage });
  
  return {
    storageCost: storage.totalCost,
    capitalCost: capital.capitalCost,
    totalCost: Math.round((storage.totalCost + capital.capitalCost) * 100) / 100,
    daysInStorage,
  };
}
```

---

### Step 2: Create `models/machine-prep.js`

```javascript
/**
 * Machine Preparation Model (Simplified for Demo)
 * 
 * Calculates setup times and machine compatibility.
 * Demo version uses constant base times.
 */

// Default setup time in minutes
const DEFAULT_SETUP_TIME = 45;

/**
 * Calculate setup time for a production run
 * Demo version: Returns constant setup time
 * @param {Object} params
 * @param {Object} params.product - Product being produced
 * @param {Object} params.machine - Machine being used
 * @param {Object} params.previousProduct - Previously produced product (optional)
 * @returns {Object} Setup time breakdown
 */
export function calculateSetupTime({
  product,
  machine,
  previousProduct = null,
  defaultSetupMinutes = DEFAULT_SETUP_TIME,
}) {
  // Demo: Use constant setup time
  // Production would calculate based on material changes, temperature differences, etc.
  
  let setupMinutes = defaultSetupMinutes;
  const breakdown = [];
  
  // Base setup time
  breakdown.push({ type: 'base_setup', minutes: 30 });
  
  // Quality check always required
  breakdown.push({ type: 'quality_check', minutes: 15 });
  
  return {
    totalMinutes: setupMinutes,
    totalHours: Math.round((setupMinutes / 60) * 100) / 100,
    breakdown,
  };
}

/**
 * Check if a machine is compatible with a product
 * @param {Object} machine - Machine to check
 * @param {Object} product - Product to produce
 * @returns {Object} Compatibility result
 */
export function checkMachineCompatibility(machine, product) {
  const issues = [];
  let compatible = true;
  
  // Check if product's compatible_machines includes this machine
  if (product.compatible_machines && product.compatible_machines.length > 0) {
    if (!product.compatible_machines.includes(machine.id)) {
      issues.push({
        type: 'not_in_compatible_list',
        message: `Machine ${machine.code} is not in product's compatible machines list`,
      });
      compatible = false;
    }
  }
  
  // Check pressure
  if (product.required_pressure && machine.max_pressure) {
    if (product.required_pressure > machine.max_pressure) {
      issues.push({
        type: 'pressure',
        message: `Required pressure ${product.required_pressure} exceeds machine max ${machine.max_pressure}`,
      });
      compatible = false;
    }
  }
  
  // Check temperature
  if (product.required_temperature && machine.max_temperature) {
    if (product.required_temperature > machine.max_temperature) {
      issues.push({
        type: 'temperature',
        message: `Required temperature ${product.required_temperature} exceeds machine max ${machine.max_temperature}`,
      });
      compatible = false;
    }
  }
  
  return {
    compatible,
    issues,
    machineId: machine.id,
    machineCode: machine.code,
    productId: product.id,
  };
}

/**
 * Get list of compatible machines for a product
 * @param {Object} product - Product to check
 * @param {Array} machines - Available machines
 * @returns {Array} Compatible machines
 */
export function getCompatibleMachines(product, machines) {
  return machines.filter(machine => {
    const result = checkMachineCompatibility(machine, product);
    return result.compatible;
  });
}

/**
 * Calculate production time for a batch
 * @param {Object} params
 * @param {number} params.quantity - Batch size
 * @param {number} params.cycleTime - Seconds per cycle
 * @param {number} params.cavityCount - Cavities in mold
 * @param {number} params.setupMinutes - Setup time in minutes
 * @returns {Object} Production time breakdown
 */
export function calculateProductionTime({
  quantity,
  cycleTime,
  cavityCount = 1,
  setupMinutes = DEFAULT_SETUP_TIME,
}) {
  // Calculate number of shots needed
  const shots = Math.ceil(quantity / cavityCount);
  
  // Production time in minutes
  const productionMinutes = (shots * cycleTime) / 60;
  
  // Total time including setup
  const totalMinutes = productionMinutes + setupMinutes;
  
  return {
    shots,
    productionMinutes: Math.round(productionMinutes),
    setupMinutes,
    totalMinutes: Math.round(totalMinutes),
    totalHours: Math.round((totalMinutes / 60) * 100) / 100,
  };
}
```

---

### Step 3: Create `models/order-forecast.js`

```javascript
/**
 * Order Forecast Model (Simplified for Demo)
 * 
 * Utilities for working with order predictions.
 * Demo version uses pre-seeded predictions, no actual forecasting.
 */

/**
 * Check if a prediction is reliable based on confidence threshold
 * @param {number} confidenceScore - Prediction confidence (0-1)
 * @param {number} threshold - Minimum threshold (default from settings)
 * @returns {boolean} Whether prediction is reliable
 */
export function isReliablePrediction(confidenceScore, threshold = 0.75) {
  return confidenceScore >= threshold;
}

/**
 * Calculate prediction error percentage
 * Demo version: Returns the confidence score inverted
 * @param {Object} prediction - Predicted order
 * @returns {number} Error percentage (0-100)
 */
export function calculatePredictionError(prediction) {
  // Error is inverse of confidence
  const error = (1 - prediction.confidence_score) * 100;
  return Math.round(error * 100) / 100;
}

/**
 * Get quantity range for a prediction
 * @param {Object} prediction - Predicted order
 * @returns {Object} Min, expected, max quantities
 */
export function getPredictionRange(prediction) {
  const expected = prediction.predicted_quantity;
  const errorRate = 1 - prediction.confidence_score;
  
  return {
    min: Math.round(expected * (1 - errorRate)),
    expected,
    max: Math.round(expected * (1 + errorRate)),
    errorPercent: Math.round(errorRate * 100),
  };
}

/**
 * Combine real orders and predictions for timeline display
 * @param {Array} orders - Real orders
 * @param {Array} predictions - Predicted orders
 * @param {number} errorThreshold - Max error % for reliable predictions
 * @returns {Array} Combined and sorted timeline items
 */
export function combineOrdersAndPredictions(orders, predictions, errorThreshold = 25) {
  const combined = [];
  
  // Add real orders
  orders.forEach(order => {
    combined.push({
      id: order.id,
      type: 'real',
      customer_id: order.customer_id,
      product_id: order.product_id,
      quantity: order.quantity,
      date: order.due_date,
      status: order.status,
      confidence: 1.0,
      isReliable: true,
      customer: order.customer,
      product: order.product,
    });
  });
  
  // Add predictions
  predictions.forEach(pred => {
    const errorPercent = calculatePredictionError(pred);
    const reliable = errorPercent <= errorThreshold;
    
    combined.push({
      id: pred.id,
      type: 'predicted',
      customer_id: pred.customer_id,
      product_id: pred.product_id,
      quantity: pred.predicted_quantity,
      date: pred.predicted_date,
      status: pred.basis,
      confidence: pred.confidence_score,
      isReliable: reliable,
      errorPercent,
      range: getPredictionRange(pred),
      customer: pred.customer,
      product: pred.product,
    });
  });
  
  // Sort by date
  combined.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return combined;
}

/**
 * Filter orders by customer and product
 * @param {Array} items - Combined orders/predictions
 * @param {string} customerId - Filter by customer (optional)
 * @param {string} productId - Filter by product (optional)
 * @returns {Array} Filtered items
 */
export function filterOrders(items, customerId = null, productId = null) {
  return items.filter(item => {
    if (customerId && item.customer_id !== customerId) return false;
    if (productId && item.product_id !== productId) return false;
    return true;
  });
}
```

---

### Step 4: Create `models/schedule-generator.js`

This is the main schedule generation algorithm using **sequential machine assignment**.

**Key Feature:** Blocks that exceed a single work day are automatically split across multiple days. For example, a 48-hour production run with 16 work hours per day will be scheduled as:
- Day 1: 06:00 - 22:00 (16 hours)
- Day 2: 06:00 - 22:00 (16 hours)
- Day 3: 06:00 - 22:00 (16 hours)

```javascript
/**
 * Schedule Generator (Simplified for Demo)
 * 
 * Generates production schedule using sequential machine assignment.
 * No optimization - just assigns orders to first compatible machine.
 * 
 * KEY FEATURE: Automatically splits long production runs across multiple
 * work days, respecting work hour boundaries (default: 06:00 - 22:00).
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
  
  // Combine orders and reliable predictions
  const allOrders = [
    ...orders.map(o => ({ ...o, isReal: true })),
    ...predictedOrders
      .filter(p => {
        const errorPercent = (1 - p.confidence_score) * 100;
        return errorPercent <= prediction_error_threshold;
      })
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
```

---

## Folder Structure Commands

Create the models directory if it doesn't exist:

```bash
mkdir -p models
```

---

## Verification

1. **Check files exist:**
   ```bash
   ls -la models/
   ```
   Should show: `storage-cost.js`, `machine-prep.js`, `order-forecast.js`, `schedule-generator.js`

2. **Test imports (in Node.js):**
   ```javascript
   // Test in a Node.js file or REPL
   import { calculateStorageCost } from './models/storage-cost.js';
   import { calculateSetupTime } from './models/machine-prep.js';
   import { combineOrdersAndPredictions } from './models/order-forecast.js';
   import { generateSchedule, calculateScheduleMetrics } from './models/schedule-generator.js';
   
   console.log(calculateStorageCost({ quantity: 1000, storageCostPerDay: 0.5, daysInStorage: 5 }));
   ```

---

## Usage in API Routes

The schedule generator is used in `/api/production-blocks/generate`:

```javascript
import { generateSchedule, calculateScheduleMetrics } from '@/models/schedule-generator';

// Generate schedule
const blocks = generateSchedule({
  orders,
  predictedOrders,
  machines,
  products,
  settings,
});

// Calculate metrics
const metrics = calculateScheduleMetrics(blocks, machines, settings);
```

---

## Next Step

Proceed to `08-layout-components.md` to create the Sidebar, Header, and Dashboard layout.
