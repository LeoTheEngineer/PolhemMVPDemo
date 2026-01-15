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
