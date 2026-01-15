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
