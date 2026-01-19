'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Button from '@/components/shared/Button';
import { Input } from '@/components/shared/FormFields';

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
    auto_regenerate: settings?.auto_regenerate || false,
  });

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
            label="Reliability Threshold (%)"
            type="number"
            min="0"
            max="100"
            step="1"
            value={formData.prediction_error_threshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                prediction_error_threshold: safeParseFloat(e.target.value, 0),
              })
            }
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Predictions with confidence below this threshold are marked unreliable.
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
                storage_cost_per_m3: safeParseFloat(e.target.value, 0),
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
                employee_cost_per_hour: safeParseFloat(e.target.value, 0),
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
                interest_rate: safeParseFloat(e.target.value, 0),
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
                delivery_buffer_days: safeParseInt(e.target.value, 0),
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
                setup_time_minutes: safeParseInt(e.target.value, 0),
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
                work_hours_per_day: safeParseInt(e.target.value, 1),
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
                shifts_per_day: safeParseInt(e.target.value, 1),
              })
            }
          />
        </div>

        {/* Auto-regeneration toggle */}
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
