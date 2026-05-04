/**
 * EmptyState — placeholder for empty lists, search-no-results, and
 * "you have no transactions yet" panels.
 *
 * Listed as a required primitive in the redesign plan §8: every list
 * must have explicit loading, empty, and error states.
 */
import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { cn } from './cn';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center px-6 py-10 gap-3',
        className,
      )}
      role="status"
    >
      <div
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 flex items-center justify-center text-indigo-500 animate-float shadow-inner"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="w-8 h-8" />}
      </div>
      <div className="space-y-1">
        <p className="text-base font-semibold text-slate-900">{title}</p>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
