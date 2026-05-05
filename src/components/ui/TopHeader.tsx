/**
 * TopHeader — sticky app bar used across the new redesign shell.
 *
 * Replaces the inline `<header>` previously hardcoded in HomeView and
 * other screens. Layout follows the competitor reference but keeps
 * the existing indigo / violet glassmorphism palette:
 *
 *   [hamburger or back]   [centered title + small logo]   [profile + bell]
 *
 * Props are deliberately small so any feature view can reuse it.
 */
import type { ReactNode } from 'react';
import { ArrowLeft, Bell, Menu, User as UserIcon, Wallet } from 'lucide-react';
import { cn } from './cn';

export interface TopHeaderProps {
  /** Visible title rendered in the centre slot. */
  title: ReactNode;
  /** Optional small leading badge (defaults to a Wallet brand mark). */
  brandIcon?: ReactNode;
  /** Called when the hamburger / drawer button is tapped. */
  onMenu?: () => void;
  /** Called when the profile icon is tapped. */
  onProfile?: () => void;
  /** Called when the bell icon is tapped. */
  onNotifications?: () => void;
  /** When true a red dot is overlaid on the bell. */
  hasUnreadNotifications?: boolean;
  /**
   * When true the leading slot becomes a back arrow (calling
   * `onBack`) instead of a hamburger that calls `onMenu`. Use this
   * for sub-views like Withdraw / IncomeDetail.
   */
  showBack?: boolean;
  onBack?: () => void;
  className?: string;
}

export function TopHeader({
  title,
  brandIcon,
  onMenu,
  onProfile,
  onNotifications,
  hasUnreadNotifications,
  showBack,
  onBack,
  className,
}: TopHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 backdrop-blur-xl bg-white/40 border-b border-white/40',
        // Honour iOS notch / status-bar so the bar doesn't sit under
        // the camera cut-out when used as a full-screen PWA.
        'pt-[env(safe-area-inset-top)]',
        className,
      )}
    >
      <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={showBack ? onBack : onMenu}
          aria-label={showBack ? 'পেছনে যান' : 'মেনু খুলুন'}
          className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          {showBack ? <ArrowLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex-1 min-w-0 flex items-center justify-center gap-2 text-center">
          <span className="inline-flex w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white items-center justify-center shadow-sm shrink-0">
            {brandIcon ?? <Wallet className="w-4 h-4" />}
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900 truncate">
            {title}
          </span>
        </div>

        {onNotifications && (
          <button
            type="button"
            onClick={onNotifications}
            aria-label="নোটিফিকেশন"
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Bell className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
        )}

        {onProfile && (
          <button
            type="button"
            onClick={onProfile}
            aria-label="প্রোফাইল"
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <UserIcon className="w-5 h-5" />
            {/* Subtle online status dot — purely decorative. */}
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>
        )}
      </div>
    </header>
  );
}
