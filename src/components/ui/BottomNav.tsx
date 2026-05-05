/**
 * BottomNav — persistent bottom navigation for the redesign shell.
 *
 * Implements the navigation contract from
 * `plans/user-friendly-ui-redesign-for-production-launch.md` §3 plus
 * the competitor-aligned restructure that adds an optional
 * `centerFloating` tab variant. When a tab is marked
 * `centerFloating: true`, it renders as an elevated pill that visually
 * breaks the bar's top edge — mirroring the "central CTA" pattern
 * common in fintech / earning apps.
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
  /**
   * When true the tab renders as an elevated floating pill that
   * visually breaks the top edge of the nav bar. Intended for the
   * single "primary action" tab (e.g. the center "Products" / "Agent
   * Services" button on the competitor reference design). Only one
   * tab should set this flag.
   */
  centerFloating?: boolean;
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
        // `overflow-visible` is required so the floating tab's elevated
        // bubble is not clipped by the bar's rounded edge.
        className="pointer-events-auto max-w-md mx-auto rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.25)] overflow-visible"
      >
        <ul className="flex items-stretch justify-around overflow-visible">
          {tabs.map((tab) => {
            const isActive = tab.key === active;
            const isFloating = Boolean(tab.centerFloating);
            return (
              <li
                key={tab.key}
                className={cn(
                  'flex-1 p-1.5',
                  isFloating && 'flex items-start justify-center',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(tab.key)}
                  aria-current={isActive ? 'page' : undefined}
                  data-floating={isFloating || undefined}
                  className={cn(
                    'group flex flex-col items-center justify-center gap-1 rounded-2xl',
                    'transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                    'active:scale-95',
                    isFloating
                      ? cn(
                          // Larger pill, lifted above the bar.
                          'w-16 h-16 -mt-7 rounded-full text-white',
                          'bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 bg-[length:160%_160%]',
                          'shadow-[0_14px_30px_-8px_rgba(99,102,241,0.65)] ring-4 ring-white/80',
                          'hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-8px_rgba(99,102,241,0.75)]',
                        )
                      : cn(
                          'w-full h-14',
                          isActive
                            ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:160%_160%] text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.6)] -translate-y-0.5'
                            : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60 hover:-translate-y-0.5',
                        ),
                  )}
                >
                  <span
                    className={cn(
                      'relative inline-flex transition-transform duration-300',
                      isFloating
                        ? 'scale-110'
                        : isActive
                          ? 'scale-110'
                          : 'group-hover:scale-110',
                    )}
                  >
                    {tab.icon}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md ring-2 ring-white/80 animate-bounce-soft">
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </span>
                    )}
                  </span>
                  {!isFloating && (
                    <span
                      className={cn(
                        'text-[10px] font-semibold leading-none tracking-wide transition-opacity duration-200',
                        isActive ? 'opacity-100' : 'opacity-80',
                      )}
                    >
                      {tab.label}
                    </span>
                  )}
                </button>
                {isFloating && (
                  <span className="sr-only">{tab.label}</span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

/**
 * Class-name builder used by the BottomNav button. Exported so unit
 * tests can assert the floating-variant styling without rendering
 * React (the test runner is `node`, not `jsdom`).
 */
export function bottomNavButtonClassName({
  isActive,
  isFloating,
}: {
  isActive: boolean;
  isFloating: boolean;
}): string {
  return cn(
    'group flex flex-col items-center justify-center gap-1 rounded-2xl',
    'transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
    'active:scale-95',
    isFloating
      ? cn(
          'w-16 h-16 -mt-7 rounded-full text-white',
          'bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 bg-[length:160%_160%]',
          'shadow-[0_14px_30px_-8px_rgba(99,102,241,0.65)] ring-4 ring-white/80',
          'hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-8px_rgba(99,102,241,0.75)]',
        )
      : cn(
          'w-full h-14',
          isActive
            ? 'bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 bg-[length:160%_160%] text-white shadow-[0_6px_18px_-6px_rgba(99,102,241,0.6)] -translate-y-0.5'
            : 'text-slate-500 hover:text-indigo-600 hover:bg-white/60 hover:-translate-y-0.5',
        ),
  );
}
