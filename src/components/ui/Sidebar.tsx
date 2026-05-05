/**
 * Sidebar — slide-in left drawer navigation.
 *
 * Triggered from the hamburger button in `TopHeader`. Hosts the
 * "secondary" routes that no longer fit in the 5-tab bottom bar after
 * the competitor-aligned restructure (Voucher Balance, Withdraw,
 * Income / Balance / Payment History, About, Reviews, Privacy, …).
 *
 * Implementation notes:
 *   - The drawer renders inside a portal-less fragment but uses
 *     `position: fixed` + `z-index: 50` so it overlays everything,
 *     including the BottomNav.
 *   - Closes on backdrop click and on Escape (keyboard accessibility).
 *   - Animated with `motion/react` so we get spring-in + fade.
 */
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronRight,
  Copy,
  CreditCard,
  FileText,
  Headphones,
  History,
  Home,
  Info,
  Star,
  Wallet,
  X,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { UserProfile, View } from '../../types';
import { cn } from './cn';

interface SidebarItem {
  key: string;
  label: string;
  icon: ReactNode;
  view: View;
  iconBg: string;
}

const ITEMS: SidebarItem[] = [
  {
    key: 'home',
    label: 'হোম',
    view: 'home',
    icon: <Home className="w-4 h-4" />,
    iconBg: 'from-indigo-500 to-blue-500',
  },
  {
    key: 'voucher',
    label: 'ভাউচার ব্যালেন্স',
    view: 'finance',
    icon: <Wallet className="w-4 h-4" />,
    iconBg: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'withdraw',
    label: 'উইথড্র',
    view: 'withdraw',
    icon: <CreditCard className="w-4 h-4" />,
    iconBg: 'from-violet-500 to-fuchsia-500',
  },
  {
    key: 'income-history',
    label: 'ইনকাম হিস্ট্রি',
    view: 'income-history',
    icon: <History className="w-4 h-4" />,
    iconBg: 'from-amber-500 to-orange-500',
  },
  {
    key: 'balance-history',
    label: 'ব্যালেন্স হিস্ট্রি',
    view: 'balance-history',
    icon: <Receipt className="w-4 h-4" />,
    iconBg: 'from-sky-500 to-indigo-500',
  },
  {
    key: 'payment-history',
    label: 'পেমেন্ট হিস্ট্রি',
    view: 'payment-history',
    icon: <Receipt className="w-4 h-4" />,
    iconBg: 'from-rose-500 to-pink-500',
  },
  {
    key: 'support',
    label: 'সাপোর্ট সেন্টার',
    view: 'support',
    icon: <Headphones className="w-4 h-4" />,
    iconBg: 'from-violet-500 to-purple-500',
  },
  {
    key: 'about',
    label: 'আমাদের সম্পর্কে',
    view: 'about',
    icon: <Info className="w-4 h-4" />,
    iconBg: 'from-slate-500 to-slate-700',
  },
  {
    key: 'reviews',
    label: 'রেটিং ও রিভিউ',
    view: 'reviews',
    icon: <Star className="w-4 h-4" />,
    iconBg: 'from-yellow-400 to-amber-500',
  },
  {
    key: 'privacy',
    label: 'প্রাইভেসি পলিসি',
    view: 'privacy',
    icon: <FileText className="w-4 h-4" />,
    iconBg: 'from-slate-600 to-slate-800',
  },
];

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  user: Pick<
    UserProfile,
    'name' | 'numericId' | 'referredBy' | 'activationDate' | 'isActive'
  >;
  /**
   * Lookup table for resolving the upline numericId from the user's
   * `referredBy` field (which historically stored a user id, not a
   * numericId). The sidebar tries both lookups gracefully.
   */
  allUsers?: { id?: string; numericId?: string }[];
  setView: (view: View) => void;
}

export function Sidebar({ open, onClose, user, allUsers = [], setView }: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Trap Escape and prevent background scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const handleSelect = (view: View) => {
    setView(view);
    onClose();
  };

  const uplineNumericId = (() => {
    if (!user.referredBy) return null;
    const direct = allUsers.find(
      (u) => u.id === user.referredBy || u.numericId === user.referredBy,
    );
    return direct?.numericId ?? user.referredBy;
  })();

  const joinDate = user.activationDate
    ? new Date(user.activationDate).toLocaleDateString()
    : '—';

  const handleCopyId = () => {
    if (!user.numericId) return;
    void navigator.clipboard.writeText(user.numericId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <motion.aside
            role="dialog"
            aria-label="সাইডবার মেনু"
            aria-modal="true"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed top-0 left-0 z-50 h-full w-[86%] max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-600 text-white px-5 pt-[max(20px,env(safe-area-inset-top))] pb-6 overflow-hidden">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/15 to-transparent"
              />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="মেনু বন্ধ করুন"
                className="absolute top-3 right-3 w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/15 border border-white/30 flex items-center justify-center text-white text-xl font-bold uppercase">
                  {user.name?.[0] ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold truncate">{user.name || 'ইউজার'}</p>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[11px] font-medium hover:bg-white/25 transition-colors"
                  >
                    <span className="tabular-nums">ID: {user.numericId || '——'}</span>
                    <Copy className="w-3 h-3" />
                    {copiedId && <span className="ml-1">কপি!</span>}
                  </button>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-indigo-100/90">
                    <span>আপলাইন: {uplineNumericId ?? '—'}</span>
                    <span>জয়েন: {joinDate}</span>
                  </div>
                </div>
              </div>
              {user.isActive && (
                <span className="relative mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/20 text-white text-[11px] font-semibold border border-emerald-200/40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ভেরিফায়েড অ্যাকাউন্ট
                </span>
              )}
            </div>

            {/* Items */}
            <nav className="flex-1 overflow-y-auto py-2">
              <ul>
                {ITEMS.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.view)}
                      className={cn(
                        'w-full flex items-center gap-3 px-5 py-3 text-left',
                        'hover:bg-slate-50 active:bg-slate-100 transition-colors',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500',
                      )}
                    >
                      <span
                        className={cn(
                          'w-8 h-8 rounded-lg bg-gradient-to-br text-white inline-flex items-center justify-center shadow-sm shrink-0',
                          item.iconBg,
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 text-sm font-medium text-slate-800">
                        {item.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 text-center text-[11px] text-slate-400 pb-[max(16px,env(safe-area-inset-bottom))]">
              Top Earning © {new Date().getFullYear()}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
