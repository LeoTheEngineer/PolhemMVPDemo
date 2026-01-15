/**
 * Utility Functions
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to YYYY-MM-DD
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Format a date to locale string
 */
export function formatDateLocale(date, locale = 'sv-SE') {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime to locale string
 */
export function formatDateTime(date, locale = 'sv-SE') {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a number with thousands separator
 */
export function formatNumber(num, locale = 'sv-SE') {
  if (num === null || num === undefined) return '';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format a number as currency (SEK)
 */
export function formatCurrency(num, locale = 'sv-SE') {
  if (num === null || num === undefined) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format a decimal as percentage
 */
export function formatPercent(num, decimals = 1) {
  if (num === null || num === undefined) return '';
  return `${(num * 100).toFixed(decimals)}%`;
}

/**
 * Calculate hours between two dates
 */
export function hoursBetween(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate - startDate;
  return diffMs / (1000 * 60 * 60);
}

/**
 * Add hours to a date
 */
export function addHours(date, hours) {
  const result = new Date(date);
  result.setTime(result.getTime() + hours * 60 * 60 * 1000);
  return result;
}

/**
 * Add days to a date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Start of day (00:00:00.000)
 */
export function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * End of day (23:59:59.999)
 */
export function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Set time of day preserving the date
 */
export function setTimeOfDay(date, hour, minute = 0) {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/**
 * Get week number from date (ISO week)
 */
export function getWeekNumber(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return weekNumber;
}

/**
 * Check if two date ranges overlap
 */
export function rangesOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();
  return s1 < e2 && s2 < e1;
}

/**
 * Generate an array of dates between start and end (inclusive)
 */
export function getDateRange(start, end) {
  const dates = [];
  const current = startOfDay(new Date(start));
  const endDate = startOfDay(new Date(end));
  
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate a unique ID (UUID v4)
 */
export function generateId() {
  return crypto.randomUUID();
}

/**
 * Safely parse JSON
 */
export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
}

/**
 * Sort array by key
 */
export function sortBy(array, key, direction = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];
    
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Clamp a number between min and max
 */
export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const today = new Date();
  const d = new Date(date);
  return d.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the past
 */
export function isPast(date) {
  return new Date(date) < new Date();
}

/**
 * Check if a date is in the future
 */
export function isFuture(date) {
  return new Date(date) > new Date();
}

/**
 * Calculate order status based on production blocks
 * 
 * Status logic:
 * - pending: No production block exists for this product
 * - scheduled: Has production block(s) but none are currently running
 * - in_production: Has a production block currently running AND cumulative quantity covers this order
 * - completed: Production block(s) finished and covered this order's quantity
 * - cancelled: Manually set by user (preserved)
 * 
 * @param {Object} order - The order (real or predicted)
 * @param {Array} allOrders - All orders for the same product, sorted by date
 * @param {Array} productionBlocks - Production blocks for the same product
 * @returns {string} - Calculated status
 */
export function calculateOrderStatus(order, allOrders, productionBlocks) {
  // If cancelled, preserve that status
  if (order.status === 'cancelled') {
    return 'cancelled';
  }

  // No production blocks = pending
  if (!productionBlocks || productionBlocks.length === 0) {
    return 'pending';
  }

  const now = new Date();
  const orderDate = new Date(order.due_date || order.predicted_date);
  const orderQuantity = order.quantity || order.predicted_quantity;

  // Sort orders by date to determine cumulative position
  const sortedOrders = [...allOrders].sort((a, b) => {
    const dateA = new Date(a.due_date || a.predicted_date);
    const dateB = new Date(b.due_date || b.predicted_date);
    return dateA - dateB;
  });

  // Calculate cumulative quantity up to and including this order
  let cumulativeQuantity = 0;
  for (const o of sortedOrders) {
    cumulativeQuantity += o.quantity || o.predicted_quantity || 0;
    if (o.id === order.id) break;
  }

  // Calculate total production capacity from blocks
  let completedProduction = 0;
  let inProgressProduction = 0;
  let scheduledProduction = 0;
  let hasActiveBlock = false;

  for (const block of productionBlocks) {
    const startTime = new Date(block.start_time);
    const endTime = new Date(block.end_time);
    const batchSize = block.batch_size || 0;

    if (endTime < now) {
      // Block is completed
      completedProduction += batchSize;
    } else if (startTime <= now && endTime >= now) {
      // Block is currently running
      inProgressProduction += batchSize;
      hasActiveBlock = true;
    } else if (startTime > now) {
      // Block is scheduled for future
      scheduledProduction += batchSize;
    }
  }

  // Determine status based on production coverage
  const totalAvailable = completedProduction + inProgressProduction;
  const totalPlanned = totalAvailable + scheduledProduction;

  // If completed production covers this order's cumulative need
  if (completedProduction >= cumulativeQuantity) {
    return 'completed';
  }

  // If there's an active block and total available covers this order
  if (hasActiveBlock && totalAvailable >= cumulativeQuantity) {
    return 'in_production';
  }

  // If total planned production covers this order
  if (totalPlanned >= cumulativeQuantity) {
    return 'scheduled';
  }

  // Not enough production planned
  return 'pending';
}

/**
 * Check if a predicted order is reliable (confidence >= 0.75)
 */
export function isReliablePrediction(order) {
  return order.confidence_score >= 0.75;
}

/**
 * Calculate statuses for all orders based on production blocks
 * Groups orders by product and calculates status for each
 * 
 * NOTE: Unreliable predicted orders (confidence < 0.75) are excluded from
 * status calculation - they are for visual reference only and won't be
 * included in production scheduling.
 * 
 * @param {Array} orders - All orders (real)
 * @param {Array} predictedOrders - All predicted orders
 * @param {Array} productionBlocks - All production blocks
 * @returns {Object} - Map of order ID to calculated status
 */
export function calculateAllOrderStatuses(orders, predictedOrders, productionBlocks) {
  const statusMap = {};
  
  // Filter out unreliable predictions - they don't participate in status calculation
  const reliablePredictions = predictedOrders.filter(isReliablePrediction);
  
  // Combine real orders with reliable predictions only
  const allOrdersCombined = [
    ...orders.map(o => ({ ...o, _type: 'real' })),
    ...reliablePredictions.map(o => ({ ...o, _type: 'predicted' })),
  ];

  // Group by product
  const ordersByProduct = groupBy(allOrdersCombined, 'product_id');
  const blocksByProduct = groupBy(productionBlocks, 'product_id');

  // Calculate status for each order
  for (const [productId, productOrders] of Object.entries(ordersByProduct)) {
    const productBlocks = blocksByProduct[productId] || [];
    
    for (const order of productOrders) {
      statusMap[order.id] = calculateOrderStatus(order, productOrders, productBlocks);
    }
  }

  return statusMap;
}
