/**
 * SectionHeader — a sentence-case heading + optional trailing action.
 *
 * Replaces the legacy "TINY ALL-CAPS TRACKING-WIDEST" labels called
 * out in the redesign plan §1. Title is rendered as an `<h2>` so the
 * page document outline is sensible for screen readers.
 */
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface SectionHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-3 mb-3', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-900 truncate">{title}</h2>
        {subtitle && (
          <p className="text-sm text-slate-600 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
