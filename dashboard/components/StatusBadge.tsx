import clsx from 'clsx';

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  pending: 'bg-orange-100 text-orange-800',
  overdue: 'bg-red-100 text-red-800',
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-green-100 text-green-800',
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

export function StatusBadge({ status, type = 'status' }: { status: string; type?: 'status' | 'priority' }) {
  const colors = type === 'priority' ? priorityColors : statusColors;
  return (
    <span className={clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colors[status] ?? 'bg-gray-100 text-gray-800')}>
      {status.replace('_', ' ')}
    </span>
  );
}
