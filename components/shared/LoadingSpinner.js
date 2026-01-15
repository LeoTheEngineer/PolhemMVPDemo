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
