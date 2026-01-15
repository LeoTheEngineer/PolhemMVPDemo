'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  // Initialize with URL param or default to 'materials'
  const [activeTab, setActiveTab] = useState(() => {
    const validTabs = tabs.map(t => t.id);
    return validTabs.includes(tabFromUrl) ? tabFromUrl : 'materials';
  });

  // Update active tab when URL changes
  useEffect(() => {
    const validTabs = tabs.map(t => t.id);
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
