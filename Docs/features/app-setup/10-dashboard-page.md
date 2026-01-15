# 10 - Dashboard Page

## Purpose

Create the main dashboard page displaying key metrics, quick stats, and recent activity overview.

---

## Prerequisites

- `09-shared-components.md` completed
- API routes working

---

## Files to Create

```
app/(dashboard)/dashboard/page.js
app/(dashboard)/dashboard/loading.js
app/(dashboard)/dashboard/error.js
app/not-found.js
```

---

## Implementation

### Create `app/(dashboard)/dashboard/page.js`

```javascript
import { createServerClient } from '@/lib/supabase';
import { formatNumber, formatPercent } from '@/lib/utils';
import { 
  ClipboardList, 
  Factory, 
  Package, 
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

async function getDashboardData() {
  const supabase = createServerClient();
  
  const [
    ordersResult,
    productsResult,
    machinesResult,
    predictedResult,
    settingsResult,
    blocksResult,
  ] = await Promise.all([
    supabase.from('orders').select('id, status, quantity, due_date'),
    supabase.from('products').select('id'),
    supabase.from('machines').select('id, status'),
    supabase.from('predicted_orders').select('id, confidence_score'),
    supabase.from('settings').select('schedule_metrics').eq('id', 'main').single(),
    supabase.from('production_blocks').select('id'),
  ]);

  const orders = ordersResult.data || [];
  const products = productsResult.data || [];
  const machines = machinesResult.data || [];
  const predictions = predictedResult.data || [];
  const settings = settingsResult.data;
  const blocks = blocksResult.data || [];

  // Calculate stats
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const scheduledOrders = orders.filter(o => o.status === 'scheduled').length;
  const inProductionOrders = orders.filter(o => o.status === 'in_production').length;
  const totalQuantity = orders.reduce((sum, o) => sum + o.quantity, 0);
  
  const availableMachines = machines.filter(m => m.status === 'available').length;
  
  const reliablePredictions = predictions.filter(p => p.confidence_score >= 0.75).length;
  
  const metrics = settings?.schedule_metrics || {};

  return {
    stats: {
      totalOrders: orders.length,
      pendingOrders,
      scheduledOrders,
      inProductionOrders,
      totalQuantity,
      totalProducts: products.length,
      totalMachines: machines.length,
      availableMachines,
      totalPredictions: predictions.length,
      reliablePredictions,
      totalBlocks: blocks.length,
    },
    metrics,
    recentOrders: orders.slice(0, 5),
  };
}

export default async function DashboardPage() {
  const { stats, metrics, recentOrders } = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Overview of your production planning system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          subtitle={`${stats.pendingOrders} pending`}
          icon={ClipboardList}
          iconColor="text-blue-400"
        />
        <StatCard
          title="Products"
          value={stats.totalProducts}
          subtitle="Active SKUs"
          icon={Package}
          iconColor="text-green-400"
        />
        <StatCard
          title="Machines"
          value={`${stats.availableMachines}/${stats.totalMachines}`}
          subtitle="Available"
          icon={Factory}
          iconColor="text-purple-400"
        />
        <StatCard
          title="Predictions"
          value={stats.totalPredictions}
          subtitle={`${stats.reliablePredictions} reliable`}
          icon={TrendingUp}
          iconColor="text-yellow-400"
        />
      </div>

      {/* Schedule Metrics */}
      {metrics.total_oee !== undefined && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Global OEE</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {metrics.total_oee}%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
            </div>
            <OEEBar value={metrics.total_oee} />
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-zinc-400">Production Hours</p>
            <p className="text-3xl font-bold text-white mt-1">
              {metrics.total_production_hours || 0}h
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              Setup: {metrics.total_setup_hours || 0}h
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <p className="text-sm text-zinc-400">Scheduled Blocks</p>
            <p className="text-3xl font-bold text-white mt-1">
              {metrics.total_blocks || 0}
            </p>
            <p className="text-sm text-zinc-500 mt-2">
              {metrics.machines_used || 0} machines in use
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Order Status
          </h2>
          <div className="space-y-4">
            <StatusRow
              label="Pending"
              count={stats.pendingOrders}
              total={stats.totalOrders}
              color="bg-yellow-500"
            />
            <StatusRow
              label="Scheduled"
              count={stats.scheduledOrders}
              total={stats.totalOrders}
              color="bg-blue-500"
            />
            <StatusRow
              label="In Production"
              count={stats.inProductionOrders}
              total={stats.totalOrders}
              color="bg-accent"
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickLink
              href="/orders"
              icon={ClipboardList}
              label="View Orders"
              description="Manage orders and predictions"
            />
            <QuickLink
              href="/schedule"
              icon={Clock}
              label="Production Schedule"
              description="Generate and edit schedule"
            />
            <QuickLink
              href="/settings"
              icon={AlertTriangle}
              label="Settings"
              description="Configure system parameters"
            />
          </div>
        </div>
      </div>

      {/* Alert if no schedule generated */}
      {stats.totalBlocks === 0 && stats.totalOrders > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-4">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-400">No Schedule Generated</h3>
            <p className="text-sm text-yellow-400/80 mt-1">
              You have {stats.totalOrders} orders but no production schedule.
              Go to the Schedule page and click "Generate Schedule" to create one.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-components

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

function OEEBar({ value }) {
  const getColor = (v) => {
    if (v >= 85) return 'bg-green-500';
    if (v >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="mt-4">
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1 text-xs text-zinc-500">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function StatusRow({ label, count, total, color }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white">{count}</span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, description }) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-800 transition-colors group"
    >
      <div className="p-2 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
        <Icon className="w-5 h-5 text-zinc-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
    </a>
  );
}
```

---

### Create `app/(dashboard)/dashboard/loading.js`

```javascript
export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse mt-2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse mt-2" />
            <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse mt-2" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 h-48">
            <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### Create `app/(dashboard)/dashboard/error.js`

```javascript
'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({ error, reset }) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="p-4 rounded-full bg-red-500/10 mb-4">
        <AlertTriangle className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">
        Something went wrong
      </h2>
      <p className="text-zinc-400 mb-6 max-w-md">
        {error?.message || 'Failed to load dashboard data. Please try again.'}
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
```

---

### Create `app/not-found.js`

```javascript
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-zinc-300 mb-2">
          Page Not Found
        </h2>
        <p className="text-zinc-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## Folder Structure Commands

```bash
mkdir -p "app/(dashboard)/dashboard"
```

---

## Verification

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to dashboard:**
   - Sign in at `http://localhost:3000/sign-in`
   - Should redirect to `/dashboard`

3. **Verify dashboard displays:**
   - Stats cards showing order counts, products, machines
   - Order status breakdown
   - Quick action links
   - Alert if no schedule generated

4. **Check data loads:**
   - Values should match database counts
   - If schedule exists, OEE metrics should display

---

## Next Step

Proceed to `11-orders-page.md` to create the Orders page with timeline visualization.
