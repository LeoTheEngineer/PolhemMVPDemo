import { cn } from '@/lib/utils';

const variants = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  default: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  accent: 'bg-accent/20 text-accent border-accent/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const statusVariants = {
  pending: 'warning',
  scheduled: 'info',
  in_production: 'purple',
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
