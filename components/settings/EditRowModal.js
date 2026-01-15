'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { Input, Select, Textarea } from '@/components/shared/FormFields';

export default function EditRowModal({
  isOpen,
  onClose,
  title,
  row,
  fields,
  endpoint,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (row) {
      const initial = {};
      fields.forEach((field) => {
        initial[field.key] = row[field.key] ?? '';
      });
      setFormData(initial);
    }
  }, [row, fields]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, ...formData }),
      });

      if (!response.ok) throw new Error('Failed to update');

      const result = await response.json();
      toast.success('Updated successfully');
      onSave?.(result.data);
      onClose();
    } catch (error) {
      toast.error('Failed to update');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!row) return null;

  const renderField = (field) => {
    const value = formData[field.key] ?? '';

    switch (field.type) {
      case 'select':
        return (
          <Select
            key={field.key}
            label={field.label}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })
            }
            options={field.options || []}
            disabled={field.readOnly}
          />
        );
      case 'textarea':
        return (
          <Textarea
            key={field.key}
            label={field.label}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })
            }
            disabled={field.readOnly}
          />
        );
      case 'number':
        return (
          <Input
            key={field.key}
            label={field.label}
            type="number"
            step={field.step || '1'}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })
            }
            disabled={field.readOnly}
          />
        );
      default:
        return (
          <Input
            key={field.key}
            label={field.label}
            type={field.type || 'text'}
            value={value}
            onChange={(e) =>
              setFormData({ ...formData, [field.key]: e.target.value })
            }
            disabled={field.readOnly}
          />
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderField)}
      </form>
    </Modal>
  );
}
