# 12 - Settings Page

## Purpose

Create the Settings page with tabs for Materials, Machines, Products, Customers, and Model Settings. Each table supports read and edit operations.

---

## Prerequisites

- `11-orders-page.md` completed
- API routes for all entities working

---

## Files to Create

```
app/(dashboard)/settings/page.js
app/(dashboard)/settings/SettingsPageClient.js
components/settings/
├── MaterialsTable.js
├── MachinesTable.js
├── ProductsTable.js
├── CustomersTable.js
├── PredictedOrdersTable.js
├── ModelSettings.js
└── EditRowModal.js
```

---

## Implementation

### Step 1: Create Generic `components/settings/EditRowModal.js`

```javascript
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
```

---

### Step 2: Create `components/settings/MaterialsTable.js`

```javascript
'use client';

import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import EditRowModal from './EditRowModal';
import { formatNumber } from '@/lib/utils';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'cost_per_kg',
    label: 'Cost/kg (SEK)',
    sortable: true,
    align: 'right',
    render: (val) => formatNumber(val),
  },
  {
    key: 'density',
    label: 'Density (g/cm³)',
    align: 'right',
    render: (val) => val?.toFixed(2) || '-',
  },
];

const editFields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'cost_per_kg', label: 'Cost per kg (SEK)', type: 'number', step: '0.01' },
  { key: 'density', label: 'Density (g/cm³)', type: 'number', step: '0.01' },
];

export default function MaterialsTable({ data, onUpdate }) {
  const [editRow, setEditRow] = useState(null);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={setEditRow}
        emptyMessage="No materials found"
      />

      <EditRowModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Material"
        row={editRow}
        fields={editFields}
        endpoint="/api/materials"
        onSave={onUpdate}
      />
    </>
  );
}
```

---

### Step 3: Create `components/settings/MachinesTable.js`

```javascript
'use client';

import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import EditRowModal from './EditRowModal';
import StatusBadge from '@/components/shared/StatusBadge';
import { formatNumber } from '@/lib/utils';

const columns = [
  { key: 'code', label: 'Code', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'clamp_force',
    label: 'Clamp Force',
    align: 'right',
    render: (val) => `${formatNumber(val)} kN`,
  },
  {
    key: 'max_pressure',
    label: 'Max Pressure',
    align: 'right',
    render: (val) => `${formatNumber(val)} bar`,
  },
  {
    key: 'hourly_rate',
    label: 'Rate/hr',
    align: 'right',
    render: (val) => `${formatNumber(val)} SEK`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (val) => <StatusBadge status={val} />,
  },
];

const editFields = [
  { key: 'code', label: 'Machine Code', type: 'text' },
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'clamp_force', label: 'Clamp Force (kN)', type: 'number' },
  { key: 'max_pressure', label: 'Max Pressure (bar)', type: 'number', step: '0.01' },
  { key: 'max_temperature', label: 'Max Temperature (°C)', type: 'number', step: '0.01' },
  { key: 'hourly_rate', label: 'Hourly Rate (SEK)', type: 'number', step: '0.01' },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'available', label: 'Available' },
      { value: 'in_use', label: 'In Use' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'offline', label: 'Offline' },
    ],
  },
];

export default function MachinesTable({ data, onUpdate }) {
  const [editRow, setEditRow] = useState(null);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={setEditRow}
        emptyMessage="No machines found"
      />

      <EditRowModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Machine"
        row={editRow}
        fields={editFields}
        endpoint="/api/machines"
        onSave={onUpdate}
      />
    </>
  );
}
```

---

### Step 4: Create `components/settings/ProductsTable.js`

```javascript
'use client';

import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import EditRowModal from './EditRowModal';
import { formatNumber } from '@/lib/utils';

export default function ProductsTable({ data, customers, materials, onUpdate }) {
  const [editRow, setEditRow] = useState(null);

  const columns = [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    {
      key: 'customer',
      label: 'Customer',
      render: (val) => val?.name || '-',
    },
    {
      key: 'material',
      label: 'Material',
      render: (val) => val?.name || '-',
    },
    {
      key: 'cycle_time',
      label: 'Cycle Time',
      align: 'right',
      render: (val) => `${val}s`,
    },
    {
      key: 'cavity_count',
      label: 'Cavities',
      align: 'right',
    },
    {
      key: 'in_stock',
      label: 'In Stock',
      align: 'right',
      render: (val) => formatNumber(val),
    },
  ];

  const editFields = [
    { key: 'sku', label: 'SKU', type: 'text' },
    { key: 'name', label: 'Name', type: 'text' },
    {
      key: 'customer_id',
      label: 'Customer',
      type: 'select',
      options: customers.map((c) => ({ value: c.id, label: c.name })),
    },
    {
      key: 'material_id',
      label: 'Material',
      type: 'select',
      options: materials.map((m) => ({ value: m.id, label: m.name })),
    },
    { key: 'cycle_time', label: 'Cycle Time (seconds)', type: 'number' },
    { key: 'cavity_count', label: 'Cavity Count', type: 'number' },
    { key: 'weight_per_unit', label: 'Weight per Unit (g)', type: 'number', step: '0.01' },
    { key: 'required_pressure', label: 'Required Pressure (bar)', type: 'number', step: '0.01' },
    { key: 'required_temperature', label: 'Required Temperature (°C)', type: 'number', step: '0.01' },
    { key: 'in_stock', label: 'In Stock', type: 'number' },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={setEditRow}
        emptyMessage="No products found"
      />

      <EditRowModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Product"
        row={editRow}
        fields={editFields}
        endpoint="/api/products"
        onSave={onUpdate}
      />
    </>
  );
}
```

---

### Step 5: Create `components/settings/CustomersTable.js`

```javascript
'use client';

import { useState } from 'react';
import DataTable from '@/components/shared/DataTable';
import EditRowModal from './EditRowModal';
import { formatDateLocale } from '@/lib/utils';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'created_at',
    label: 'Created',
    render: (val) => formatDateLocale(val),
  },
];

const editFields = [{ key: 'name', label: 'Customer Name', type: 'text' }];

export default function CustomersTable({ data, onUpdate }) {
  const [editRow, setEditRow] = useState(null);

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={setEditRow}
        emptyMessage="No customers found"
      />

      <EditRowModal
        isOpen={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Customer"
        row={editRow}
        fields={editFields}
        endpoint="/api/customers"
        onSave={onUpdate}
      />
    </>
  );
}
```

---

### Step 6: Create `components/settings/PredictedOrdersTable.js`

```javascript
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
```

---

### Step 7: Create `components/settings/ModelSettings.js`

```javascript
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
            label="Storage Cost (SEK/m³/day)"
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
```

---

### Step 8: Create Settings Page `app/(dashboard)/settings/page.js`

```javascript
import { createServerClient } from '@/lib/supabase';
import SettingsPageClient from './SettingsPageClient';

async function getSettingsData() {
  const supabase = createServerClient();

  const [materialsResult, machinesResult, productsResult, customersResult, predictedOrdersResult, settingsResult] =
    await Promise.all([
      supabase.from('materials').select('*').order('name'),
      supabase.from('machines').select('*').order('code'),
      supabase.from('products').select('*, customer:customers(id, name), material:materials(id, name)').order('name'),
      supabase.from('customers').select('*').order('name'),
      supabase.from('predicted_orders').select('*, customer:customers(id, name), product:products(id, name, sku)').order('predicted_date'),
      supabase.from('settings').select('*').eq('id', 'main').single(),
    ]);

  return {
    materials: materialsResult.data || [],
    machines: machinesResult.data || [],
    products: productsResult.data || [],
    customers: customersResult.data || [],
    predictedOrders: predictedOrdersResult.data || [],
    settings: settingsResult.data,
  };
}

export default async function SettingsPage() {
  const data = await getSettingsData();
  return <SettingsPageClient {...data} />;
}
```

---

### Step 9: Create `app/(dashboard)/settings/SettingsPageClient.js`

```javascript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import MaterialsTable from '@/components/settings/MaterialsTable';
import MachinesTable from '@/components/settings/MachinesTable';
import ProductsTable from '@/components/settings/ProductsTable';
import CustomersTable from '@/components/settings/CustomersTable';
import PredictedOrdersTable from '@/components/settings/PredictedOrdersTable';
import ModelSettings from '@/components/settings/ModelSettings';

const tabs = [
  { id: 'materials', label: 'Materials' },
  { id: 'machines', label: 'Machines' },
  { id: 'products', label: 'Products' },
  { id: 'customers', label: 'Customers' },
  { id: 'predictions', label: 'Predicted Orders' },
  { id: 'models', label: 'Model Settings' },
];

export default function SettingsPageClient({
  materials,
  machines,
  products,
  customers,
  predictedOrders,
  settings,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('materials');

  const handleUpdate = () => {
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">
          Manage system data and configuration
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-800">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-white'
                  : 'text-zinc-400 hover:text-white'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        {activeTab === 'materials' && (
          <MaterialsTable data={materials} onUpdate={handleUpdate} />
        )}
        {activeTab === 'machines' && (
          <MachinesTable data={machines} onUpdate={handleUpdate} />
        )}
        {activeTab === 'products' && (
          <ProductsTable
            data={products}
            customers={customers}
            materials={materials}
            onUpdate={handleUpdate}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersTable data={customers} onUpdate={handleUpdate} />
        )}
        {activeTab === 'predictions' && (
          <PredictedOrdersTable
            data={predictedOrders}
            customers={customers}
            products={products}
            onUpdate={handleUpdate}
          />
        )}
        {activeTab === 'models' && (
          <ModelSettings settings={settings} onUpdate={handleUpdate} />
        )}
      </div>
    </div>
  );
}
```

---

## Folder Structure Commands

```bash
mkdir -p "app/(dashboard)/settings"
mkdir -p components/settings
```

---

## Verification

1. **Navigate to Settings:** `http://localhost:3000/settings`

2. **Test tabs:** Click each tab to switch views

3. **Test edit:** Click any row to open edit modal, make changes, save

4. **Test model settings:** Adjust values, click Save

---

## Next Step

Proceed to `13-schedule-page.md` to create the Schedule page with Gantt chart and drag-drop.
