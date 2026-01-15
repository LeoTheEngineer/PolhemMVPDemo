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

  // Filter orders by selection (statuses already calculated server-side and synced to DB)
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      if (selectedCustomer && order.customer_id !== selectedCustomer)
        return false;
      if (selectedProduct && order.product_id !== selectedProduct) return false;
      return true;
    });
  }, [initialOrders, selectedCustomer, selectedProduct]);

  // Filter predictions (status already calculated server-side)
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
