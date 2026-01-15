'use client';

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
