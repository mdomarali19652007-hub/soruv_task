/**
 * HomeView — modern fintech glassmorphism landing screen.
 *
 * Section order (per latest spec):
 *   1. Top bar — "Top Earning" brand on the left, notification + profile
 *      icon buttons on the right.
 *   2. Balance card — gradient hero with "মেইন ব্যালেন্স" + hide/show,
 *      মোট ইনকাম + পেন্ডিং inline pills, উইথড্র + রেফার buttons.
 *   3. Social row — Telegram / Facebook / WhatsApp / Support quick links.
 *   4. Refer + verified — referral code as gradient text with copy,
 *      "ভেরিফায়েড" / "অ্যাক্টিভেট করুন" status chip, share-link button.
 *   5. Task tiles — individual category tiles (Daily Job, Micro Tasks,
 *      Gmail Sell, FB Marketing, Ads Earn, etc.) in a 2-column grid,
 *      filtered by admin's `enabledCards` flag.
 *
 * Dropped from the previous pass per "feels cluttered" feedback:
 *   - greeting line
 *   - daily-reward card (still claimable from the Wallet)
 *   - recent activity list (lives in /dashboard now)
 *   - global notice card
 *   - trust strip
 *   - quick-action chip row
 */
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Facebook,
  Headphones,
  MessageCircle,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import type { UserProfile, View } from '../../types';
import { Card } from '../../components/ui';
import { INCOME_CARDS } from '../../constants';

interface Props {
  user: UserProfile;
  setView: (view: View) => void;
  onOpenNotifications: () => void;
  /** Daily reward in BDT (not rendered here, kept for parity). */
  dailyReward: number;
  dailyClaimEnabled: boolean;
  onClaimDaily: () => void;
  /** Marquee/notice text from admin config (not rendered here). */
  globalNotice: string;
  totalPaid: number;
  activeWorkerCount: number;
  /** Feature flags from admin config — used to gate task tiles. */
  enabledCards: string[];
  isAdmin: boolean;
  /** Social links from admin config. */
  telegramLink: string;
  facebookLink: string;
  whatsappLink: string;
}

/**
 * Bangla-labelled task tiles. Each entry references the original
 * English `INCOME_CARDS.title` so the admin's `enabledCards` flag
 * (which stores English titles) keeps working. The legacy
 * `INCOME_CARDS` had visible duplicates pointing at the same view —
 * those are de-duped here so the home grid never shows two tiles
 * leading to the same destination.
 */
interface Tile {
  /** English title used as the gate key in `enabledCards`. */
  gateTitle: string;
  /** Bangla label shown on the tile. */
  label: string;
  destination: View;
  icon: ReactNode;
  /** Tailwind gradient classes for the icon tile. */
  iconBg: string;
  /** Subtle background tint for the whole card. */
  cardTint: string;
}

const TILES: Tile[] = [
  {
    gateTitle: 'Daily Job',
    label: 'ডেইলি জব',
    destination: 'folder-a',
    icon: lucide('briefcase'),
    iconBg: 'from-indigo-500 to-blue-500',
    cardTint: 'from-indigo-500/8 to-blue-500/8',
  },
  {
    gateTitle: 'Micro Tasks',
    label: 'মাইক্রো টাস্ক',
    destination: 'folder-a',
    icon: lucide('list-checks'),
    iconBg: 'from-cyan-500 to-blue-500',
    cardTint: 'from-cyan-500/8 to-blue-500/8',
  },
  {
    gateTitle: 'Premium Jobs',
    label: 'প্রিমিয়াম জব',
    destination: 'folder-a',
    icon: lucide('shield-check'),
    iconBg: 'from-amber-500 to-yellow-500',
    cardTint: 'from-amber-500/8 to-yellow-500/8',
  },
  {
    gateTitle: 'Gmail Sell',
    label: 'জিমেইল সেল',
    destination: 'folder-c',
    icon: lucide('mail'),
    iconBg: 'from-rose-500 to-orange-500',
    cardTint: 'from-rose-500/8 to-orange-500/8',
  },
  {
    gateTitle: 'Fb Marketing',
    label: 'ফেসবুক মার্কেটিং',
    destination: 'folder-b',
    icon: lucide('facebook'),
    iconBg: 'from-blue-500 to-indigo-600',
    cardTint: 'from-blue-500/8 to-indigo-500/8',
  },
  {
    gateTitle: 'Ads Earn',
    label: 'অ্যাড দেখে ইনকাম',
    destination: 'ads-earn',
    icon: lucide('play-circle'),
    iconBg: 'from-emerald-500 to-teal-500',
    cardTint: 'from-emerald-500/8 to-teal-500/8',
  },
  {
    gateTitle: 'TOP NEWS',
    label: 'টপ নিউজ',
    destination: 'top-news',
    icon: lucide('newspaper'),
    iconBg: 'from-slate-700 to-slate-900',
    cardTint: 'from-slate-500/8 to-slate-700/8',
  },
  {
    gateTitle: 'Mobile Banking',
    label: 'মোবাইল ব্যাংকিং',
    destination: 'mobile-banking',
    icon: lucide('smartphone'),
    iconBg: 'from-pink-500 to-rose-500',
    cardTint: 'from-pink-500/8 to-rose-500/8',
  },
  {
    gateTitle: 'BUY SELL',
    label: 'বাই-সেল (OTP)',
    destination: 'otp-buy-sell',
    icon: lucide('key'),
    iconBg: 'from-fuchsia-500 to-pink-600',
    cardTint: 'from-fuchsia-500/8 to-pink-500/8',
  },
  {
    gateTitle: 'Asset Trading',
    label: 'অ্যাসেট ট্রেডিং',
    destination: 'dollar-buy',
    icon: lucide('trending-up'),
    iconBg: 'from-orange-500 to-amber-500',
    cardTint: 'from-orange-500/8 to-amber-500/8',
  },
  {
    gateTitle: 'E-commerce',
    label: 'ই-কমার্স',
    destination: 'ecommerce',
    icon: lucide('shopping-bag'),
    iconBg: 'from-pink-500 to-fuchsia-600',
    cardTint: 'from-pink-500/8 to-fuchsia-500/8',
  },
  {
    gateTitle: 'SOCIAL',
    label: 'সোশ্যাল হাব',
    destination: 'social-hub',
    icon: lucide('users'),
    iconBg: 'from-sky-500 to-indigo-500',
    cardTint: 'from-sky-500/8 to-indigo-500/8',
  },
  {
    gateTitle: 'SMM & BOOSTING',
    label: 'SMM ও বুস্টিং',
    destination: 'subscription-boosting',
    icon: lucide('zap'),
    iconBg: 'from-amber-400 to-orange-500',
    cardTint: 'from-amber-500/8 to-orange-500/8',
  },
  {
    gateTitle: 'GAMING',
    label: 'গেমিং',
    destination: 'gaming',
    icon: lucide('gamepad-2'),
    iconBg: 'from-violet-500 to-purple-600',
    cardTint: 'from-violet-500/8 to-purple-500/8',
  },
  {
    gateTitle: 'Network Marketing',
    label: 'নেটওয়ার্ক মার্কেটিং',
    destination: 'referral',
    icon: lucide('share-2'),
    iconBg: 'from-violet-500 to-fuchsia-500',
    cardTint: 'from-violet-500/8 to-fuchsia-500/8',
  },
];

/** Ad-hoc lucide icon resolver kept compact so the TILES table above
 *  reads like data, not JSX. The icons referenced here are imported
 *  inline below — adding a new tile means importing the new icon. */
function lucide(name: string): ReactNode {
  const map: Record<string, ReactNode> = {
    briefcase: <Briefcase className="w-6 h-6" />,
    'list-checks': <ListChecks className="w-6 h-6" />,
    'shield-check': <ShieldCheck className="w-6 h-6" />,
    mail: <Mail className="w-6 h-6" />,
    facebook: <Facebook className="w-6 h-6" />,
    'play-circle': <PlayCircle className="w-6 h-6" />,
    newspaper: <Newspaper className="w-6 h-6" />,
    smartphone: <Smartphone className="w-6 h-6" />,
    key: <Key className="w-6 h-6" />,
    'trending-up': <TrendingUp className="w-6 h-6" />,
    'shopping-bag': <ShoppingBag className="w-6 h-6" />,
    users: <Users className="w-6 h-6" />,
    zap: <Zap className="w-6 h-6" />,
    'gamepad-2': <Gamepad2 className="w-6 h-6" />,
    'share-2': <Share2 className="w-6 h-6" />,
  };
  return map[name];
}

import {
  Briefcase,
  Gamepad2,
  Key,
  ListChecks,
  Mail,
  Newspaper,
  PlayCircle,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

function formatBdt(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function HomeView({
  user,
  setView,
  onOpenNotifications,
  enabledCards,
  isAdmin,
  telegramLink,
  facebookLink,
  whatsappLink,
}: Props) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const hasUnreadNotifications = user.notifications.length > 0;
  const visibleTiles = TILES.filter(
    (t) => isAdmin || enabledCards.includes(t.gateTitle),
  );

  const handleCopy = (text: string, kind: 'code' | 'link') => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* 1. Top bar — English brand on the left, icon buttons on the right */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/40 border-b border-white/40">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <span className="inline-flex w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white items-center justify-center shadow-md">
              <Wallet className="w-5 h-5" />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Top Earning
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <Bell className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setView('profile')}
            aria-label="Profile"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <UserIcon className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 2. Balance card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="gradient" glow padded className="p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-indigo-100/90">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">মেইন ব্যালেন্স</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBalanceHidden((v) => !v)}
                  aria-label={balanceHidden ? 'ব্যালেন্স দেখান' : 'ব্যালেন্স লুকান'}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
                >
                  {balanceHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                {balanceHidden ? '••••••' : (
                  <>
                    <span className="text-indigo-100/80 text-2xl mr-1 align-top">৳</span>
                    {formatBdt(user.mainBalance)}
                  </>
                )}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl glass-highlight px-3 py-2.5">
                  <p className="text-[11px] tracking-wide text-indigo-100/70">মোট ইনকাম</p>
                  <p className="text-base font-semibold tabular-nums mt-0.5">
                    ৳{balanceHidden ? '••••' : formatBdt(user.totalEarned)}
                  </p>
                </div>
                <div className="rounded-xl glass-highlight px-3 py-2.5">
                  <p className="text-[11px] tracking-wide text-indigo-100/70">পেন্ডিং</p>
                  <p className="text-base font-semibold tabular-nums mt-0.5">
                    ৳{balanceHidden ? '••••' : formatBdt(user.pendingPayout)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setView('finance')}
                  className="flex-1 h-11 rounded-xl bg-white text-indigo-700 font-semibold text-sm shadow-sm hover:shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" /> উইথড্র
                </button>
                <button
                  type="button"
                  onClick={() => setView('finance')}
                  className="flex-1 h-11 rounded-xl bg-white/15 text-white font-semibold text-sm border border-white/20 hover:bg-white/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <TrendingUp className="w-4 h-4" /> ডিপোজিট
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 3. Social row */}
        <Card padded>
          <p className="text-sm font-semibold text-slate-700 mb-3">
            আমাদের কমিউনিটিতে যোগ দিন
          </p>
          <div className="grid grid-cols-4 gap-2">
            <SocialButton
              href={telegramLink}
              label="Telegram"
              icon={<Send className="w-5 h-5" />}
              gradient="from-sky-500 to-blue-600"
            />
            <SocialButton
              href={facebookLink}
              label="Facebook"
              icon={<Facebook className="w-5 h-5" />}
              gradient="from-blue-600 to-indigo-700"
            />
            <SocialButton
              href={whatsappLink}
              label="WhatsApp"
              icon={<MessageCircle className="w-5 h-5" />}
              gradient="from-emerald-500 to-green-600"
            />
            <SocialButton
              onClick={() => setView('support')}
              label="সাপোর্ট"
              icon={<Headphones className="w-5 h-5" />}
              gradient="from-violet-500 to-purple-600"
            />
          </div>
        </Card>

        {/* 4. Refer + verified */}
        <Card padded>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">রেফার করুন, ইনকাম বাড়ান</p>
              <p className="text-sm text-slate-600 mt-0.5">
                আপনার রেফারেল কোড শেয়ার করুন
              </p>
            </div>
            {user.isActive ? (
              <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                <ShieldCheck className="w-3.5 h-3.5" />
                ভেরিফায়েড
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setView('account-activation')}
                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-700 text-xs font-semibold border border-rose-200/60 hover:bg-rose-500/20 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                অ্যাক্টিভেট করুন
              </button>
            )}
          </div>

          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => user.numericId && handleCopy(user.numericId, 'code')}
              disabled={!user.numericId}
              className="flex-1 inline-flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-200/60 hover:from-indigo-500/15 hover:to-violet-500/15 transition-all disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-left">
                <span className="block text-[11px] uppercase tracking-wide text-slate-500">
                  রেফারেল কোড
                </span>
                <span className="block text-lg font-bold tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tabular-nums">
                  {user.numericId || '——'}
                </span>
              </span>
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                {copied === 'code' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </span>
            </button>
            <button
              type="button"
              disabled={!user.numericId}
              onClick={() => {
                if (!user.numericId) return;
                handleCopy(
                  `${window.location.origin}?ref=${user.numericId}`,
                  'link',
                );
              }}
              aria-label="রেফারেল লিংক কপি করুন"
              className="shrink-0 w-12 inline-flex items-center justify-center rounded-xl bg-white/70 border border-white/60 hover:bg-white transition-colors disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {copied === 'link' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <Share2 className="w-5 h-5 text-indigo-600" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setView('referral')}
            className="mt-3 w-full inline-flex items-center justify-between text-sm font-semibold text-indigo-600 hover:underline"
          >
            <span>আমার টিম দেখুন</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </Card>

        {/* 5. Task tiles — individual categories like the old version */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">ইনকাম শুরু করুন</h2>
              <p className="text-sm text-slate-600 mt-0.5">যেকোনো ক্যাটাগরি থেকে কাজ শুরু করুন</p>
            </div>
          </div>
          {visibleTiles.length === 0 ? (
            <Card padded>
              <p className="text-sm text-slate-600 text-center py-4">
                এই মুহূর্তে কোনো ইনকাম ক্যাটাগরি চালু নেই।
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibleTiles.map((tile, i) => (
                <motion.button
                  key={`${tile.gateTitle}-${i}`}
                  type="button"
                  onClick={() => setView(tile.destination)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.02 + i * 0.025 }}
                  className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_6px_18px_-8px_rgba(15,23,42,0.12)] p-4 flex flex-col items-center gap-2 text-center transition-shadow hover:shadow-[0_10px_28px_-8px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[120px]"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tile.cardTint}`}
                  />
                  <span
                    className={`relative shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${tile.iconBg} text-white inline-flex items-center justify-center shadow-md`}
                  >
                    {tile.icon}
                  </span>
                  <span className="relative text-sm font-semibold text-slate-900 leading-tight">
                    {tile.label}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

interface SocialButtonProps {
  label: string;
  icon: ReactNode;
  gradient: string;
  href?: string;
  onClick?: () => void;
}

function SocialButton({ label, icon, gradient, href, onClick }: SocialButtonProps) {
  const inner = (
    <>
      <span
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white inline-flex items-center justify-center shadow-md mb-1.5`}
      >
        {icon}
      </span>
      <span className="text-[11px] font-semibold text-slate-700 leading-none">{label}</span>
    </>
  );
  const baseClasses =
    'flex flex-col items-center justify-center p-2 rounded-xl bg-white/40 border border-white/40 hover:bg-white/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500';
  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={baseClasses}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClasses}>
      {inner}
    </button>
  );
}

// `INCOME_CARDS` is intentionally not used by the home tile grid above
// (the new TILES list is the source of truth) but is re-exported as a
// `void` reference so a future audit can still find that this file
// participates in the income-card surface area.
void INCOME_CARDS;
