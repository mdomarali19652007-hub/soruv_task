/**
 * Chip — pill-shaped tag/filter element.
 *
 * Two roles:
 *   - static (no `onClick`): a label like "Pending" / "Approved"
 *   - selectable (`onClick` + `selected`): used inside segmented controls
 *     and quick-filter rows on the wallet history screen.
 *
 * Tones map to status colours from the redesign tokens.
 */
import type { ReactNode } from 'react';
import { cn } from './cn';

export type ChipTone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning';

export interface ChipProps {
  children: ReactNode;
  tone?: ChipTone;
  onClick?: () => void;
  selected?: boolean;
  leadingIcon?: ReactNode;
  className?: string;
  'aria-label'?: string;
}

const TONE_CLASSES: Record<ChipTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  primary: 'bg-blue-100 text-blue-700',
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
};

export function Chip({
  children,
  tone = 'neutral',
  onClick,
  selected = false,
  leadingIcon,
  className,
  ...rest
}: ChipProps) {
  const baseClasses = cn(
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
    'transition-all duration-200',
    TONE_CLASSES[tone],
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        className={cn(
          baseClasses,
          'min-h-[32px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
          'hover:-translate-y-0.5 active:translate-y-0 active:scale-95',
          selected
            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_4px_14px_-4px_rgba(37,99,235,0.55)] hover:shadow-[0_6px_18px_-4px_rgba(37,99,235,0.65)]'
            : 'hover:bg-slate-200 hover:shadow-sm',
        )}
        {...rest}
      >
        {leadingIcon && <span aria-hidden="true">{leadingIcon}</span>}
        {children}
      </button>
    );
  }

  return (
    <span className={baseClasses} {...rest}>
      {leadingIcon && <span aria-hidden="true">{leadingIcon}</span>}
      {children}
    </span>
  );
}
