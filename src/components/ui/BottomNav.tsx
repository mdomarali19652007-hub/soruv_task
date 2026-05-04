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
    <div
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-2',
        'pointer-events-none',
        className,
      )}
    >
      <nav
        aria-label="Primary"
        className="pointer-events-auto max-w-md mx-auto rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.25)]"
      >
        <ul className="flex items-stretch justify-around">
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            return (
              <li key={tab.key} className="flex-1 p-1.5">
                <button
                  type="button"
                  onClick={() => onSelect(tab.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group w-full h-14 flex flex-col items-center justify-center gap-1 rounded-2xl',
                    'transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    'active:scale-95',
                    isActive
                      ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:160%_160%] text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.6)] -translate-y-0.5'
                      : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60 hover:-translate-y-0.5',
                  )}
                >
                  <span
                    className={cn(
                      'relative inline-flex transition-transform duration-300',
                      isActive ? 'scale-110' : 'group-hover:scale-110',
                    )}
                  >
                    {tab.icon}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white/80 animate-bounce-soft">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </span>
                  <span className={cn(
                    'text-[10px] font-semibold leading-none tracking-wide transition-opacity duration-200',
                    isActive ? 'opacity-100' : 'opacity-80',
                  )}>
                    {tab.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
