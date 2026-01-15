'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import DataTable from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Input, Select, DateInput } from '@/components/shared/FormFields';
import { formatNumber, formatDateLocale, formatDate } from '@/lib/utils';

export default function PredictedOrdersTable({ data, customers, products, onUpdate }) {
  const [editRow, setEditRow] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: 'product',
      label: 'Product',
      sortable: true,
      render: (val) => val?.name || '-',
    },
    {
      key: 'customer',
      label: 'Customer',
      render: (val) => val?.name || '-',
    },
    {
      key: 'predicted_quantity',
      label: 'Quantity',
      align: 'right',
      sortable: true,
      render: (val) => formatNumber(val),
    },
    {
      key: 'predicted_date',
      label: 'Predicted Date',
      sortable: true,
      render: (val) => formatDateLocale(val),
    },
    {
      key: 'confidence_score',
      label: 'Confidence',
      align: 'right',
      render: (val) => {
        const percent = Math.round((val || 0) * 100);
        const color = percent >= 75 ? 'text-green-400' : percent >= 50 ? 'text-yellow-400' : 'text-red-400';
        return <span className={color}>{percent}%</span>;
      },
    },
    {
      key: 'basis',
      label: 'Basis',
      render: (val) => val || 'manual',
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row);
            setShowDeleteConfirm(true);
          }}
          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/predicted-orders?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success('Predicted order deleted');
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          Add Prediction
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onRowClick={setEditRow}
        emptyMessage="No predicted orders found"
      />

      {/* Edit Modal */}
      <EditPredictedOrderModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        prediction={editRow}
        customers={customers}
        products={products}
        onSave={onUpdate}
      />

      {/* Create Modal */}
      <CreatePredictedOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        customers={customers}
        products={products}
        onSave={onUpdate}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        loading={loading}
        title="Delete Predicted Order"
        description="Are you sure you want to delete this predicted order? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </>
  );
}

function EditPredictedOrderModal({ isOpen, onClose, prediction, customers, products, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: prediction?.product_id || '',
    customer_id: prediction?.customer_id || '',
    predicted_quantity: prediction?.predicted_quantity || '',
    predicted_date: prediction?.predicted_date || '',
    confidence_score: prediction?.confidence_score || 0.8,
    basis: prediction?.basis || 'manual',
  });

  // Update form when prediction changes
  useEffect(() => {
    if (prediction) {
      setFormData({
        product_id: prediction.product_id || '',
        customer_id: prediction.customer_id || '',
        predicted_quantity: prediction.predicted_quantity || '',
        predicted_date: prediction.predicted_date || '',
        confidence_score: prediction.confidence_score || 0.8,
        basis: prediction.basis || 'manual',
      });
    }
  }, [prediction]);

  // Filter products by selected customer
  const filteredProducts = formData.customer_id
    ? products.filter((p) => p.customer_id === formData.customer_id)
    : products;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/predicted-orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prediction.id,
          product_id: formData.product_id,
          customer_id: formData.customer_id,
          predicted_quantity: parseInt(formData.predicted_quantity),
          predicted_date: formData.predicted_date,
          confidence_score: parseFloat(formData.confidence_score),
          basis: formData.basis,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Predicted order updated');
      onSave?.();
      onClose();
    } catch (error) {
      toast.error('Failed to update');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!prediction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Predicted Order"
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
        <Select
          label="Customer"
          value={formData.customer_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              customer_id: e.target.value,
              product_id: '', // Reset product when customer changes
            })
          }
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          required
        />

        <Select
          label="Product"
          value={formData.product_id}
          onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
          options={filteredProducts.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku})`,
          }))}
          placeholder={formData.customer_id ? 'Select product...' : 'Select customer first...'}
          disabled={!formData.customer_id}
          required
        />

        <Input
          label="Predicted Quantity"
          type="number"
          min="1"
          value={formData.predicted_quantity}
          onChange={(e) => setFormData({ ...formData, predicted_quantity: e.target.value })}
          required
        />

        <DateInput
          label="Predicted Date"
          value={formatDate(formData.predicted_date)}
          onChange={(e) => setFormData({ ...formData, predicted_date: e.target.value })}
          required
        />

        <Input
          label="Confidence Score (0-1)"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={formData.confidence_score}
          onChange={(e) => setFormData({ ...formData, confidence_score: e.target.value })}
        />

        <Select
          label="Basis"
          value={formData.basis}
          onChange={(e) => setFormData({ ...formData, basis: e.target.value })}
          options={[
            { value: 'manual', label: 'Manual Entry' },
            { value: 'historical', label: 'Historical Data' },
            { value: 'pattern', label: 'Pattern Analysis' },
            { value: 'customer_feedback', label: 'Customer Feedback' },
          ]}
        />
      </form>
    </Modal>
  );
}

function CreatePredictedOrderModal({ isOpen, onClose, customers, products, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    predicted_quantity: '',
    predicted_date: '',
    confidence_score: '0.8',
    basis: 'manual',
  });

  // Filter products by selected customer
  const filteredProducts = formData.customer_id
    ? products.filter((p) => p.customer_id === formData.customer_id)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/predicted-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: formData.product_id,
          customer_id: formData.customer_id,
          predicted_quantity: parseInt(formData.predicted_quantity),
          predicted_date: formData.predicted_date,
          confidence_score: parseFloat(formData.confidence_score),
          basis: formData.basis,
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      toast.success('Predicted order created');
      onSave?.();
      onClose();

      // Reset form
      setFormData({
        product_id: '',
        customer_id: '',
        predicted_quantity: '',
        predicted_date: '',
        confidence_score: '0.8',
        basis: 'manual',
      });
    } catch (error) {
      toast.error('Failed to create');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Predicted Order"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Customer"
          value={formData.customer_id}
          onChange={(e) =>
            setFormData({
              ...formData,
              customer_id: e.target.value,
              product_id: '', // Reset product when customer changes
            })
          }
          options={customers.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Select customer..."
          required
        />

        <Select
          label="Product"
          value={formData.product_id}
          onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
          options={filteredProducts.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku})`,
          }))}
          placeholder={formData.customer_id ? 'Select product...' : 'Select customer first...'}
          disabled={!formData.customer_id}
          required
        />

        <Input
          label="Predicted Quantity"
          type="number"
          min="1"
          value={formData.predicted_quantity}
          onChange={(e) => setFormData({ ...formData, predicted_quantity: e.target.value })}
          placeholder="Enter quantity..."
          required
        />

        <DateInput
          label="Predicted Date"
          value={formData.predicted_date}
          onChange={(e) => setFormData({ ...formData, predicted_date: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          required
        />

        <Input
          label="Confidence Score (0-1)"
          type="number"
          min="0"
          max="1"
          step="0.01"
          value={formData.confidence_score}
          onChange={(e) => setFormData({ ...formData, confidence_score: e.target.value })}
        />

        <Select
          label="Basis"
          value={formData.basis}
          onChange={(e) => setFormData({ ...formData, basis: e.target.value })}
          options={[
            { value: 'manual', label: 'Manual Entry' },
            { value: 'historical', label: 'Historical Data' },
            { value: 'pattern', label: 'Pattern Analysis' },
            { value: 'customer_feedback', label: 'Customer Feedback' },
          ]}
        />
      </form>
    </Modal>
  );
}
