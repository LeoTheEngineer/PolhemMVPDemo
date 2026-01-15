# 01 - Critical Fixes

## Purpose

Fix critical bugs in the existing `Modules/supabase.js` file before proceeding with application setup.

---

## Prerequisites

- None (this is the first file to execute)

---

## Issues to Fix

| Issue | Location | Problem | Solution |
|-------|----------|---------|----------|
| Hardcoded URL | Line 14 | Supabase URL is hardcoded | Use environment variable |
| Non-existent exports | Lines 1166-1181 | Exports functions that don't exist | Remove invalid exports |

**Note:** We are keeping `SUPABASE_SECRET` as the environment variable name since that's what the file currently uses.

---

## Files to Edit

- `Modules/supabase.js`

---

## Implementation

### Step 1: Fix `getSupabaseClient` Function

Open `Modules/supabase.js` and find the `getSupabaseClient` function (around lines 12-19):

**Find this code:**

```javascript
function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = 'https://boykydnuccagduvzjsmg.supabase.co';
        console.log('Supabase Key:', process.env.SUPABASE_SECRET ? 'Loaded' : 'UNDEFINED');
        supabase = createClient(supabaseUrl, process.env.SUPABASE_SECRET);
    }
    return supabase;
}
```

**Replace with:**

```javascript
function getSupabaseClient() {
    if (!supabase) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SECRET;
        
        if (!supabaseUrl) {
            console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
            throw new Error('Supabase configuration incomplete. Set NEXT_PUBLIC_SUPABASE_URL in .env.local');
        }
        
        if (!supabaseKey) {
            console.error('Missing SUPABASE_SECRET environment variable');
            throw new Error('Supabase configuration incomplete. Set SUPABASE_SECRET in .env.local');
        }
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('Supabase URL:', supabaseUrl ? 'Loaded' : 'UNDEFINED');
            console.log('Supabase Key:', supabaseKey ? 'Loaded' : 'UNDEFINED');
        }
        
        supabase = createClient(supabaseUrl, supabaseKey);
    }
    return supabase;
}
```

---

### Step 2: Remove Non-Existent Exports

Find the `module.exports` section at the bottom of the file (around lines 1163-1198):

**Find this code:**

```javascript
module.exports = {
    getSupabaseClient,
    generateSupabaseRowId,
    readGlobalData,
    updateGlobalData,
    createRow,
    insertRows,
    readRowCols,
    readRowsBatch,
    readAllRowsCols,
    readAllRowsColsSingle,
    updateRow,
    upsertRows,
    deleteRow,
    deleteRows,
    incrementSessions,
    incrementPageLoads,
    readBestProductOffer,
    updateProductsVariantData,
    readSettings,
    updateSettings,
    // Polhem MVP specific functions
    getOrdersQuantityByDateRange,
    getProductionQuantityByTimeRange,
    getMachineOEE,
    getAllMachinesOEE,
    calculateProjectedStock,
    calculateAllProductsProjectedStock,
    findMatchingPredictedOrder,
    matchOrderToPrediction,
    regenerateSchedule,
    getOrdersWithDetails,
    getProductionBlocksWithDetails,
    getDashboardSummary,
    updateProductStock,
};
```

**Replace with (removing non-existent functions):**

```javascript
module.exports = {
    // Core Supabase utilities
    getSupabaseClient,
    generateSupabaseRowId,
    delay,
    createLimiter,
    
    // Basic CRUD operations
    createRow,
    insertRows,
    readRowCols,
    readRowsBatch,
    readAllRowsCols,
    readAllRowsColsSingle,
    updateRow,
    upsertRows,
    deleteRow,
    deleteRows,
    
    // Settings operations
    readSettings,
    updateSettings,
    
    // Polhem MVP specific functions (RPC wrappers)
    getOrdersQuantityByDateRange,
    getProductionQuantityByTimeRange,
    getMachineOEE,
    getAllMachinesOEE,
    calculateProjectedStock,
    calculateAllProductsProjectedStock,
    findMatchingPredictedOrder,
    matchOrderToPrediction,
    regenerateSchedule,
    getOrdersWithDetails,
    getProductionBlocksWithDetails,
    getDashboardSummary,
    updateProductStock,
};
```

**Functions removed (they don't exist in the file):**
- `readGlobalData`
- `updateGlobalData`
- `incrementSessions`
- `incrementPageLoads`
- `readBestProductOffer`
- `updateProductsVariantData`

---

## Verification

After making the changes, verify:

1. **No syntax errors:**
   ```bash
   node -c Modules/supabase.js
   ```
   Should output: `Modules/supabase.js: ok`

2. **Exports are valid:**
   ```bash
   node -e "const m = require('./Modules/supabase.js'); console.log('Exports:', Object.keys(m).length);"
   ```
   Should output: `Exports: 28` (or similar count, no errors)

3. **Required functions exist:**
   ```bash
   node -e "const m = require('./Modules/supabase.js'); console.log('getSupabaseClient:', typeof m.getSupabaseClient);"
   ```
   Should output: `getSupabaseClient: function`

---

## Summary of Changes

| Change | Before | After |
|--------|--------|-------|
| Supabase URL | Hardcoded | Uses `NEXT_PUBLIC_SUPABASE_URL` env var (required) |
| Console logging | Always logs | Only logs in non-production |
| Error handling | None | Throws clear error if URL or key missing |
| Exports | 6 non-existent functions | Removed invalid exports |

---

## Next Step

Proceed to `02-environment-setup.md` to configure the environment variables.
