'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Button from '@/components/shared/Button';
import { Input } from '@/components/shared/FormFields';

export default function ModelSettings({ settings, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prediction_error_threshold: settings?.prediction_error_threshold || 25,
    storage_cost_per_m3: settings?.storage_cost_per_m3 || 0,
    employee_cost_per_hour: settings?.employee_cost_per_hour || 0,
    interest_rate: settings?.interest_rate || 0,
    delivery_buffer_days: settings?.delivery_buffer_days || 2,
    setup_time_minutes: settings?.setup_time_minutes || 45,
    work_hours_per_day: settings?.work_hours_per_day || 16,
    shifts_per_day: settings?.shifts_per_day || 2,
  });

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save');

      const result = await response.json();
      toast.success('Settings saved successfully');
      onUpdate?.(result.data);
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Prediction Settings */}
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Prediction Model
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Error Threshold (%)"
            type="number"
            min="0"
            max="100"
            step="1"
            value={formData.prediction_error_threshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                prediction_error_threshold: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Predictions with error above this threshold are marked unreliable.
        </p>
      </div>

      {/* Storage Cost Settings */}
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Storage Costs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Storage Cost (SEK/m3/day)"
            type="number"
            min="0"
            step="0.01"
            value={formData.storage_cost_per_m3}
            onChange={(e) =>
              setFormData({
                ...formData,
                storage_cost_per_m3: parseFloat(e.target.value),
              })
            }
          />
          <Input
            label="Employee Cost (SEK/hour)"
            type="number"
            min="0"
            step="0.01"
            value={formData.employee_cost_per_hour}
            onChange={(e) =>
              setFormData({
                ...formData,
                employee_cost_per_hour: parseFloat(e.target.value),
              })
            }
          />
          <Input
            label="Interest Rate (%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.interest_rate}
            onChange={(e) =>
              setFormData({
                ...formData,
                interest_rate: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Production Settings */}
      <div className="bg-zinc-800/50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Production</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Delivery Buffer (days)"
            type="number"
            min="0"
            value={formData.delivery_buffer_days}
            onChange={(e) =>
              setFormData({
                ...formData,
                delivery_buffer_days: parseInt(e.target.value),
              })
            }
          />
          <Input
            label="Setup Time (minutes)"
            type="number"
            min="0"
            value={formData.setup_time_minutes}
            onChange={(e) =>
              setFormData({
                ...formData,
                setup_time_minutes: parseInt(e.target.value),
              })
            }
          />
          <Input
            label="Work Hours/Day"
            type="number"
            min="1"
            max="24"
            value={formData.work_hours_per_day}
            onChange={(e) =>
              setFormData({
                ...formData,
                work_hours_per_day: parseInt(e.target.value),
              })
            }
          />
          <Input
            label="Shifts/Day"
            type="number"
            min="1"
            max="3"
            value={formData.shifts_per_day}
            onChange={(e) =>
              setFormData({
                ...formData,
                shifts_per_day: parseInt(e.target.value),
              })
            }
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={loading}>
          Save Settings
        </Button>
      </div>
    </div>
  );
}
