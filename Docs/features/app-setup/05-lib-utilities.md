# 05 - Library Utilities

## Purpose

Create the ES Module wrapper for the existing `Modules/supabase.js` and utility functions used throughout the application.

---

## Prerequisites

- `04-seed-data-updates.md` completed
- Environment variables configured in `.env.local`
- `01-critical-fixes.md` applied to `Modules/supabase.js`

---

## Files to Create/Edit

```
lib/
├── supabase.js      # ES Module wrapper for Modules/supabase.js (REPLACE db.js)
├── utils.js         # General utility functions (UPDATE existing)
└── constants.js     # Application constants (UPDATE existing)
```

---

## Step 0: Clean Up Existing Files

**Important:** Remove and replace existing files to avoid conflicts:

```bash
# Delete duplicate database module
rm lib/db.js
```

**Note:** The existing `lib/utils.js` and `lib/constants.js` files are incomplete. The code below will **completely replace** their contents with the full implementation needed for the application.

---

## Implementation

### Step 1: Create `lib/supabase.js`

This file wraps the existing CommonJS `Modules/supabase.js` and re-exports its functions as ES Modules for use in Next.js API routes and Server Components.

Create the file `lib/supabase.js`:

```javascript
/**
 * Supabase Client - ES Module Wrapper
 * 
 * This module wraps the existing CommonJS module at Modules/supabase.js
 * and re-exports all functions as ES Modules for use in Next.js.
 * 
 * The underlying module handles:
 * - Connection pooling and singleton pattern
 * - Retry logic with exponential backoff
 * - Batch operations with chunking
 * - RPC function wrappers for SQL functions
 */

// Import the CommonJS module using createRequire for ESM compatibility
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const supabaseModule = require('../Modules/supabase');

// ============================================
// RE-EXPORT CORE FUNCTIONS
// ============================================

/**
 * Get the Supabase client instance (singleton)
 * Uses service role key - bypasses RLS
 */
export const getSupabaseClient = supabaseModule.getSupabaseClient;

/**
 * Generate a BigInt-based row ID
 */
export const generateSupabaseRowId = supabaseModule.generateSupabaseRowId;

/**
 * Delay utility function
 */
export const delay = supabaseModule.delay;

/**
 * Create a rate limiter using Bottleneck
 */
export const createLimiter = supabaseModule.createLimiter;

// ============================================
// RE-EXPORT CRUD OPERATIONS
// ============================================

/**
 * Create a single row in a table
 */
export const createRow = supabaseModule.createRow;

/**
 * Insert multiple rows by IDs
 */
export const insertRows = supabaseModule.insertRows;

/**
 * Read specific columns from a single row
 */
export const readRowCols = supabaseModule.readRowCols;

/**
 * Read multiple rows by IDs in batches
 */
export const readRowsBatch = supabaseModule.readRowsBatch;

/**
 * Read all rows with filters and pagination
 */
export const readAllRowsCols = supabaseModule.readAllRowsCols;

/**
 * Read all rows from a table (simple version)
 */
export const readAllRowsColsSingle = supabaseModule.readAllRowsColsSingle;

/**
 * Update a single row
 */
export const updateRow = supabaseModule.updateRow;

/**
 * Upsert multiple rows
 */
export const upsertRows = supabaseModule.upsertRows;

/**
 * Delete a single row
 */
export const deleteRow = supabaseModule.deleteRow;

/**
 * Delete multiple rows by IDs
 */
export const deleteRows = supabaseModule.deleteRows;

// ============================================
// RE-EXPORT SETTINGS OPERATIONS
// ============================================

/**
 * Read application settings (monolith pattern - single row)
 */
export const readSettings = supabaseModule.readSettings;

/**
 * Update application settings
 */
export const updateSettings = supabaseModule.updateSettings;

// ============================================
// RE-EXPORT POLHEM MVP RPC FUNCTIONS
// These wrap SQL functions defined in sql/functions.sql
// ============================================

/**
 * Get total order quantity within a date range
 */
export const getOrdersQuantityByDateRange = supabaseModule.getOrdersQuantityByDateRange;

/**
 * Get total production quantity within a time range
 */
export const getProductionQuantityByTimeRange = supabaseModule.getProductionQuantityByTimeRange;

/**
 * Calculate machine OEE for a specific date
 */
export const getMachineOEE = supabaseModule.getMachineOEE;

/**
 * Calculate OEE for all machines on a specific date
 */
export const getAllMachinesOEE = supabaseModule.getAllMachinesOEE;

/**
 * Calculate projected stock for a product at a future date
 */
export const calculateProjectedStock = supabaseModule.calculateProjectedStock;

/**
 * Calculate projected stock for all products at a future date
 */
export const calculateAllProductsProjectedStock = supabaseModule.calculateAllProductsProjectedStock;

/**
 * Find a matching predicted order based on time proximity
 */
export const findMatchingPredictedOrder = supabaseModule.findMatchingPredictedOrder;

/**
 * Match an order to a predicted order
 */
export const matchOrderToPrediction = supabaseModule.matchOrderToPrediction;

/**
 * Regenerate the entire production schedule (transactional)
 */
export const regenerateSchedule = supabaseModule.regenerateSchedule;

/**
 * Get orders with full product and customer details
 */
export const getOrdersWithDetails = supabaseModule.getOrdersWithDetails;

/**
 * Get production blocks with product, machine, and customer details
 */
export const getProductionBlocksWithDetails = supabaseModule.getProductionBlocksWithDetails;

/**
 * Get dashboard summary statistics
 */
export const getDashboardSummary = supabaseModule.getDashboardSummary;

/**
 * Update product stock after production completion
 */
export const updateProductStock = supabaseModule.updateProductStock;

// ============================================
// CONVENIENCE WRAPPER FUNCTIONS
// Simplified versions for common operations
// ============================================

/**
 * Get all rows from a table
 * @param {string} table - Table name
 * @returns {Promise<Array>} Array of rows
 */
export async function getAllRows(table) {
  const result = await readAllRowsColsSingle(table, '*');
  return result.success || [];
}

/**
 * Get a single row by ID
 * @param {string} table - Table name
 * @param {string} id - Row ID
 * @returns {Promise<Object|null>} Row data or null
 */
export async function getRowById(table, id) {
  const result = await readRowCols(table, id, '*');
  return result.success || null;
}

/**
 * Get rows with a simple filter
 * @param {string} table - Table name
 * @param {string} column - Column to filter on
 * @param {any} value - Value to match
 * @returns {Promise<Array>} Array of matching rows
 */
export async function getRowsWhere(table, column, value) {
  const result = await readAllRowsCols(table, '*', {
    filterCols: [{ col: column, value }],
  }, false);
  return result.success || [];
}

/**
 * Insert a single row and return it
 * @param {string} table - Table name
 * @param {Object} data - Row data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function insertRow(table, data) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  
  if (error) {
    console.error(`Error inserting into ${table}:`, error);
    return { data: null, error };
  }
  
  return { data: result, error: null };
}

/**
 * Update a row by ID and return it
 * @param {string} table - Table name
 * @param {string} id - Row ID
 * @param {Object} data - Update data
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function updateRowById(table, id, data) {
  const supabase = getSupabaseClient();
  const { data: result, error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error(`Error updating ${table}:`, error);
    return { data: null, error };
  }
  
  return { data: result, error: null };
}

/**
 * Delete a row by ID
 * @param {string} table - Table name
 * @param {string} id - Row ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function deleteRowById(table, id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting from ${table}:`, error);
    return { success: false, error };
  }
  
  return { success: true, error: null };
}

// ============================================
// QUERY HELPERS WITH JOINS
// ============================================

/**
 * Get orders with product and customer info
 * @param {Object} filters - Optional filters (status, customer_id, etc.)
 * @returns {Promise<Array>}
 */
export async function getOrdersWithJoins(filters = {}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('orders')
    .select(`
      *,
      customer:customers(id, name),
      product:products(id, name, sku, cycle_time, cavity_count, material_id, compatible_machines)
    `);
  
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { data, error } = await query.order('due_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching orders with joins:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get predicted orders with product and customer info
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function getPredictedOrdersWithJoins(filters = {}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('predicted_orders')
    .select(`
      *,
      customer:customers(id, name),
      product:products(id, name, sku, cycle_time, cavity_count, material_id, compatible_machines)
    `);
  
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { data, error } = await query.order('predicted_date', { ascending: true });
  
  if (error) {
    console.error('Error fetching predicted orders with joins:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get products with customer and material info
 * @returns {Promise<Array>}
 */
export async function getProductsWithJoins() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      customer:customers(id, name),
      material:materials(id, name, cost_per_kg)
    `)
    .order('name');
  
  if (error) {
    console.error('Error fetching products with joins:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get production blocks with machine, product, and customer info
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>}
 */
export async function getProductionBlocksWithJoins(filters = {}) {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('production_blocks')
    .select(`
      *,
      machine:machines(id, name, code, hourly_rate, status),
      product:products(id, name, sku, cycle_time, cavity_count, compatible_machines),
      customer:customers(id, name)
    `);
  
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  
  const { data, error } = await query.order('start_time', { ascending: true });
  
  if (error) {
    console.error('Error fetching production blocks with joins:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get application settings
 * @returns {Promise<Object|null>}
 */
export async function getSettings() {
  const result = await readSettings();
  return result.success || null;
}

// ============================================
// EXPORT WRAPPED SUPABASE CLIENT CREATOR
// For direct query access when needed
// ============================================

/**
 * Create a Supabase client for server-side use
 * Alias for getSupabaseClient for naming consistency with Next.js conventions
 */
export const createServerClient = getSupabaseClient;
```

---

### Step 2: Replace `lib/utils.js`

**Replace the entire contents** of `lib/utils.js` with:

```javascript
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
```

---

### Step 3: Replace `lib/constants.js`

**Replace the entire contents** of `lib/constants.js` with:

```javascript
/**
 * Application Constants
 */

// ============================================
// ORDER STATUS
// ============================================

export const ORDER_STATUS = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  IN_PRODUCTION: 'in_production',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.SCHEDULED]: 'Scheduled',
  [ORDER_STATUS.IN_PRODUCTION]: 'In Production',
  [ORDER_STATUS.COMPLETED]: 'Completed',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

export const ORDER_STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: 'bg-yellow-500/20 text-yellow-400',
  [ORDER_STATUS.SCHEDULED]: 'bg-blue-500/20 text-blue-400',
  [ORDER_STATUS.IN_PRODUCTION]: 'bg-accent/20 text-accent',
  [ORDER_STATUS.COMPLETED]: 'bg-green-500/20 text-green-400',
  [ORDER_STATUS.CANCELLED]: 'bg-red-500/20 text-red-400',
};

// ============================================
// ORDER INTERVALS (for predicted orders)
// ============================================

export const ORDER_INTERVALS = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly',
};

export const ORDER_INTERVAL_LABELS = {
  [ORDER_INTERVALS.DAILY]: 'Daily',
  [ORDER_INTERVALS.WEEKLY]: 'Weekly',
  [ORDER_INTERVALS.BIWEEKLY]: 'Bi-weekly',
  [ORDER_INTERVALS.MONTHLY]: 'Monthly',
  [ORDER_INTERVALS.QUARTERLY]: 'Quarterly',
  [ORDER_INTERVALS.YEARLY]: 'Yearly',
};

export const ORDER_INTERVAL_DAYS = {
  [ORDER_INTERVALS.DAILY]: 1,
  [ORDER_INTERVALS.WEEKLY]: 7,
  [ORDER_INTERVALS.BIWEEKLY]: 14,
  [ORDER_INTERVALS.MONTHLY]: 30,
  [ORDER_INTERVALS.QUARTERLY]: 90,
  [ORDER_INTERVALS.YEARLY]: 365,
};

// ============================================
// MACHINE STATUS
// ============================================

export const MACHINE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  OFFLINE: 'offline',
};

export const MACHINE_STATUS_LABELS = {
  [MACHINE_STATUS.AVAILABLE]: 'Available',
  [MACHINE_STATUS.IN_USE]: 'In Use',
  [MACHINE_STATUS.MAINTENANCE]: 'Maintenance',
  [MACHINE_STATUS.OFFLINE]: 'Offline',
};

export const MACHINE_STATUS_COLORS = {
  [MACHINE_STATUS.AVAILABLE]: 'bg-green-500/20 text-green-400',
  [MACHINE_STATUS.IN_USE]: 'bg-blue-500/20 text-blue-400',
  [MACHINE_STATUS.MAINTENANCE]: 'bg-yellow-500/20 text-yellow-400',
  [MACHINE_STATUS.OFFLINE]: 'bg-red-500/20 text-red-400',
};

// ============================================
// PREDICTION CONFIDENCE
// ============================================

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.75,   // >= 75% confidence (reliable)
  MEDIUM: 0.5,  // >= 50% confidence
  LOW: 0,       // < 50% confidence (unreliable)
};

export const CONFIDENCE_COLORS = {
  HIGH: 'bg-green-500/20 text-green-400',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400',
  LOW: 'bg-red-500/20 text-red-400',
};

export function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

export function getConfidenceColor(score) {
  return CONFIDENCE_COLORS[getConfidenceLevel(score)];
}

export function isReliablePrediction(score) {
  return score >= CONFIDENCE_THRESHOLDS.HIGH;
}

// ============================================
// TIME CONSTANTS
// ============================================

export const WORK_HOURS = {
  START: 6,     // 06:00
  END: 22,      // 22:00
  PER_DAY: 16,  // 16 hours per work day
};

export const DEFAULT_SETUP_TIME_MINUTES = 45;

// ============================================
// UI CONSTANTS
// ============================================

export const DATE_RANGE_PRESETS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
];

export const PRIORITY_OPTIONS = [
  { value: 1, label: '1 - Highest' },
  { value: 2, label: '2 - High' },
  { value: 3, label: '3 - Medium-High' },
  { value: 4, label: '4 - Medium' },
  { value: 5, label: '5 - Normal' },
  { value: 6, label: '6 - Low-Medium' },
  { value: 7, label: '7 - Low' },
  { value: 8, label: '8 - Lower' },
  { value: 9, label: '9 - Lowest' },
  { value: 10, label: '10 - Background' },
];

// ============================================
// NAVIGATION
// ============================================

export const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: 'ClipboardList',
  },
  {
    label: 'Schedule',
    href: '/schedule',
    icon: 'Calendar',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'Settings',
  },
];

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  CUSTOMERS: '/api/customers',
  MATERIALS: '/api/materials',
  MACHINES: '/api/machines',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  PREDICTED_ORDERS: '/api/predicted-orders',
  FORECASTS: '/api/forecasts',
  PRODUCTION_BLOCKS: '/api/production-blocks',
  SETTINGS: '/api/settings',
  HEALTH: '/api/health',
};

// ============================================
// ERROR MESSAGES
// ============================================

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION: 'Please check your input and try again.',
  NETWORK: 'Network error. Please check your connection.',
};
```

---

## Verification

1. **Check files exist:**
   ```bash
   ls -la lib/
   ```
   Should show: `supabase.js`, `utils.js`, `constants.js`

2. **Verify syntax (ES Modules need to be tested via Next.js):**
   The files will be validated when used by API routes in the next step.

3. **Test the wrapper imports work:**
   After creating the API routes, the application should start without import errors:
   ```bash
   npm run dev
   ```

---

## Usage Examples

```javascript
// In an API route (app/api/orders/route.js)
import { 
  getSupabaseClient, 
  getAllRows, 
  getOrdersWithJoins,
  insertRow,
  updateRowById,
  deleteRowById,
} from '@/lib/supabase';
import { formatDate, formatNumber } from '@/lib/utils';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '@/lib/constants';

// Get all customers using convenience wrapper
const customers = await getAllRows('customers');

// Get orders with related data
const orders = await getOrdersWithJoins({ status: 'pending' });

// Direct Supabase client for complex queries
const supabase = getSupabaseClient();
const { data } = await supabase
  .from('orders')
  .select('*')
  .gte('due_date', '2026-01-01')
  .order('due_date');

// Insert new row
const { data: newOrder, error } = await insertRow('orders', {
  customer_id: customerId,
  product_id: productId,
  quantity: 1000,
  due_date: '2026-02-15',
});

// Update existing row
const { data: updated } = await updateRowById('orders', orderId, {
  status: 'scheduled',
});
```

---

## Key Design Decisions

1. **Wrapper Pattern:** We wrap `Modules/supabase.js` rather than replacing it to preserve:
   - Retry logic with exponential backoff
   - Batch operations with chunking
   - Rate limiting capabilities
   - RPC function wrappers for SQL functions

2. **Dual API:** We provide both:
   - Re-exported functions from the base module (full functionality)
   - Convenience wrappers (simpler API for common operations)

3. **Named Exports:** All functions use named exports for better tree-shaking and IDE autocomplete.

4. **Server-Side Only:** The `createServerClient` function uses the service role key and should only be used in API routes and Server Components, never in client-side code.

---

## Next Step

Proceed to `06-api-routes.md` to create all API route implementations.
