# Execution Plan: UI/UX Improvements & Bug Fixes
**Version:** 2.1  
**Date:** 2026-01-19  
**Status:** Code Review Complete - Ready for Implementation  
**Author:** Root Cause Analysis by Claude Code

---

## Code Review Summary (CTO Review)

### Issues Found & Corrected:

1. **NaN Fix Edge Case**: The proposed `safeParseFloat` returns a fallback when empty, but this means the input will show the fallback value (e.g., "0") instead of being empty. **CORRECTED:** Allow empty string to be preserved for better UX.

2. **Auto-regeneration Race Condition**: The proposed `useEffect` with `setTimeout` in SchedulePageClient could cause memory leaks if the component unmounts. **CORRECTED:** Added proper cleanup.

3. **Missing `cn` import**: The auto-regenerate toggle code uses `cn()` but doesn't verify the import exists. **VERIFIED:** Import exists at line 5 of ModelSettings.js - wait, it doesn't! Need to add it.

4. **Database Migration Security**: The SQL migrations are safe - adding columns with defaults doesn't affect existing data.

5. **API Flag Setting**: The pattern to set `needs_regeneration` flag after mutations is safe but needs error handling to not break the main operation if flag update fails.

6. **Regeneration Banner Position**: With `fixed top-0 left-64`, the banner overlaps the main content area correctly but needs `z-50` to ensure it appears above other content.

7. **HourlyModal Height Calculation**: Using `TOTAL_HOURS * 32` pixels assumes 16 work hours (6-22). **VERIFIED:** Matches constants.

### Security Review:
- No SQL injection risks (using Supabase parameterized queries)
- No XSS vulnerabilities (React auto-escapes)
- No authentication bypasses (Clerk middleware protects all routes)
- Rate limiting already in place on all API routes
- No sensitive data exposure in new code

### Consistency Check:
- All new components follow existing patterns
- All new API modifications follow the established rate-limit + try/catch pattern
- Styling uses existing Tailwind classes and zinc color scheme

---

## Executive Summary

This document provides a complete execution plan for implementing all requested changes from the feedback analysis. Each change includes:
- Root cause analysis (where applicable)
- Exact file paths and line numbers
- Precise code changes required
- Rationale for the approach

**Total Changes:** 12 major features/fixes across multiple files

---

## Table of Contents

1. [Critical Bug Fixes](#1-critical-bug-fixes)
   - 1.1 NaN Error in Error Threshold Input
   - 1.2 Hydration Mismatch Warning
2. [Navigation Restructuring](#2-navigation-restructuring)
   - 2.1 Remove "Data Management" from Sidebar
   - 2.2 Create New "Data" Tab
   - 2.3 Restructure Settings Tab (Model Settings Only)
3. [Orders Tab Restructuring](#3-orders-tab-restructuring)
   - 3.1 Create Sub-tabs: Timeline, Orders, Predicted Orders
   - 3.2 Update Order Cards (Gray, No Colors, Simplified)
   - 3.3 Remove "Add Prediction" Button
4. [Settings Improvements](#4-settings-improvements)
   - 4.1 Rename "Error Threshold" to "Reliability Threshold"
   - 4.2 Add "Automatic Generation" Setting
   - 4.3 Remove rates/hour from Machines Table
5. [Schedule Tab Improvements](#5-schedule-tab-improvements)
   - 5.1 Simplify Machine Row Labels (ID Only, Clickable)
   - 5.2 Machine Details Popup
   - 5.3 Google Calendar-style Blocks in HourlyModal
   - 5.4 Regenerate Button State (Disabled When No Changes)
   - 5.5 Regeneration Banner System
6. [Dashboard Cleanup](#6-dashboard-cleanup)
   - 6.1 Compact Layout, Unified Icon Colors
   - 6.2 Remove Excess Padding

---

## 1. Critical Bug Fixes

### 1.1 NaN Error in Error Threshold Input

**Error Message:**
```
Received NaN for the `value` attribute. If this is expected, cast the value to a string.
```

**Root Cause:**
In `components/settings/ModelSettings.js`, when a user clears an input field, `parseFloat("")` returns `NaN`, which is then stored in state and passed to the input's `value` prop.

**File:** `components/settings/ModelSettings.js`

**Current Code (Lines 59-64):**
```javascript
onChange={(e) =>
  setFormData({
    ...formData,
    prediction_error_threshold: parseFloat(e.target.value),
  })
}
```

**Fix:** Create a safe parse function and apply to ALL numeric inputs in this file. The function should preserve empty strings during editing but provide a fallback for truly invalid values.

**Changes Required:**

```javascript
// ADD at top of file (after imports, before component):

/**
 * Safely parse a float value from input.
 * Returns empty string if input is empty (for UX during editing).
 * Returns fallback if value is NaN after parsing.
 */
const safeParseFloat = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safely parse an integer value from input.
 * Returns empty string if input is empty (for UX during editing).
 * Returns fallback if value is NaN after parsing.
 */
const safeParseInt = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};
```

**IMPORTANT:** Also update `handleSave` to ensure empty strings become proper values before API call:

```javascript
const handleSave = async () => {
  setLoading(true);

  // Ensure all values are numbers before saving (convert empty strings to defaults)
  const dataToSave = {
    prediction_error_threshold: formData.prediction_error_threshold === '' ? 25 : formData.prediction_error_threshold,
    storage_cost_per_m3: formData.storage_cost_per_m3 === '' ? 0 : formData.storage_cost_per_m3,
    employee_cost_per_hour: formData.employee_cost_per_hour === '' ? 0 : formData.employee_cost_per_hour,
    interest_rate: formData.interest_rate === '' ? 0 : formData.interest_rate,
    delivery_buffer_days: formData.delivery_buffer_days === '' ? 2 : formData.delivery_buffer_days,
    setup_time_minutes: formData.setup_time_minutes === '' ? 45 : formData.setup_time_minutes,
    work_hours_per_day: formData.work_hours_per_day === '' ? 16 : formData.work_hours_per_day,
    shifts_per_day: formData.shifts_per_day === '' ? 2 : formData.shifts_per_day,
    auto_regenerate: formData.auto_regenerate || false,
  };

  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataToSave),
    });
    // ... rest of function
```

**Apply to these lines:**
| Line | Field | Current | Change To |
|------|-------|---------|-----------|
| 62 | prediction_error_threshold | `parseFloat(e.target.value)` | `safeParseFloat(e.target.value, 0)` |
| 85 | storage_cost_per_m3 | `parseFloat(e.target.value)` | `safeParseFloat(e.target.value, 0)` |
| 98 | employee_cost_per_hour | `parseFloat(e.target.value)` | `safeParseFloat(e.target.value, 0)` |
| 112 | interest_rate | `parseFloat(e.target.value)` | `safeParseFloat(e.target.value, 0)` |
| 131 | delivery_buffer_days | `parseInt(e.target.value)` | `safeParseInt(e.target.value, 0)` |
| 143 | setup_time_minutes | `parseInt(e.target.value)` | `safeParseInt(e.target.value, 0)` |
| 156 | work_hours_per_day | `parseInt(e.target.value)` | `safeParseInt(e.target.value, 1)` |
| 169 | shifts_per_day | `parseInt(e.target.value)` | `safeParseInt(e.target.value, 1)` |

---

### 1.2 Hydration Mismatch Warning

**Error Message:**
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

**Root Cause:**
The Clerk provider injects `style` attributes on the `<html>` element that differ between server and client rendering. This is caused by browser extensions or Clerk's internal state management.

**File:** `app/layout.js`

**Current Code (Line 23):**
```jsx
<html lang="en" className="dark">
```

**Fix:** Add `suppressHydrationWarning` to the html element.

**New Code:**
```jsx
<html lang="en" className="dark" suppressHydrationWarning>
```

**Note:** This is a known Next.js pattern for handling third-party providers that modify the HTML element.

---

## 2. Navigation Restructuring

### 2.1 Remove "Data Management" from Sidebar

**File:** `components/layout/Sidebar.js`

**Current Code (Lines 24-29):**
```javascript
const secondaryNav = [
  { name: 'Products', href: '/settings?tab=products', icon: Package },
  { name: 'Machines', href: '/settings?tab=machines', icon: Factory },
  { name: 'Materials', href: '/settings?tab=materials', icon: Boxes },
  { name: 'Customers', href: '/settings?tab=customers', icon: Users },
];
```

**Current Code (Lines 71-85):**
```jsx
<div className="mb-4 mt-8">
  <p className="px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
    Data Management
  </p>
</div>
{secondaryNav.map((item) => (
  // ... rendering secondary nav items
))}
```

**Change:** Remove the entire `secondaryNav` array and the "Data Management" section JSX.

**Delete:**
- Lines 24-29 (secondaryNav array)
- Lines 71-85 (Data Management header and map)

---

### 2.2 Create New "Data" Tab

**File:** `components/layout/Sidebar.js`

**Update navigation array (Lines 17-22):**

**Current:**
```javascript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

**New:**
```javascript
const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Data', href: '/data', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

**Add import:** Add `Database` to lucide-react imports (line 6-15).

---

### 2.3 Create Data Page

**New File:** `app/(dashboard)/data/page.js`

```javascript
import { createServerClient } from '@/lib/supabase';
import DataPageClient from './DataPageClient';

async function getDataPageData() {
  const supabase = createServerClient();

  const [materialsResult, machinesResult, productsResult, customersResult] =
    await Promise.all([
      supabase.from('materials').select('*').order('name'),
      supabase.from('machines').select('*').order('code'),
      supabase.from('products').select('*, customer:customers(id, name), material:materials(id, name)').order('name'),
      supabase.from('customers').select('*').order('name'),
    ]);

  return {
    materials: materialsResult.data || [],
    machines: machinesResult.data || [],
    products: productsResult.data || [],
    customers: customersResult.data || [],
  };
}

export default async function DataPage() {
  const data = await getDataPageData();
  return <DataPageClient {...data} />;
}
```

**New File:** `app/(dashboard)/data/DataPageClient.js`

```javascript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import MaterialsTable from '@/components/settings/MaterialsTable';
import MachinesTable from '@/components/settings/MachinesTable';
import ProductsTable from '@/components/settings/ProductsTable';
import CustomersTable from '@/components/settings/CustomersTable';

const tabs = [
  { id: 'materials', label: 'Materials' },
  { id: 'machines', label: 'Machines' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
];

export default function DataPageClient({
  materials,
  machines,
  products,
  customers,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(() => {
    const validTabs = tabs.map(t => t.id);
    return validTabs.includes(tabFromUrl) ? tabFromUrl : 'materials';
  });

  useEffect(() => {
    const validTabs = tabs.map(t => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Data</h1>
        <p className="text-zinc-400 mt-1">
          Manage materials, machines, products, and customers
        </p>
      </div>

      <div className="border-b border-zinc-800">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        {activeTab === 'materials' && (
          <MaterialsTable data={materials} onUpdate={handleUpdate} />
        )}
        {activeTab === 'machines' && (
          <MachinesTable data={machines} onUpdate={handleUpdate} />
        )}
        {activeTab === 'products' && (
          <ProductsTable
            data={products}
            customers={customers}
            materials={materials}
            onUpdate={handleUpdate}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersTable data={customers} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
}
```

---

### 2.4 Restructure Settings Tab (Model Settings Only)

**File:** `app/(dashboard)/settings/page.js`

**Replace entire file:**
```javascript
import { createServerClient } from '@/lib/supabase';
import SettingsPageClient from './SettingsPageClient';

async function getSettingsData() {
  const supabase = createServerClient();
  
  const settingsResult = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'main')
    .single();

  return {
    settings: settingsResult.data,
  };
}

export default async function SettingsPage() {
  const data = await getSettingsData();
  return <SettingsPageClient {...data} />;
}
```

**File:** `app/(dashboard)/settings/SettingsPageClient.js`

**Replace entire file:**
```javascript
'use client';

import { useRouter } from 'next/navigation';
import ModelSettings from '@/components/settings/ModelSettings';

export default function SettingsPageClient({ settings }) {
  const router = useRouter();

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">
          Configure model parameters and system settings
        </p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <ModelSettings settings={settings} onUpdate={handleUpdate} />
      </div>
    </div>
  );
}
```

---

## 3. Orders Tab Restructuring

### 3.1 Create Sub-tabs: Timeline, Orders, Predicted Orders

**File:** `app/(dashboard)/orders/OrdersPageClient.js`

**Replace entire file with new structure:**

The Orders page will have 3 sub-tabs:
1. **Timeline** - Current graphical week view (existing OrderTimeline)
2. **Orders** - Table view of real orders (similar to PredictedOrdersTable styling)
3. **Predicted Orders** - Table view of predictions (move from Settings, remove basis column)

**Key changes:**
- Add tab state and tab UI
- Move "New Order" button to Orders sub-tab
- Timeline stays as-is but with gray blocks
- Add OrdersTable component for real orders
- Use existing PredictedOrdersTable but remove "basis" column and "Add Prediction" button

See full implementation in code changes section.

---

### 3.2 Update Order Cards (Gray, No Colors, Simplified)

**File:** `components/orders/OrderCard.js`

**Current (Lines 21-28):**
```javascript
const getCardStyle = () => {
  if (isReal) {
    return 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30';
  }
  return isReliable
    ? 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30'
    : 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30';
};
```

**New:**
```javascript
const getCardStyle = () => {
  // All blocks are now gray - no color differentiation
  return 'bg-zinc-700/50 border-zinc-600/50 hover:bg-zinc-600/50';
};
```

**Remove from card display:**
- Remove the "P" marker for predicted orders (Lines 40-51)
- Keep only quantity and status badge

**Updated OrderCard.js:**
```javascript
'use client';

import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils';
import StatusBadge from '@/components/shared/StatusBadge';

export default function OrderCard({
  order,
  type = 'real',
  onClick,
  className,
}) {
  const status = order.status;

  return (
    <div
      onClick={() => onClick?.(order)}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:scale-105',
        'bg-zinc-700/50 border-zinc-600/50 hover:bg-zinc-600/50',
        className
      )}
    >
      <p className="text-lg font-bold text-white">
        {formatNumber(order.quantity || order.predicted_quantity)}
      </p>
      
      {status && (
        <div className="mt-2">
          <StatusBadge status={status} />
        </div>
      )}
    </div>
  );
}
```

---

### 3.3 Remove "Add Prediction" Button and Basis Column

**File:** `components/settings/PredictedOrdersTable.js`

**Remove "Add Prediction" button (Lines 103-108):**
```javascript
// DELETE this entire block:
<div className="mb-4 flex justify-end">
  <Button onClick={() => setShowCreateModal(true)}>
    <Plus className="w-4 h-4" />
    Add Prediction
  </Button>
</div>
```

Also remove:
- The `showCreateModal` state (line 15)
- The `CreatePredictedOrderModal` component render (lines 128-134)
- The entire `CreatePredictedOrderModal` function definition (lines 304-448)

**Remove "Basis" column from table (Lines 55-59):**
```javascript
// DELETE this column definition:
{
  key: 'basis',
  label: 'Basis',
  render: (val) => val || 'manual',
},
```

Also remove from edit modal:
- The basis field in `EditPredictedOrderModal` formData (line 162)
- The basis Select component in the edit form (lines 288-298)

---

## 4. Settings Improvements

### 4.1 Rename "Error Threshold" to "Reliability Threshold"

**File:** `components/settings/ModelSettings.js`

**Current (Line 53):**
```javascript
label="Error Threshold (%)"
```

**New:**
```javascript
label="Reliability Threshold (%)"
```

**Current (Lines 67-69):**
```javascript
<p className="text-xs text-zinc-500 mt-2">
  Predictions with error above this threshold are marked unreliable.
</p>
```

**New:**
```javascript
<p className="text-xs text-zinc-500 mt-2">
  Predictions with confidence below this threshold are marked unreliable.
</p>
```

**Database Column Note:** The database column is `prediction_error_threshold` which is fine - the UI label just needs to reflect "reliability" terminology.

---

### 4.2 Add "Automatic Generation" Setting

**Database Change Required:**
Add new column to `settings` table:
```sql
ALTER TABLE settings ADD COLUMN auto_regenerate BOOLEAN NOT NULL DEFAULT false;
```

**Add to settings table (SQL):**
Also add a regeneration flag column:
```sql
ALTER TABLE settings ADD COLUMN needs_regeneration BOOLEAN NOT NULL DEFAULT false;
```

**File:** `components/settings/ModelSettings.js`

**IMPORTANT: Add `cn` import at top of file:**
```javascript
import { cn } from '@/lib/utils';
```

Add new form field in the "Production" section:

```javascript
// Add to formData initial state (around line 10-19):
auto_regenerate: settings?.auto_regenerate || false,

// Add toggle UI in the Production section (after shifts_per_day Input, before closing </div> of grid):
// This goes OUTSIDE the grid but inside the Production section div
</div> {/* Close grid */}

<div className="mt-4 pt-4 border-t border-zinc-700">
  <div className="flex items-center justify-between">
    <div>
      <label className="text-sm font-medium text-white">
        Automatic Schedule Generation
      </label>
      <p className="text-xs text-zinc-500 mt-1">
        Automatically regenerate schedule when data changes (after 2 min delay)
      </p>
    </div>
    <button
      type="button"
      onClick={() => setFormData({ ...formData, auto_regenerate: !formData.auto_regenerate })}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
        formData.auto_regenerate ? 'bg-accent' : 'bg-zinc-700'
      )}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          formData.auto_regenerate ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  </div>
</div>
```

---

### 4.3 Regeneration Banner System

**New File:** `components/shared/RegenerationBanner.js`

```javascript
'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function RegenerationBanner({ needsRegeneration, onRegenerate }) {
  const router = useRouter();
  
  if (!needsRegeneration) return null;

  const handleClick = () => {
    router.push('/schedule?regenerate=true');
  };

  return (
    <div className="fixed top-0 left-64 right-0 z-50 bg-accent/90 text-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5" />
        <span className="text-sm font-medium">
          Data has changed. A new production schedule is available.
        </span>
      </div>
      <button
        onClick={handleClick}
        className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-colors"
      >
        Regenerate Schedule
      </button>
    </div>
  );
}
```

**File:** `app/(dashboard)/layout.js`

Add the banner to the dashboard layout, fetching the `needs_regeneration` flag from settings.

---

### 4.4 Set Regeneration Flag on Data Changes

**Files to modify:** All API routes that modify data used in schedule generation:
- `app/api/orders/route.js` (POST, PUT, DELETE)
- `app/api/predicted-orders/route.js` (POST, PUT, DELETE)
- `app/api/products/route.js` (PUT)
- `app/api/machines/route.js` (PUT)
- `app/api/settings/route.js` (PUT)

**Pattern to add after successful mutation:**

```javascript
// After successful INSERT/UPDATE/DELETE, set the regeneration flag
// IMPORTANT: Use try-catch to not break the main operation if this fails
try {
  await supabase
    .from('settings')
    .update({ needs_regeneration: true, updated_at: new Date().toISOString() })
    .eq('id', 'main');
} catch (flagError) {
  // Log but don't throw - the main operation succeeded
  console.warn('Failed to set needs_regeneration flag:', flagError);
}
```

**IMPORTANT:** This flag update should NOT prevent the main operation from returning success. If the flag fails to update, the user can still manually regenerate.

---

### 4.5 Remove rates/hour from Machines Table

**File:** `components/settings/MachinesTable.js`

**Remove hourly_rate column from columns array (Lines 25-29):**
```javascript
// DELETE this column definition:
{
  key: 'hourly_rate',
  label: 'Rate/hr',
  align: 'right',
  render: (val) => `${formatNumber(val)} SEK`,
},
```

**Remove hourly_rate from editFields array (Line 43):**
```javascript
// DELETE this field definition:
{ key: 'hourly_rate', label: 'Hourly Rate (SEK)', type: 'number', step: '0.01' },
```

---

## 5. Schedule Tab Improvements

### 5.1 Simplify Machine Row Labels (ID Only)

**File:** `components/schedule/MachineRow.js`

**Current (Lines 57-68):**
```javascript
<div className="w-32 flex-shrink-0 px-4 py-3 bg-zinc-900 border-r border-zinc-800">
  <div className="text-sm font-semibold text-white">{machine.code}</div>
  <div className="text-xs text-zinc-500">{machine.name}</div>
  <div
    className={cn(
      'text-xs font-medium mt-1',
      oee >= 80 ? 'text-green-400' : oee >= 50 ? 'text-yellow-400' : 'text-zinc-500'
    )}
  >
    OEE: {oee.toFixed(0)}%
  </div>
</div>
```

**New:**
```javascript
<div 
  className="w-32 flex-shrink-0 px-4 py-3 bg-zinc-900 border-r border-zinc-800 cursor-pointer hover:bg-zinc-800 transition-colors"
  onClick={() => onMachineClick?.(machine)}
>
  <div className="text-sm font-semibold text-white">{machine.code}</div>
</div>
```

**Add prop:** `onMachineClick` to MachineRow component props

---

### 5.2 Machine Details Popup

**New File:** `components/schedule/MachineDetailsModal.js`

```javascript
'use client';

import Modal from '@/components/shared/Modal';
import { cn } from '@/lib/utils';

// NOTE: The 'cn' import is required for conditional OEE color styling

export default function MachineDetailsModal({
  isOpen,
  onClose,
  machine,
  oee,
}) {
  if (!machine) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Machine ${machine.code}`}
      size="small"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Name</p>
            <p className="text-sm text-white mt-1">{machine.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">OEE</p>
            <p className={cn(
              'text-sm font-semibold mt-1',
              oee >= 80 ? 'text-green-400' : oee >= 50 ? 'text-yellow-400' : 'text-zinc-400'
            )}>
              {oee?.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Max Shot Weight</p>
            <p className="text-sm text-white mt-1">{machine.max_shot_weight}g</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Clamp Force</p>
            <p className="text-sm text-white mt-1">{machine.clamp_force} tons</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Max Pressure</p>
            <p className="text-sm text-white mt-1">{machine.max_pressure}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-wide">Max Temperature</p>
            <p className="text-sm text-white mt-1">{machine.max_temperature}C</p>
          </div>
        </div>
        
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Compatible Materials</p>
          <div className="flex flex-wrap gap-2">
            {machine.compatible_materials?.map((material) => (
              <span 
                key={material} 
                className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300"
              >
                {material}
              </span>
            )) || <span className="text-xs text-zinc-500">-</span>}
          </div>
        </div>
        
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">Status</p>
          <p className="text-sm text-white mt-1 capitalize">{machine.status}</p>
        </div>
      </div>
    </Modal>
  );
}
```

**Update:** `components/schedule/ScheduleGantt.js` and `app/(dashboard)/schedule/SchedulePageClient.js`

Add state for selected machine and render MachineDetailsModal.

---

### 5.3 Google Calendar-style Blocks in HourlyModal

**File:** `components/schedule/HourlyModal.js`

**Complete rewrite:**

```javascript
'use client';

import Modal from '@/components/shared/Modal';
import { formatDateLocale, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

const WORK_START_HOUR = 6;
const WORK_END_HOUR = 22;
const TOTAL_HOURS = WORK_END_HOUR - WORK_START_HOUR;

export default function HourlyModal({
  isOpen,
  onClose,
  date,
  machine,
  blocks,
}) {
  if (!date || !machine) return null;

  // Filter blocks for this day and machine
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const dayBlocks = blocks.filter((b) => {
    if (b.machine_id !== machine.id) return false;
    const blockStart = new Date(b.start_time);
    const blockEnd = new Date(b.end_time);
    return blockStart <= dayEnd && blockEnd >= dayStart;
  });

  // Group contiguous blocks by product+customer into single visual blocks
  const groupedBlocks = groupBlocksForDay(dayBlocks, date);

  // Generate hour markers
  const hours = [];
  for (let h = WORK_START_HOUR; h <= WORK_END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${machine.code} - ${formatDateLocale(date)}`}
      size="default"
    >
      <div className="relative" style={{ height: `${TOTAL_HOURS * 32}px` }}>
        {/* Hour grid lines */}
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-zinc-800/50 flex items-start"
            style={{ top: `${index * 32}px`, height: '32px' }}
          >
            <span className="w-16 text-xs text-zinc-500 pr-2 text-right">
              {hour.toString().padStart(2, '0')}:00
            </span>
          </div>
        ))}
        
        {/* Production blocks */}
        {groupedBlocks.map((block, index) => {
          const style = calculateBlockStyle(block, date);
          return (
            <div
              key={block.id || index}
              className="absolute left-16 right-2 bg-accent/30 border-l-4 border-accent rounded-r px-2 py-1 overflow-hidden"
              style={style}
            >
              <p className="text-sm font-medium text-white truncate">
                {block.product?.name}
              </p>
              <p className="text-xs text-zinc-400">
                {formatNumber(block.batch_size)} units
              </p>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function groupBlocksForDay(blocks, date) {
  // For now, just return blocks as-is
  // Each block spans from its start to end time on this day
  return blocks;
}

function calculateBlockStyle(block, date) {
  const dayStart = new Date(date);
  dayStart.setHours(WORK_START_HOUR, 0, 0, 0);
  
  const blockStart = new Date(block.start_time);
  const blockEnd = new Date(block.end_time);
  
  // Clamp to this day's work hours
  const dayWorkStart = new Date(date);
  dayWorkStart.setHours(WORK_START_HOUR, 0, 0, 0);
  const dayWorkEnd = new Date(date);
  dayWorkEnd.setHours(WORK_END_HOUR, 0, 0, 0);
  
  const visibleStart = blockStart < dayWorkStart ? dayWorkStart : blockStart;
  const visibleEnd = blockEnd > dayWorkEnd ? dayWorkEnd : blockEnd;
  
  const startOffset = (visibleStart - dayWorkStart) / (1000 * 60 * 60); // hours from start
  const duration = (visibleEnd - visibleStart) / (1000 * 60 * 60); // hours
  
  return {
    top: `${startOffset * 32}px`,
    height: `${Math.max(duration * 32, 24)}px`, // minimum height
  };
}
```

---

### 5.4 Regenerate Button State (Disabled When No Changes)

**File:** `app/(dashboard)/schedule/SchedulePageClient.js`

The "Regenerate" button should be disabled (grayed out) when `needs_regeneration` is false.

**Find the regenerate button and update:**

```javascript
<Button 
  onClick={handleGenerate} 
  loading={loading}
  disabled={!settings?.needs_regeneration && blocks.length > 0}
  className={cn(
    !settings?.needs_regeneration && blocks.length > 0 && 'opacity-50 cursor-not-allowed'
  )}
>
  <RefreshCw className="w-4 h-4" />
  Regenerate Schedule
</Button>
```

---

### 5.5 Auto-Regeneration Logic

**File:** `app/(dashboard)/schedule/SchedulePageClient.js`

Add useEffect to handle auto-regeneration when setting is enabled.

**IMPORTANT:** Use a ref for the timer to avoid stale closure issues and ensure proper cleanup:

```javascript
// Add import at top
import { useState, useEffect, useRef } from 'react';

// Add ref for timer (near other state declarations, around line 52)
const regenerateTimerRef = useRef(null);

// Auto-regeneration effect - add after other useEffect hooks
useEffect(() => {
  // Clear any existing timer on every render
  if (regenerateTimerRef.current) {
    clearTimeout(regenerateTimerRef.current);
    regenerateTimerRef.current = null;
  }

  // Only set timer if auto-regenerate is on AND needs regeneration
  if (settings?.auto_regenerate && settings?.needs_regeneration && !generating) {
    regenerateTimerRef.current = setTimeout(() => {
      // Double-check conditions before regenerating
      if (settings?.auto_regenerate && settings?.needs_regeneration) {
        handleGenerate();
      }
    }, 2 * 60 * 1000); // 2 minutes
  }
  
  // Cleanup on unmount or dependency change
  return () => {
    if (regenerateTimerRef.current) {
      clearTimeout(regenerateTimerRef.current);
      regenerateTimerRef.current = null;
    }
  };
}, [settings?.auto_regenerate, settings?.needs_regeneration, generating]);
```

**Note:** The `generating` state is included in dependencies to prevent multiple triggers, and we use a ref instead of state to avoid re-renders and stale closure issues.

---

## 6. Dashboard Cleanup

### 6.1 Compact Layout, Unified Icon Colors

**File:** `app/(dashboard)/dashboard/page.js`

**Changes:**

1. **Reduce padding** on the main container:
   - Change `space-y-8 p-6` to `space-y-4 p-4`

2. **Reduce stat card padding:**
   - Change `p-6` to `p-4` on StatCard
   - Change `gap-6` to `gap-4` on grids

3. **Unify icon colors** - remove different colors per icon:

**Current StatCard (Lines 230-244):**
```javascript
function StatCard({ title, value, subtitle, icon: Icon, iconColor }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
          <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg bg-zinc-800 ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
```

**New StatCard:**
```javascript
function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wide">{title}</p>
          <p className="text-xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 rounded bg-zinc-800">
          <Icon className="w-4 h-4 text-zinc-400" />
        </div>
      </div>
    </div>
  );
}
```

4. **Remove iconColor prop from all StatCard calls:**

```javascript
<StatCard
  title="Total Orders"
  value={stats.totalOrders}
  subtitle={`${stats.pendingOrders} pending`}
  icon={ClipboardList}
/>
```

(Remove `iconColor="text-blue-400"` etc. from all 4 stat cards)

---

## Implementation Order

**Phase 1: Critical Bug Fixes (Do First)**
1. 1.1 NaN Error Fix
2. 1.2 Hydration Mismatch Fix

**Phase 2: Database Changes**
1. Add `auto_regenerate` column to settings
2. Add `needs_regeneration` column to settings

**Phase 3: Navigation Restructuring**
1. 2.1 Remove Data Management from Sidebar
2. 2.2-2.3 Create Data page and restructure Settings

**Phase 4: Orders Restructuring**
1. 3.1 Create sub-tabs structure
2. 3.2 Update OrderCard styling
3. 3.3 Remove Add Prediction button

**Phase 5: Settings Improvements**
1. 4.1 Rename threshold label
2. 4.2 Add auto-generation toggle
3. 4.3-4.4 Regeneration banner and flag system
4. 4.5 Remove rates/hour column

**Phase 6: Schedule Improvements**
1. 5.1 Simplify machine labels
2. 5.2 Machine details popup
3. 5.3 Calendar-style hourly modal
4. 5.4-5.5 Regeneration button and auto-regen

**Phase 7: Dashboard**
1. 6.1-6.2 Compact layout and unified colors

---

## Files Changed Summary

| File | Action | Changes |
|------|--------|---------|
| `components/settings/ModelSettings.js` | Modify | NaN fix, rename label, add auto-regen toggle |
| `app/layout.js` | Modify | Add suppressHydrationWarning |
| `components/layout/Sidebar.js` | Modify | Remove secondary nav, add Data link |
| `app/(dashboard)/data/page.js` | Create | New Data page server component |
| `app/(dashboard)/data/DataPageClient.js` | Create | New Data page client component |
| `app/(dashboard)/settings/page.js` | Modify | Remove data tables, settings only |
| `app/(dashboard)/settings/SettingsPageClient.js` | Modify | Simplify to ModelSettings only |
| `app/(dashboard)/orders/OrdersPageClient.js` | Modify | Add sub-tabs structure |
| `components/orders/OrderCard.js` | Modify | Gray styling, remove P marker |
| `components/orders/OrderTimeline.js` | Modify | Remove colored legend items |
| `components/settings/PredictedOrdersTable.js` | Modify | Remove Add Prediction button, basis column |
| `components/schedule/MachineRow.js` | Modify | Simplify to ID only, add click handler |
| `components/schedule/MachineDetailsModal.js` | Create | New modal for machine details |
| `components/schedule/HourlyModal.js` | Modify | Calendar-style block layout |
| `components/schedule/ScheduleGantt.js` | Modify | Pass machine click handler |
| `app/(dashboard)/schedule/SchedulePageClient.js` | Modify | Add machine modal, auto-regen logic |
| `components/shared/RegenerationBanner.js` | Create | New banner component |
| `app/(dashboard)/layout.js` | Modify | Add regeneration banner |
| `app/(dashboard)/dashboard/page.js` | Modify | Compact layout, unified icons |
| `app/api/orders/route.js` | Modify | Set regeneration flag |
| `app/api/predicted-orders/route.js` | Modify | Set regeneration flag |
| `app/api/products/route.js` | Modify | Set regeneration flag |
| `app/api/machines/route.js` | Modify | Set regeneration flag |
| `app/api/settings/route.js` | Modify | Set regeneration flag, handle new columns |
| `components/settings/MachinesTable.js` | Modify | Remove hourly_rate column |

---

## SQL Migrations Required

```sql
-- Migration: Add auto-regeneration settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS auto_regenerate BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS needs_regeneration BOOLEAN NOT NULL DEFAULT false;
```

---

**Document Version:** 2.0  
**Last Updated:** 2026-01-19  
**Ready for Implementation:** Yes
