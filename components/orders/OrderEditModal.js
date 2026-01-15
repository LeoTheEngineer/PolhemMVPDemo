'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import StatusBadge from '@/components/shared/StatusBadge';
import { Input, DateInput } from '@/components/shared/FormFields';
import { formatDate } from '@/lib/utils';

export default function OrderEditModal({
  isOpen,
  onClose,
  order,
  type = 'real', // 'real' or 'predicted'
  onSave,
  onDelete,
}) {
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 0,
    date: '',
    notes: '',
  });

  // Update form data when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        quantity: order.quantity || order.predicted_quantity || 0,
        date: order.due_date || order.predicted_date || '',
        notes: order.notes || '',
      });
    }
  }, [order]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint =
        type === 'real' ? '/api/orders' : '/api/predicted-orders';

      const updateData =
        type === 'real'
          ? {
              id: order.id,
              quantity: parseInt(formData.quantity),
              due_date: formData.date,
              notes: formData.notes,
            }
          : {
              id: order.id,
              predicted_quantity: parseInt(formData.quantity),
              predicted_date: formData.date,
            };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Failed to update');

      const result = await response.json();
      
      toast.success('Order updated successfully', {
        description: 'Consider regenerating the schedule to reflect changes.',
      });

      onSave?.(result.data);
      onClose();
    } catch (error) {
      toast.error('Failed to update order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      const endpoint =
        type === 'real' ? '/api/orders' : '/api/predicted-orders';

      const response = await fetch(`${endpoint}?id=${order.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success(
        type === 'real' ? 'Order deleted successfully' : 'Predicted order deleted successfully'
      );

      onDelete?.(order.id);
      onClose();
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!order) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={type === 'real' ? 'Edit Order' : 'Edit Predicted Order'}
        footer={
          <div className="flex justify-between w-full">
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleteLoading}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose} disabled={loading || deleteLoading}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={loading} disabled={deleteLoading}>
                Save Changes
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Read-only fields */}
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
            {/* Status - only show if order has status (unreliable predictions don't) */}
            {order.status && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Status</span>
                <StatusBadge status={order.status} />
              </div>
            )}
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Customer:</span>{' '}
              {order.customer?.name || 'Unknown'}
            </p>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Product:</span>{' '}
              {order.product?.name || 'Unknown'}
            </p>
            {/* Confidence score for predicted orders */}
            {type === 'predicted' && order.confidence_score && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Confidence</span>
                <span className={`text-sm font-medium ${
                  order.confidence_score >= 0.75 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {Math.round(order.confidence_score * 100)}%
                  {order.confidence_score < 0.75 && ' (Unreliable)'}
                </span>
              </div>
            )}
            {type === 'real' && (
              <p className="text-xs text-zinc-500 mt-2 pt-2 border-t border-zinc-700">
                Status is automatically determined by the production schedule.
              </p>
            )}
            {type === 'predicted' && order.confidence_score < 0.75 && (
              <p className="text-xs text-red-400 mt-2 pt-2 border-t border-zinc-700">
                This prediction is unreliable and will not be included in production scheduling.
              </p>
            )}
          </div>

          {/* Editable fields */}
          <Input
            label="Quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            required
          />

          <DateInput
            label={type === 'real' ? 'Due Date' : 'Predicted Date'}
            value={formatDate(formData.date)}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          {type === 'predicted' && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-400">
                Editing a predicted order will not affect the original prediction
                model. Changes are for planning purposes only.
              </p>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title={type === 'real' ? 'Delete Order' : 'Delete Predicted Order'}
        description={
          type === 'real'
            ? 'Are you sure you want to delete this order? This action cannot be undone. Any scheduled production blocks for this order will need to be regenerated.'
            : 'Are you sure you want to delete this predicted order? This action cannot be undone.'
        }
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}
