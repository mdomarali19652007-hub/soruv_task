/**
 * BottomNav — persistent 5-tab bottom navigation for the redesign shell.
 *
 * Implements the navigation contract from
 * `plans/user-friendly-ui-redesign-for-production-launch.md` §3:
 * one fixed bottom bar so users never wonder "how do I get back".
 *
 * The component is presentational. It receives the active tab key and
 * calls `onSelect` on tap; the parent maps tab keys to its own routing
 * scheme (in this codebase, `setView(...)` from `src/types.ts`).
 */
import type { ReactNode } from 'react';
import { cn } from './cn';

export interface BottomNavTab {
  /** Stable key passed back to `onSelect`. */
  key: string;
  /** Visible label rendered under the icon. */
  label: ReactNode;
  /** Lucide icon (or any 24px React node). */
  icon: ReactNode;
  /** Optional badge count (e.g. unread notifications). */
  badge?: number;
}

export interface BottomNavProps {
  tabs: BottomNavTab[];
  active: string;
  onSelect: (key: string) => void;
  className?: string;
}

export function BottomNav({ tabs, active, onSelect, className }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur',
        'border-t border-slate-200',
        // Respect iOS home indicator and Android nav gesture inset.
        'pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="flex items-stretch justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <li key={tab.key} className="flex-1">
              <button
                type="button"
                onClick={() => onSelect(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'w-full h-16 flex flex-col items-center justify-center gap-0.5',
                  'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                  isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                <span className="relative inline-flex">
                  {tab.icon}
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold flex items-center justify-center">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] font-medium leading-none">
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
