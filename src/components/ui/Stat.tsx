/**
 * Stat — labelled numeric display for balances, counts, earnings.
 *
 * Replaces the `text-[8px] uppercase tracking-widest` label /
 * `glitch-text` value pattern called out in the redesign plan §1.
 * The label sits above the value at body size; the value is the only
 * heavy element in the block.
 */
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface StatProps {
  label: ReactNode;
  value: ReactNode;
  /** Optional secondary line (e.g. "+৳12 today"). */
  hint?: ReactNode;
  /** Optional tone for the value colour. */
  tone?: 'default' | 'success' | 'danger';
  /** Optional leading icon, sized 20px. */
  icon?: ReactNode;
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<StatProps['tone']>, string> = {
  default: 'text-slate-900',
  success: 'text-green-600',
  danger: 'text-red-600',
};

export function Stat({
  label,
  value,
  hint,
  tone = 'default',
  icon,
  className,
}: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        {icon && (
          <span className="inline-flex items-center text-slate-500" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{label}</span>
      </div>
      <div className={cn('text-2xl font-semibold tabular-nums', TONE_CLASSES[tone])}>
        {value}
      </div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
