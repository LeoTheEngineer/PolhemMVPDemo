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
