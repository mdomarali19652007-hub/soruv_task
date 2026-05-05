/**
 * IncomeBreakdownList — Wallet dashboard list of period totals.
 *
 * Renders one tappable row per period (Today / Yesterday / 7d / 30d /
 * Total). Each row shows a coloured icon tile, the period title, the
 * formatted amount and a chevron — matching the competitor reference
 * but in the existing indigo / violet glass palette.
 *
 * The component is dumb data-in / event-out: the parent decides what
 * to show in the resulting `IncomeDetailView`.
 */
import type { ReactNode } from 'react';
import { CalendarDays, ChevronRight, Coins, Wallet, TrendingUp } from 'lucide-react';
import { cn } from './cn';

export type IncomePeriod =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'total';

export interface IncomeBreakdownItem {
  period: IncomePeriod;
  /** Display title (Bangla). */
  title: string;
  /** Optional secondary line (e.g. date range). */
  subtitle?: string;
  /** BDT amount. */
  amount: number;
}

export interface IncomeBreakdownListProps {
  items: IncomeBreakdownItem[];
  onSelect: (period: IncomePeriod, amount: number, title: string) => void;
  className?: string;
}

const ICON_BY_PERIOD: Record<IncomePeriod, { icon: ReactNode; bg: string }> = {
  today: { icon: <Coins className="w-5 h-5" />, bg: 'from-emerald-500 to-teal-500' },
  yesterday: { icon: <CalendarDays className="w-5 h-5" />, bg: 'from-amber-500 to-orange-500' },
  last7: { icon: <TrendingUp className="w-5 h-5" />, bg: 'from-sky-500 to-indigo-500' },
  last30: { icon: <TrendingUp className="w-5 h-5" />, bg: 'from-violet-500 to-fuchsia-500' },
  total: { icon: <Wallet className="w-5 h-5" />, bg: 'from-indigo-600 to-violet-700' },
};

function formatBdt(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function IncomeBreakdownList({ items, onSelect, className }: IncomeBreakdownListProps) {
  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((item) => {
        const { icon, bg } = ICON_BY_PERIOD[item.period];
        return (
          <li key={item.period}>
            <button
              type="button"
              onClick={() => onSelect(item.period, item.amount, item.title)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left',
                'bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_6px_18px_-8px_rgba(15,23,42,0.12)]',
                'hover:shadow-[0_10px_28px_-8px_rgba(15,23,42,0.18)] hover:-translate-y-0.5',
                'transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              )}
            >
              <span
                className={cn(
                  'shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br text-white inline-flex items-center justify-center shadow-sm',
                  bg,
                )}
              >
                {icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-slate-900 truncate">
                  {item.title}
                </span>
                {item.subtitle && (
                  <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                    {item.subtitle}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-base font-bold text-indigo-600 tabular-nums">
                  ৳ {formatBdt(item.amount)}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 text-pink-500 shrink-0" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
