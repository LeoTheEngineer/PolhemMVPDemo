'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { Select, DateTimeInput } from '@/components/shared/FormFields';
import { formatNumber, hoursBetween } from '@/lib/utils';

export default function BlockEditModal({
  isOpen,
  onClose,
  block,
  machines,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    machine_id: '',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    if (block) {
      setFormData({
        machine_id: block.machine_id,
        start_time: block.start_time?.slice(0, 16) || '',
        end_time: block.end_time?.slice(0, 16) || '',
      });
    }
  }, [block]);

  // Calculate duration
  const duration = formData.start_time && formData.end_time
    ? hoursBetween(formData.start_time, formData.end_time)
    : 0;

  // Get compatible machines for this block's product
  const compatibleMachines = machines.filter((m) => {
    if (!block?.product?.compatible_machines) return true;
    return block.product.compatible_machines.includes(m.id);
  });

  const handleStartChange = (newStart) => {
    if (!formData.end_time) {
      setFormData({ ...formData, start_time: newStart });
      return;
    }

    // Keep duration fixed, adjust end time
    const currentDuration = hoursBetween(formData.start_time, formData.end_time);
    const newEnd = new Date(new Date(newStart).getTime() + currentDuration * 60 * 60 * 1000);
    setFormData({
      ...formData,
      start_time: newStart,
      end_time: newEnd.toISOString().slice(0, 16),
    });
  };

  const handleEndChange = (newEnd) => {
    if (!formData.start_time) {
      setFormData({ ...formData, end_time: newEnd });
      return;
    }

    // Keep duration fixed, adjust start time
    const currentDuration = hoursBetween(formData.start_time, formData.end_time);
    const newStart = new Date(new Date(newEnd).getTime() - currentDuration * 60 * 60 * 1000);
    setFormData({
      ...formData,
      start_time: newStart.toISOString().slice(0, 16),
      end_time: newEnd,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/production-blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: block.id,
          machine_id: formData.machine_id,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Block updated');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error('Failed to update block');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!block) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Production Block"
      size="default"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Read-only info */}
        <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Product:</span> {block.product?.name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Customer:</span> {block.customer?.name}
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Batch Size:</span> {formatNumber(block.batch_size)} units
          </p>
          <p className="text-sm text-zinc-300">
            <span className="text-zinc-500">Duration:</span> {duration.toFixed(1)} hours
          </p>
        </div>

        {/* Machine selection */}
        <Select
          label="Machine"
          value={formData.machine_id}
          onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
          options={compatibleMachines.map((m) => ({
            value: m.id,
            label: `${m.code} - ${m.name}`,
          }))}
        />

        {/* Time inputs */}
        <DateTimeInput
          label="Start Time"
          value={formData.start_time}
          onChange={(e) => handleStartChange(e.target.value)}
        />

        <DateTimeInput
          label="End Time"
          value={formData.end_time}
          onChange={(e) => handleEndChange(e.target.value)}
        />

        <p className="text-xs text-zinc-500">
          Changing start or end time will maintain the block duration.
        </p>
      </div>
    </Modal>
  );
}
