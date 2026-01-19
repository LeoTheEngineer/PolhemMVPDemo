'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Filter, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, Input } from '@/components/shared/FormFields';
import Button from '@/components/shared/Button';
import DataTable from '@/components/shared/DataTable';
import OrderTimeline from '@/components/orders/OrderTimeline';
import OrderEditModal from '@/components/orders/OrderEditModal';
import CreateOrderModal from '@/components/orders/CreateOrderModal';
import EmptyState from '@/components/shared/EmptyState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { formatNumber, formatDateLocale } from '@/lib/utils';
import { toast } from 'sonner';

const tabs = [
  { id: 'timeline', label: 'Timeline' },
  { id: 'orders', label: 'Orders' },
  { id: 'predictions', label: 'Predicted Orders' },
];

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_production', label: 'In Production' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const orderTypeOptions = [
  { value: 'real', label: 'Real Orders Only' },
  { value: 'predicted', label: 'Predicted Only' },
];

export default function OrdersPageClient({
  customers,
  products,
  orders: initialOrders,
  predictedOrders: initialPredictions,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('timeline');
  
  // Filter states
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState('all');
  const [minQuantity, setMinQuantity] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  
  // Modal states
  const [editOrder, setEditOrder] = useState(null);
  const [editPrediction, setEditPrediction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('order');
  const [loading, setLoading] = useState(false);

  // Check if any filters are active
  const hasActiveFilters = selectedCustomer || selectedProduct || selectedStatus || 
    selectedOrderType !== 'all' || minQuantity || maxQuantity;

  // Clear all filters
  const clearFilters = () => {
    setSelectedCustomer('');
    setSelectedProduct('');
    setSelectedStatus('');
    setSelectedOrderType('all');
    setMinQuantity('');
    setMaxQuantity('');
  };

  // Filter products by customer
  const filteredProducts = selectedCustomer
    ? products.filter((p) => p.customer_id === selectedCustomer)
    : products;

  // Filter orders by all criteria
  const filteredOrders = useMemo(() => {
    // If order type is predicted only, return empty
    if (selectedOrderType === 'predicted') return [];
    
    return initialOrders.filter((order) => {
      if (selectedCustomer && order.customer_id !== selectedCustomer) return false;
      if (selectedProduct && order.product_id !== selectedProduct) return false;
      if (selectedStatus && order.status !== selectedStatus) return false;
      
      const qty = order.quantity;
      if (minQuantity && qty < parseInt(minQuantity)) return false;
      if (maxQuantity && qty > parseInt(maxQuantity)) return false;
      
      return true;
    });
  }, [initialOrders, selectedCustomer, selectedProduct, selectedStatus, selectedOrderType, minQuantity, maxQuantity]);

  // Filter predictions by all criteria
  const filteredPredictions = useMemo(() => {
    // If order type is real only, return empty
    if (selectedOrderType === 'real') return [];
    
    return initialPredictions.filter((pred) => {
      if (selectedCustomer && pred.customer_id !== selectedCustomer) return false;
      if (selectedProduct && pred.product_id !== selectedProduct) return false;
      // Status filter applies to predictions too (they have calculated status)
      if (selectedStatus && pred.status !== selectedStatus) return false;
      
      const qty = pred.predicted_quantity;
      if (minQuantity && qty < parseInt(minQuantity)) return false;
      if (maxQuantity && qty > parseInt(maxQuantity)) return false;
      
      return true;
    });
  }, [initialPredictions, selectedCustomer, selectedProduct, selectedStatus, selectedOrderType, minQuantity, maxQuantity]);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setLoading(true);

    try {
      const endpoint = deleteType === 'prediction' 
        ? `/api/predicted-orders?id=${deleteTarget.id}`
        : `/api/orders?id=${deleteTarget.id}`;
      
      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) throw new Error('Failed to delete');

      toast.success(deleteType === 'prediction' ? 'Predicted order deleted' : 'Order deleted');
      router.refresh();
    } catch (error) {
      toast.error('Failed to delete');
      console.error(error);
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // Orders table columns
  const ordersColumns = [
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
      key: 'quantity',
      label: 'Quantity',
      align: 'right',
      sortable: true,
      render: (val) => formatNumber(val),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (val) => formatDateLocale(val),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={cn(
          'px-2 py-1 rounded text-xs font-medium capitalize',
          val === 'completed' && 'bg-green-500/20 text-green-400',
          val === 'in_production' && 'bg-blue-500/20 text-blue-400',
          val === 'scheduled' && 'bg-yellow-500/20 text-yellow-400',
          val === 'pending' && 'bg-zinc-500/20 text-zinc-400',
          val === 'cancelled' && 'bg-red-500/20 text-red-400'
        )}>
          {val?.replace('_', ' ') || 'pending'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row);
            setDeleteType('order');
            setShowDeleteConfirm(true);
          }}
          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // Predicted orders table columns
  const predictionsColumns = [
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
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row);
            setDeleteType('prediction');
            setShowDeleteConfirm(true);
          }}
          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

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
        {activeTab === 'orders' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        )}
      </div>

      {/* Sub-tabs */}
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

      {/* Filters - show on timeline tab */}
      {activeTab === 'timeline' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-start gap-4">
            <Filter className="w-5 h-5 text-zinc-500 mt-8" />
            <div className="flex-1 space-y-4">
              {/* Row 1: Customer, Product, Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Customer"
                  value={selectedCustomer}
                  onChange={(e) => {
                    setSelectedCustomer(e.target.value);
                    setSelectedProduct('');
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
                <Select
                  label="Status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  options={statusOptions}
                  placeholder="All statuses"
                />
              </div>
              
              {/* Row 2: Order Type, Min Quantity, Max Quantity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  label="Order Type"
                  value={selectedOrderType}
                  onChange={(e) => setSelectedOrderType(e.target.value)}
                  options={orderTypeOptions}
                  placeholder="All Orders"
                />
                <Input
                  label="Min Quantity"
                  type="number"
                  min="0"
                  value={minQuantity}
                  onChange={(e) => setMinQuantity(e.target.value)}
                  placeholder="No minimum"
                />
                <Input
                  label="Max Quantity"
                  type="number"
                  min="0"
                  value={maxQuantity}
                  onChange={(e) => setMaxQuantity(e.target.value)}
                  placeholder="No maximum"
                />
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        {activeTab === 'timeline' && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Order Timeline
              </h2>
              {(filteredOrders.length > 0 || filteredPredictions.length > 0) && (
                <p className="text-sm text-zinc-500">
                  {filteredOrders.length} orders, {filteredPredictions.length} predictions
                </p>
              )}
            </div>
            
            {filteredOrders.length === 0 && filteredPredictions.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No orders found"
                description={
                  hasActiveFilters
                    ? 'No orders match your current filters. Try adjusting your filters.'
                    : 'No orders to display.'
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
          </>
        )}

        {activeTab === 'orders' && (
          <DataTable
            columns={ordersColumns}
            data={filteredOrders}
            onRowClick={setEditOrder}
            emptyMessage="No orders found"
          />
        )}

        {activeTab === 'predictions' && (
          <DataTable
            columns={predictionsColumns}
            data={filteredPredictions}
            onRowClick={setEditPrediction}
            emptyMessage="No predicted orders found"
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        loading={loading}
        title={deleteType === 'prediction' ? 'Delete Predicted Order' : 'Delete Order'}
        description="Are you sure you want to delete this? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
