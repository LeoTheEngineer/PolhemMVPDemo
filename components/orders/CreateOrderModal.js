'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import { Input, Select, DateInput } from '@/components/shared/FormFields';

export default function CreateOrderModal({
  isOpen,
  onClose,
  customers,
  products,
  onSave,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: '',
    product_id: '',
    quantity: '',
    due_date: '',
  });

  // Filter products by selected customer
  const filteredProducts = formData.customer_id
    ? products.filter((p) => p.customer_id === formData.customer_id)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: formData.customer_id,
          product_id: formData.product_id,
          quantity: parseInt(formData.quantity),
          due_date: formData.due_date,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const result = await response.json();
      
      toast.success('Order created successfully');

      onSave?.(result.data);
      onClose();
      
      // Reset form
      setFormData({
        customer_id: '',
        product_id: '',
        quantity: '',
        due_date: '',
      });
    } catch (error) {
      toast.error('Failed to create order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Order"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create Order
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
          onChange={(e) =>
            setFormData({ ...formData, product_id: e.target.value })
          }
          options={filteredProducts.map((p) => ({
            value: p.id,
            label: `${p.name} (${p.sku})`,
          }))}
          placeholder={
            formData.customer_id
              ? 'Select product...'
              : 'Select customer first...'
          }
          disabled={!formData.customer_id}
          required
        />

        <Input
          label="Quantity"
          type="number"
          min="1"
          value={formData.quantity}
          onChange={(e) =>
            setFormData({ ...formData, quantity: e.target.value })
          }
          placeholder="Enter quantity..."
          required
        />

        <DateInput
          label="Due Date"
          value={formData.due_date}
          onChange={(e) =>
            setFormData({ ...formData, due_date: e.target.value })
          }
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </form>
    </Modal>
  );
}
