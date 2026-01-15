'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import Button from '@/components/shared/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import DateRangePicker from '@/components/schedule/DateRangePicker';
import ScheduleGantt from '@/components/schedule/ScheduleGantt';
import BlockEditModal from '@/components/schedule/BlockEditModal';
import HourlyModal from '@/components/schedule/HourlyModal';
import { formatDate, addDays } from '@/lib/utils';

export default function SchedulePageClient({ machines, blocks, settings }) {
  const router = useRouter();
  
  // Date range state
  const [startDate, setStartDate] = useState(formatDate(new Date()));
  const [endDate, setEndDate] = useState(formatDate(addDays(new Date(), 14)));
  
  // Modal states
  const [editBlock, setEditBlock] = useState(null);
  const [hourlyView, setHourlyView] = useState({ date: null, machine: null });
  const [showConfirmGenerate, setShowConfirmGenerate] = useState(false);
  
  // Loading states
  const [generating, setGenerating] = useState(false);

  // Get metrics from settings
  const metrics = settings?.schedule_metrics || {};
  const hasManualEdits = metrics.has_manual_edits || false;

  const handleGenerate = async () => {
    setGenerating(true);
    setShowConfirmGenerate(false);

    try {
      const response = await fetch('/api/production-blocks/generate', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to generate');

      const result = await response.json();
      toast.success(`Generated ${result.data?.length || 0} production blocks`);
      router.refresh();
    } catch (error) {
      toast.error('Failed to generate schedule');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const handleBlockMove = async (blockId, newMachineId) => {
    try {
      const response = await fetch('/api/production-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: blockId, machine_id: newMachineId }),
      });

      if (!response.ok) throw new Error('Failed to move block');

      // Mark as manual edit
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schedule_metrics: { ...metrics, has_manual_edits: true },
        }),
      });

      toast.success('Block moved');
      router.refresh();
    } catch (error) {
      toast.error('Failed to move block');
      console.error(error);
    }
  };

  const handleBlockEdit = () => {
    router.refresh();
    setEditBlock(null);
  };

  const handleDayClick = (machine, day) => {
    // Check if block duration is < 16 hours
    // For simplicity, always open hourly view
    setHourlyView({ machine, date: day });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Production Schedule</h1>
          <p className="text-zinc-400 mt-1">
            View and manage production planning
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasManualEdits && (
            <div className="flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              Manual edits
            </div>
          )}
          <Button
            onClick={() =>
              hasManualEdits ? setShowConfirmGenerate(true) : handleGenerate()
            }
            loading={generating}
          >
            <RefreshCw className="w-4 h-4" />
            {blocks.length === 0 ? 'Generate Schedule' : 'Regenerate'}
          </Button>
        </div>
      </div>

      {/* Metrics Bar */}
      {metrics.total_oee !== undefined && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Global OEE"
            value={`${metrics.total_oee}%`}
            color={metrics.total_oee >= 80 ? 'text-green-400' : 'text-yellow-400'}
          />
          <MetricCard
            label="Production Hours"
            value={metrics.total_production_hours || 0}
          />
          <MetricCard label="Total Blocks" value={metrics.total_blocks || 0} />
          <MetricCard
            label="Machines Used"
            value={`${metrics.machines_used || 0}/${machines.length}`}
          />
        </div>
      )}

      {/* Date Range Picker */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />
      </div>

      {/* Gantt Chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        {blocks.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-400 mb-4">No production blocks scheduled.</p>
            <Button onClick={handleGenerate} loading={generating}>
              Generate Schedule
            </Button>
          </div>
        ) : (
          <ScheduleGantt
            machines={machines}
            blocks={blocks}
            startDate={startDate}
            endDate={endDate}
            workHoursPerDay={settings?.work_hours_per_day || 16}
            onBlockClick={setEditBlock}
            onDayClick={handleDayClick}
            onBlockMove={handleBlockMove}
          />
        )}
      </div>

      {/* Block Edit Modal */}
      <BlockEditModal
        isOpen={!!editBlock}
        onClose={() => setEditBlock(null)}
        block={editBlock}
        machines={machines}
        onSave={handleBlockEdit}
      />

      {/* Hourly View Modal */}
      <HourlyModal
        isOpen={!!hourlyView.date}
        onClose={() => setHourlyView({ date: null, machine: null })}
        date={hourlyView.date}
        machine={hourlyView.machine}
        blocks={blocks}
      />

      {/* Confirm Regenerate Dialog */}
      <ConfirmDialog
        isOpen={showConfirmGenerate}
        onClose={() => setShowConfirmGenerate(false)}
        onConfirm={handleGenerate}
        title="Regenerate Schedule?"
        description="You have manual edits that will be lost. Are you sure you want to regenerate the entire schedule?"
        confirmText="Regenerate"
        variant="danger"
        loading={generating}
      />
    </div>
  );
}

function MetricCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-zinc-800/50 rounded-lg p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
    </div>
  );
}
