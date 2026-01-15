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
  { key: 'max_temperature', label: 'Max Temperature (C)', type: 'number', step: '0.01' },
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
