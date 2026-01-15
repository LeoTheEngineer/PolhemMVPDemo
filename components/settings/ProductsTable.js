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
    { key: 'required_temperature', label: 'Required Temperature (C)', type: 'number', step: '0.01' },
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
