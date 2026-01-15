# 11 - Orders Page

## Purpose

Create the Orders page with timeline visualization showing real orders and predicted orders, with filtering by customer/product and ability to edit orders.

---

## Prerequisites

- `10-dashboard-page.md` completed
- API routes for orders and predicted-orders working

---

## Files to Create

```
app/(dashboard)/orders/page.js
components/orders/
├── OrderTimeline.js
├── OrderCard.js
├── OrderEditModal.js
└── CreateOrderModal.js
```

---

## Implementation

### Step 1: Create `components/orders/OrderCard.js`

```javascript
'use client';

import { cn } from '@/lib/utils';
import { formatNumber, formatDateLocale } from '@/lib/utils';

export default function OrderCard({
  order,
  type = 'real', // 'real' or 'predicted'
  onClick,
  className,
}) {
  const isReal = type === 'real';
  const isReliable = type === 'predicted' ? order.confidence_score >= 0.75 : true;

  return (
    <div
      onClick={() => onClick?.(order)}
      className={cn(
        'p-3 rounded-lg border cursor-pointer transition-all hover:scale-105',
        isReal
          ? 'bg-green-500/20 border-green-500/30 hover:bg-green-500/30'
          : isReliable
          ? 'bg-yellow-500/20 border-yellow-500/30 hover:bg-yellow-500/30'
          : 'bg-red-500/20 border-red-500/30 hover:bg-red-500/30',
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            isReal
              ? 'bg-green-500/30 text-green-400'
              : isReliable
              ? 'bg-yellow-500/30 text-yellow-400'
              : 'bg-red-500/30 text-red-400'
          )}
        >
          {isReal ? 'Confirmed' : isReliable ? 'Predicted' : 'Unreliable'}
        </span>
      </div>

      <p className="text-lg font-bold text-white">
        {formatNumber(order.quantity || order.predicted_quantity)}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {formatDateLocale(order.due_date || order.predicted_date)}
      </p>

      {!isReal && order.confidence_score && (
        <div className="mt-2 pt-2 border-t border-zinc-700">
          <p className="text-xs text-zinc-500">
            Confidence: {Math.round(order.confidence_score * 100)}%
          </p>
        </div>
      )}
    </div>
  );
}
```

---

### Step 2: Create `components/orders/OrderEditModal.js`

```javascript
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import Modal from '@/components/shared/Modal';
import Button from '@/components/shared/Button';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Input, Select, DateInput } from '@/components/shared/FormFields';
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
    quantity: order?.quantity || order?.predicted_quantity || 0,
    date: order?.due_date || order?.predicted_date || '',
    status: order?.status || 'pending',
    notes: order?.notes || '',
  });

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
              status: formData.status,
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
          <div className="bg-zinc-800/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Customer:</span>{' '}
              {order.customer?.name || 'Unknown'}
            </p>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-500">Product:</span>{' '}
              {order.product?.name || 'Unknown'}
            </p>
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

          {type === 'real' && (
            <Select
              label="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'in_production', label: 'In Production' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          )}

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
```

---

### Step 3: Create `components/orders/CreateOrderModal.js`

```javascript
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
    priority: '5',
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
          priority: parseInt(formData.priority),
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
        priority: '5',
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

        <Select
          label="Priority"
          value={formData.priority}
          onChange={(e) =>
            setFormData({ ...formData, priority: e.target.value })
          }
          options={[
            { value: '1', label: '1 - Highest' },
            { value: '2', label: '2 - High' },
            { value: '3', label: '3 - Medium' },
            { value: '4', label: '4 - Low' },
            { value: '5', label: '5 - Lowest' },
          ]}
        />
      </form>
    </Modal>
  );
}
```

---

### Step 4: Create `components/orders/OrderTimeline.js`

```javascript
'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber, getWeekNumber } from '@/lib/utils';
import OrderCard from './OrderCard';

export default function OrderTimeline({
  orders = [],
  predictedOrders = [],
  onOrderClick,
  onPredictionClick,
}) {
  // Group orders by week
  const weeklyData = useMemo(() => {
    const weeks = {};

    // Process real orders
    orders.forEach((order) => {
      const weekNum = getWeekNumber(order.due_date);
      const year = new Date(order.due_date).getFullYear();
      const key = `${year}-W${weekNum}`;

      if (!weeks[key]) {
        weeks[key] = {
          week: weekNum,
          year,
          key,
          orders: [],
          predictions: [],
        };
      }
      weeks[key].orders.push(order);
    });

    // Process predicted orders
    predictedOrders.forEach((pred) => {
      const weekNum = getWeekNumber(pred.predicted_date);
      const year = new Date(pred.predicted_date).getFullYear();
      const key = `${year}-W${weekNum}`;

      if (!weeks[key]) {
        weeks[key] = {
          week: weekNum,
          year,
          key,
          orders: [],
          predictions: [],
        };
      }
      weeks[key].predictions.push(pred);
    });

    // Sort by date
    return Object.values(weeks).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.week - b.week;
    });
  }, [orders, predictedOrders]);

  if (weeklyData.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        No orders to display. Select a customer and product to view timeline.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {weeklyData.map((week) => (
          <WeekColumn
            key={week.key}
            week={week}
            onOrderClick={onOrderClick}
            onPredictionClick={onPredictionClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
          <span className="text-sm text-zinc-400">Confirmed Order</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500/50" />
          <span className="text-sm text-zinc-400">Predicted (Reliable)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
          <span className="text-sm text-zinc-400">Predicted (Unreliable)</span>
        </div>
      </div>
    </div>
  );
}

function WeekColumn({ week, onOrderClick, onPredictionClick }) {
  const totalOrders =
    week.orders.reduce((sum, o) => sum + o.quantity, 0) +
    week.predictions.reduce((sum, p) => sum + p.predicted_quantity, 0);

  return (
    <div className="flex flex-col min-w-[140px]">
      {/* Week header */}
      <div className="text-center pb-3 border-b border-zinc-800 mb-3">
        <p className="text-sm font-medium text-white">W{week.week}</p>
        <p className="text-xs text-zinc-500">{week.year}</p>
      </div>

      {/* Orders */}
      <div className="flex-1 space-y-2">
        {week.orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            type="real"
            onClick={() => onOrderClick?.(order)}
          />
        ))}

        {week.predictions.map((pred) => (
          <OrderCard
            key={pred.id}
            order={pred}
            type="predicted"
            onClick={() => onPredictionClick?.(pred)}
          />
        ))}
      </div>

      {/* Total */}
      <div className="pt-3 mt-3 border-t border-zinc-800 text-center">
        <p className="text-xs text-zinc-500">Total</p>
        <p className="text-sm font-medium text-white">
          {formatNumber(totalOrders)}
        </p>
      </div>
    </div>
  );
}
```

---

### Step 5: Create Orders Page `app/(dashboard)/orders/page.js`

```javascript
import { createServerClient } from '@/lib/supabase';
import OrdersPageClient from './OrdersPageClient';

async function getOrdersData() {
  const supabase = createServerClient();

  const [customersResult, productsResult, ordersResult, predictedResult] =
    await Promise.all([
      supabase.from('customers').select('id, name').order('name'),
      supabase
        .from('products')
        .select('id, name, sku, customer_id')
        .order('name'),
      supabase
        .from('orders')
        .select('*, customer:customers(id, name), product:products(id, name, sku)')
        .order('due_date'),
      supabase
        .from('predicted_orders')
        .select(
          '*, customer:customers(id, name), product:products(id, name, sku)'
        )
        .order('predicted_date'),
    ]);

  return {
    customers: customersResult.data || [],
    products: productsResult.data || [],
    orders: ordersResult.data || [],
    predictedOrders: predictedResult.data || [],
  };
}

export default async function OrdersPage() {
  const data = await getOrdersData();

  return <OrdersPageClient {...data} />;
}
```

---

### Step 6: Create `app/(dashboard)/orders/OrdersPageClient.js`

```javascript
'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter } from 'lucide-react';
import { Select } from '@/components/shared/FormFields';
import Button from '@/components/shared/Button';
import OrderTimeline from '@/components/orders/OrderTimeline';
import OrderEditModal from '@/components/orders/OrderEditModal';
import CreateOrderModal from '@/components/orders/CreateOrderModal';
import EmptyState from '@/components/shared/EmptyState';

export default function OrdersPageClient({
  customers,
  products,
  orders: initialOrders,
  predictedOrders: initialPredictions,
}) {
  const router = useRouter();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  
  // Modal states
  const [editOrder, setEditOrder] = useState(null);
  const [editPrediction, setEditPrediction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Filter products by customer
  const filteredProducts = selectedCustomer
    ? products.filter((p) => p.customer_id === selectedCustomer)
    : products;

  // Filter orders by selection
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      if (selectedCustomer && order.customer_id !== selectedCustomer)
        return false;
      if (selectedProduct && order.product_id !== selectedProduct) return false;
      return true;
    });
  }, [initialOrders, selectedCustomer, selectedProduct]);

  const filteredPredictions = useMemo(() => {
    return initialPredictions.filter((pred) => {
      if (selectedCustomer && pred.customer_id !== selectedCustomer)
        return false;
      if (selectedProduct && pred.product_id !== selectedProduct) return false;
      return true;
    });
  }, [initialPredictions, selectedCustomer, selectedProduct]);

  const handleOrderSave = () => {
    router.refresh();
    setEditOrder(null);
    setEditPrediction(null);
  };

  const handleOrderDelete = () => {
    router.refresh();
    setEditOrder(null);
    setEditPrediction(null);
  };

  const handleCreateSave = () => {
    router.refresh();
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-zinc-400 mt-1">
            View and manage orders and predictions
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4" />
          New Order
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-zinc-500" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Customer"
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setSelectedProduct(''); // Reset product
              }}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="All customers"
            />
            <Select
              label="Product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              options={filteredProducts.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.sku})`,
              }))}
              placeholder="All products"
              disabled={!selectedCustomer}
            />
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Confirmed Orders"
          value={filteredOrders.length}
        />
        <StatCard
          label="Total Quantity"
          value={filteredOrders.reduce((sum, o) => sum + o.quantity, 0)}
        />
        <StatCard
          label="Predictions"
          value={filteredPredictions.length}
        />
        <StatCard
          label="Reliable Predictions"
          value={filteredPredictions.filter((p) => p.confidence_score >= 0.75).length}
        />
      </div>

      {/* Timeline */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Order Timeline
        </h2>
        
        {filteredOrders.length === 0 && filteredPredictions.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No orders found"
            description={
              selectedCustomer || selectedProduct
                ? 'No orders match your current filters.'
                : 'Select a customer and product to view the timeline.'
            }
          />
        ) : (
          <OrderTimeline
            orders={filteredOrders}
            predictedOrders={filteredPredictions}
            onOrderClick={setEditOrder}
            onPredictionClick={setEditPrediction}
          />
        )}
      </div>

      {/* Edit Order Modal */}
      <OrderEditModal
        isOpen={!!editOrder}
        onClose={() => setEditOrder(null)}
        order={editOrder}
        type="real"
        onSave={handleOrderSave}
        onDelete={handleOrderDelete}
      />

      {/* Edit Prediction Modal */}
      <OrderEditModal
        isOpen={!!editPrediction}
        onClose={() => setEditPrediction(null)}
        order={editPrediction}
        type="predicted"
        onSave={handleOrderSave}
        onDelete={handleOrderDelete}
      />

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        customers={customers}
        products={products}
        onSave={handleCreateSave}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <p className="text-sm text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
```

---

## Folder Structure Commands

```bash
mkdir -p "app/(dashboard)/orders"
mkdir -p components/orders
```

---

## Verification

1. **Navigate to Orders page:** `http://localhost:3000/orders`

2. **Test filters:**
   - Select a customer → products should filter
   - Select a product → timeline should filter

3. **Test timeline:**
   - Should show orders grouped by week
   - Green cards = confirmed orders
   - Yellow/red cards = predictions

4. **Test modals:**
   - Click an order card → edit modal opens
   - Click "New Order" → create modal opens
   - Save changes → toast notification appears

---

## Next Step

Proceed to `12-settings-page.md` to create the Settings page with data tables.
