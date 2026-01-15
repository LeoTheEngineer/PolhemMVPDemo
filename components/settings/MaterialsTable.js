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
    label: 'Density (g/cm3)',
    align: 'right',
    render: (val) => val?.toFixed(2) || '-',
  },
];

const editFields = [
  { key: 'name', label: 'Name', type: 'text' },
  { key: 'cost_per_kg', label: 'Cost per kg (SEK)', type: 'number', step: '0.01' },
  { key: 'density', label: 'Density (g/cm3)', type: 'number', step: '0.01' },
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
