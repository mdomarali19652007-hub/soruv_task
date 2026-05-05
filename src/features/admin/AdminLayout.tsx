/**
 * AdminLayout — admin shell that re-uses the consumer indigo/violet
 * glassmorphism palette so the operator console and the public app
 * feel like the same product.
 *
 * Design notes
 * ------------
 * - Light, frosted-glass surfaces over the same body mesh gradient as
 *   the consumer shell. Active states use the brand indigo→violet
 *   gradient.
 * - The sidebar is a fixed glass column on lg+ and an off-canvas
 *   drawer on smaller viewports.
 * - The header card hosts the screen title plus three actions: a
 *   "Back to app" link (returns to the consumer home view) and a
 *   "Sign out" button (terminates the session). The previous version
 *   conflated both into a single "Exit" button which silently routed
 *   home without signing out — that was the user-reported bug.
 *
 * The component is structural only — it does not own any admin state.
 * Callers pass:
 *   - `groups`         The sidebar nav groups + items (with optional badge)
 *   - `activeId`       Id of the currently active item
 *   - `onSelect`       Called when a nav item is clicked
 *   - `title`          String shown in the header card
 *   - `onBack`         Optional "back to app" navigation
 *   - `onSignOut`      Optional handler for the explicit sign-out button
 *   - `headerExtras`   Optional ReactNode rendered next to the title
 *   - `children`       The active page's content
 */

import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, Boxes, LogOut, Menu, X } from 'lucide-react';

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
  onSignOut?: () => void | Promise<void>;
  /** Slot to the right of the title bar (left of the header buttons). */
  headerExtras?: ReactNode;
  children: ReactNode;
}

export function AdminLayout({
  groups,
  activeId,
  onSelect,
  title,
  onBack,
  onSignOut,
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
    <div className="admin-shell min-h-screen text-slate-900">
      {/* Backdrop for mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/85 border-r border-white/60 backdrop-blur-2xl flex flex-col transform transition-transform duration-200 ease-out shadow-[0_12px_36px_-12px_rgba(15,23,42,0.18)]
          ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0`}
        aria-label="Admin navigation"
      >
        {/* Brand row */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/60">
          <button
            type="button"
            onClick={() => onBack?.()}
            className="flex items-center gap-2 group"
            title={onBack ? 'Back to app' : undefined}
          >
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Boxes className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              AdminPanel
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden p-1 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav groups (scrollable when overflowing) */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
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
                        className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative
                          ${isActive
                            ? 'bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white shadow-md shadow-indigo-500/20'
                            : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'}`}
                      >
                        <span
                          className={`shrink-0 w-5 h-5 flex items-center justify-center
                            ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-600'}`}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate flex-1 text-left">{item.label}</span>
                        {item.badge && item.badge > 0 ? (
                          <span
                            className={`ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold
                              ${isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-500/20'}`}
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer actions: Sign out + Back to app. Anchored at the
            bottom of the drawer so they're always reachable without
            having to scroll the (potentially long) nav. */}
        <div className="px-3 py-4 border-t border-white/60 space-y-1.5">
          {onBack && (
            <button
              type="button"
              onClick={() => onBack()}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-100/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to app</span>
            </button>
          )}
          {onSignOut && (
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main column */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 px-4 sm:px-6 py-4 sm:py-6 space-y-6">
          {/* Header card */}
          <header className="flex items-center gap-3 sm:gap-4 bg-white/70 backdrop-blur-2xl border border-white/60 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)]">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-700 bg-white/60 border border-white/60 hover:bg-white transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setDrawerOpen((v) => !v)}
              className="hidden lg:inline-flex p-2 rounded-xl text-slate-700 bg-white/60 border border-white/60 hover:bg-white transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500 mb-0.5">
                Admin Console
              </p>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
                {title}
              </h1>
            </div>
            {headerExtras}
            <div className="hidden sm:flex items-center gap-2">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white/60 border border-white/60 hover:bg-white transition-colors"
                  title="Back to app"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to app
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={() => void onSignOut()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 shadow-md shadow-rose-500/20 transition-colors"
                  title="Sign out of the admin console"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              )}
            </div>
          </header>

          {/* Page content */}
          <section className="space-y-6 pb-16">{children}</section>
        </main>
      </div>
    </div>
  );
}
