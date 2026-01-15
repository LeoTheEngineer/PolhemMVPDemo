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
    <div className="space-y-8 p-6">
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
