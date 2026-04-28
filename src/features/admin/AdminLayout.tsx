/**
 * AdminLayout — dark-themed shell for the admin panel that mirrors the
 * "AdminPanel" reference design (left sidebar + top header + main pane).
 *
 * Design summary
 * --------------
 * - Fixed left sidebar (~256px) with the brand mark, grouped nav links
 *   and active-state highlighting. On screens narrower than `lg` the
 *   sidebar collapses into an off-canvas drawer toggled by a hamburger
 *   button in the header.
 * - Header card: hamburger toggle, screen title, notification bell.
 * - Content area: dark page background with rounded section cards.
 *
 * The component is structural only — it does not own any admin state.
 * Callers pass:
 *   - `groups`         The sidebar nav groups + items (with optional badge)
 *   - `activeId`       Id of the currently active item
 *   - `onSelect`       Called when a nav item is clicked
 *   - `title`          String shown in the header card
 *   - `onBack`         Optional back button (rendered at the top of the
 *                      sidebar; in the reference design the brand row
 *                      doubles as a "go home" link)
 *   - `headerExtras`   Optional ReactNode rendered next to the bell
 *   - `children`       The active page's content
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Bell, Boxes, Menu, X } from 'lucide-react';

export interface AdminNavItem {
  id: string;
  label: string;
  icon: ReactNode;
  /** Optional badge count rendered as a small pill on the right. */
  badge?: number;
}

export interface AdminNavGroup {
  /** Section label (rendered in muted uppercase above the items). */
  label: string;
  items: ReadonlyArray<AdminNavItem>;
}

export interface AdminLayoutProps {
  groups: ReadonlyArray<AdminNavGroup>;
  activeId: string;
  onSelect: (id: string) => void;
  title: string;
  onBack?: () => void;
  /** Slot to the right of the title bar (left of the bell). */
  headerExtras?: ReactNode;
  children: ReactNode;
}

export function AdminLayout({
  groups,
  activeId,
  onSelect,
  title,
  onBack,
  headerExtras,
  children,
}: AdminLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer when an item is picked or the viewport widens.
  useEffect(() => {
    const close = () => setDrawerOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    setDrawerOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Backdrop for mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900/95 border-r border-slate-800/80 backdrop-blur-xl transform transition-transform duration-200 ease-out
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col`}
        aria-label="Admin navigation"
      >
        {/* Brand row */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => onBack?.()}
            className="flex items-center gap-2 group"
            title={onBack ? 'Back to app' : undefined}
          >
            <span className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/25 transition-colors">
              <Boxes className="w-5 h-5" />
            </span>
            <span className="text-lg font-black tracking-tight text-blue-400">
              AdminPanel
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav groups (scrollable when overflowing) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = item.id === activeId;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(item.id)}
                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative
                          ${isActive
                            ? 'bg-blue-500/15 text-blue-400'
                            : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100'}`}
                      >
                        <span
                          className={`shrink-0 w-5 h-5 flex items-center justify-center
                            ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500/90 text-white text-[10px] font-black">
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-blue-400" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
          {/* Header card */}
          <header className="flex items-center gap-3 sm:gap-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-xl shadow-black/20">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="hidden lg:inline-flex p-2 rounded-lg text-slate-300 hover:bg-slate-800/80 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="flex-1 text-2xl sm:text-3xl font-black tracking-tight text-white truncate">
              {title}
            </h1>
            {headerExtras}
            <button
              type="button"
              className="relative p-2.5 rounded-full bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors"
              aria-label="Notifications"
              onClick={onBack}
            >
              <Bell className="w-5 h-5" />
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-300 bg-slate-800/60 hover:bg-slate-800 hover:text-white transition-colors"
                title="Back to app"
              >
                <ArrowLeft className="w-4 h-4" />
                Exit
              </button>
            )}
          </header>

          {/* Page content */}
          <section className="space-y-6 pb-16">{children}</section>
        </main>
      </div>
    </div>
  );
}
