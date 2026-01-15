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
