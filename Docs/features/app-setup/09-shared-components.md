# 09 - Shared Components

## Purpose

Create reusable UI components used across the application: loading spinners, empty states, data tables, modals, and confirm dialogs.

---

## Prerequisites

- `08-layout-components.md` completed
- shadcn/ui components available

---

## Files to Create

```
components/
└── shared/
    ├── LoadingSpinner.js
    ├── EmptyState.js
    ├── DataTable.js
    ├── Modal.js
    ├── ConfirmDialog.js
    └── StatusBadge.js
```

---

## Implementation

### Step 1: Create `components/shared/LoadingSpinner.js`

```javascript
import { cn } from '@/lib/utils';

export default function LoadingSpinner({ size = 'default', className }) {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    default: 'w-8 h-8 border-2',
    large: 'w-12 h-12 border-3',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-zinc-700 border-t-accent',
        sizeClasses[size],
        className
      )}
    />
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="large" />
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
      <LoadingSpinner size="large" />
    </div>
  );
}
```

---

### Step 2: Create `components/shared/EmptyState.js`

```javascript
import { cn } from '@/lib/utils';
import { Inbox, Search, Calendar, AlertCircle } from 'lucide-react';

const icons = {
  default: Inbox,
  search: Search,
  calendar: Calendar,
  error: AlertCircle,
};

export default function EmptyState({
  icon = 'default',
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  action = null,
  className,
}) {
  const Icon = icons[icon] || icons.default;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-zinc-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
```

---

### Step 3: Create `components/shared/DataTable.js`

```javascript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data found',
  onRowClick = null,
  className,
}) {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = sortColumn
    ? [...data].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-sm font-semibold text-zinc-400 uppercase tracking-wide',
                  column.sortable && 'cursor-pointer hover:text-white select-none',
                  column.align === 'right' && 'text-right',
                  column.align === 'center' && 'text-center'
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-2">
                  {column.label}
                  {column.sortable && (
                    <span className="text-zinc-600">
                      {sortColumn === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-4 h-4" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className={cn(
                'hover:bg-zinc-800/50 transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center'
                  )}
                >
                  {column.render
                    ? column.render(row[column.key], row)
                    : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Step 4: Create `components/shared/Modal.js`

```javascript
'use client';

import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'default',
  className,
}) {
  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    default: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-zinc-900 rounded-lg border border-zinc-800 shadow-xl w-full mx-4',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### Step 5: Create `components/shared/ConfirmDialog.js`

```javascript
'use client';

import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // default, danger
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-accent hover:bg-accent/80 text-white'
            }`}
          >
            {loading ? 'Loading...' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        {variant === 'danger' && (
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-900/50 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        )}
        <p className="text-zinc-300">{description}</p>
      </div>
    </Modal>
  );
}
```

---

### Step 6: Create `components/shared/StatusBadge.js`

```javascript
import { cn } from '@/lib/utils';

const variants = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  default: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  accent: 'bg-accent/20 text-accent border-accent/30',
};

const statusVariants = {
  pending: 'warning',
  scheduled: 'info',
  in_production: 'accent',
  completed: 'success',
  cancelled: 'error',
  available: 'success',
  in_use: 'info',
  maintenance: 'warning',
  offline: 'error',
};

export default function StatusBadge({
  status,
  variant: customVariant,
  children,
  className,
}) {
  const variant = customVariant || statusVariants[status] || 'default';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border',
        variants[variant],
        className
      )}
    >
      {children || status?.replace(/_/g, ' ')}
    </span>
  );
}

// Confidence-based badge
export function ConfidenceBadge({ score, className }) {
  let variant = 'error';
  let label = 'Low';

  if (score >= 0.8) {
    variant = 'success';
    label = 'High';
  } else if (score >= 0.6) {
    variant = 'warning';
    label = 'Medium';
  }

  return (
    <StatusBadge variant={variant} className={className}>
      {label} ({Math.round(score * 100)}%)
    </StatusBadge>
  );
}
```

---

### Step 7: Create Form Components `components/shared/FormFields.js`

```javascript
'use client';

import { cn } from '@/lib/utils';

export function Input({
  label,
  error,
  className,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5 text-sm text-white',
          'placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Select({
  label,
  options = [],
  error,
  placeholder = 'Select...',
  className,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  rows = 3,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5 text-sm text-white',
          'placeholder:text-zinc-500',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed resize-none',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function DateInput({
  label,
  error,
  className,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <input
        type="date"
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[color-scheme:dark]',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function DateTimeInput({
  label,
  error,
  className,
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-zinc-400">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        className={cn(
          'w-full bg-zinc-800 border border-zinc-700 rounded-md px-4 py-2.5 text-sm text-white',
          'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          '[color-scheme:dark]',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
```

---

### Step 8: Create Button Component `components/shared/Button.js`

```javascript
import { cn } from '@/lib/utils';
import LoadingSpinner from './LoadingSpinner';

const variants = {
  primary: 'bg-accent hover:bg-accent/80 text-white',
  secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
  ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

const sizes = {
  small: 'px-3 py-1.5 text-sm',
  default: 'px-4 py-2 text-sm',
  large: 'px-6 py-3 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size="small" />}
      {children}
    </button>
  );
}
```

---

## Folder Structure Commands

```bash
mkdir -p components/shared
```

---

## Verification

1. **Check files exist:**
   ```bash
   ls -la components/shared/
   ```

2. **Import test:**
   Create a simple test page to verify components render:
   ```javascript
   // In any page temporarily
   import LoadingSpinner from '@/components/shared/LoadingSpinner';
   import EmptyState from '@/components/shared/EmptyState';
   import StatusBadge from '@/components/shared/StatusBadge';
   import Button from '@/components/shared/Button';
   ```

---

## Usage Examples

```javascript
// Loading state
<LoadingSpinner size="large" />

// Empty state
<EmptyState
  icon="search"
  title="No orders found"
  description="Try adjusting your filters"
  action={<Button onClick={() => {}}>Reset Filters</Button>}
/>

// Data table
<DataTable
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'quantity', label: 'Quantity', align: 'right' },
    { key: 'status', label: 'Status', render: (val) => <StatusBadge status={val} /> },
  ]}
  data={orders}
  onRowClick={(row) => handleRowClick(row)}
/>

// Modal
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Edit Order"
  footer={<Button onClick={handleSave}>Save</Button>}
>
  <form>...</form>
</Modal>

// Confirm dialog
<ConfirmDialog
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Order"
  message="Are you sure? This cannot be undone."
  variant="danger"
/>
```

---

## Next Step

Proceed to `10-dashboard-page.md` to create the main dashboard.
