/**
 * StatusTabs — horizontal pill-tab strip used by lists with status
 * filters (Withdraw history, Payment history, …).
 *
 * The active tab uses the brand indigo→violet gradient; inactive tabs
 * stay in a soft glass surface so the strip blends with the redesign
 * shell.
 */
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface StatusTab<T extends string = string> {
  key: T;
  label: ReactNode;
  /** Optional badge count rendered on the right of the label. */
  count?: number;
}

export interface StatusTabsProps<T extends string = string> {
  tabs: StatusTab<T>[];
  active: T;
  onSelect: (key: T) => void;
  className?: string;
}

export function StatusTabs<T extends string = string>({
  tabs,
  active,
  onSelect,
  className,
}: StatusTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label="status filter"
      className={cn(
        '-mx-4 px-4 overflow-x-auto no-scrollbar',
        className,
      )}
    >
      <div className="inline-flex items-center gap-2 min-w-full">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onSelect(tab.key)}
              className={cn(
                'shrink-0 inline-flex items-center gap-1.5 px-4 h-9 rounded-full text-sm font-semibold',
                'transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.6)]'
                  : 'bg-white/70 backdrop-blur border border-white/60 text-slate-600 hover:bg-white',
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-white/25 text-white'
                      : 'bg-indigo-100 text-indigo-700',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
