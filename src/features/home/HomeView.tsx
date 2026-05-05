/**
 * HomeView — competitor-aligned landing screen.
 *
 * Section order (per the "Competitor-aligned UI Restructure" plan):
 *   1. TopHeader — hamburger (opens sidebar drawer), centered brand,
 *      profile + bell on the right.
 *   2. Hero banner — indigo / violet gradient welcome card. The
 *      previous balance hero has been MOVED to the Wallet (Finance)
 *      tab; balance no longer lives on Home.
 *   3. Social links row — Telegram / Facebook / WhatsApp / Support.
 *   4. Referral card — dashed-border block with the user's referral
 *      code + a primary "কপি" button.
 *   5. Account-status banner — solid indigo card with a "ভেরিফাই
 *      করুন" CTA when the account is inactive (replaces the old chip).
 *   6. Services grid — 3-column dense tile grid (was 2 columns) so
 *      the layout matches the competitor's density without changing
 *      the brand palette.
 */
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Facebook,
  Headphones,
  MessageCircle,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import type { UserProfile, View } from '../../types';
import { Card, TopHeader } from '../../components/ui';
import { INCOME_CARDS } from '../../constants';

interface Props {
  user: UserProfile;
  setView: (view: View) => void;
  onOpenNotifications: () => void;
  /** Opens the slide-in sidebar drawer rendered at the App shell. */
  onOpenSidebar: () => void;
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

interface Tile {
  /** English title used as the gate key in `enabledCards`. */
  gateTitle: string;
  /** Bangla label shown on the tile. */
  label: string;
  destination: View;
  icon: ReactNode;
  /** Tailwind gradient classes for the icon tile. */
  iconBg: string;
}

const TILES: Tile[] = [
  {
    gateTitle: 'Daily Job',
    label: 'ডেইলি জব',
    destination: 'folder-a',
    icon: lucide('briefcase'),
    iconBg: 'from-indigo-500 to-blue-500',
  },
  {
    gateTitle: 'Micro Tasks',
    label: 'মাইক্রো টাস্ক',
    destination: 'folder-a',
    icon: lucide('list-checks'),
    iconBg: 'from-cyan-500 to-blue-500',
  },
  {
    gateTitle: 'Premium Jobs',
    label: 'প্রিমিয়াম জব',
    destination: 'folder-a',
    icon: lucide('shield-check'),
    iconBg: 'from-amber-500 to-yellow-500',
  },
  {
    gateTitle: 'Gmail Sell',
    label: 'জিমেইল সেল',
    destination: 'folder-c',
    icon: lucide('mail'),
    iconBg: 'from-rose-500 to-orange-500',
  },
  {
    gateTitle: 'Fb Marketing',
    label: 'ফেসবুক মার্কেটিং',
    destination: 'folder-b',
    icon: lucide('facebook'),
    iconBg: 'from-blue-500 to-indigo-600',
  },
  {
    gateTitle: 'Ads Earn',
    label: 'অ্যাড দেখে ইনকাম',
    destination: 'ads-earn',
    icon: lucide('play-circle'),
    iconBg: 'from-emerald-500 to-teal-500',
  },
  {
    gateTitle: 'TOP NEWS',
    label: 'টপ নিউজ',
    destination: 'top-news',
    icon: lucide('newspaper'),
    iconBg: 'from-slate-700 to-slate-900',
  },
  {
    gateTitle: 'Mobile Banking',
    label: 'মোবাইল ব্যাংকিং',
    destination: 'mobile-banking',
    icon: lucide('smartphone'),
    iconBg: 'from-pink-500 to-rose-500',
  },
  {
    gateTitle: 'BUY SELL',
    label: 'বাই-সেল (OTP)',
    destination: 'otp-buy-sell',
    icon: lucide('key'),
    iconBg: 'from-fuchsia-500 to-pink-600',
  },
  {
    gateTitle: 'Asset Trading',
    label: 'অ্যাসেট ট্রেডিং',
    destination: 'dollar-buy',
    icon: lucide('trending-up'),
    iconBg: 'from-orange-500 to-amber-500',
  },
  {
    gateTitle: 'E-commerce',
    label: 'ই-কমার্স',
    destination: 'ecommerce',
    icon: lucide('shopping-bag'),
    iconBg: 'from-pink-500 to-fuchsia-600',
  },
  {
    gateTitle: 'SOCIAL',
    label: 'সোশ্যাল হাব',
    destination: 'social-hub',
    icon: lucide('users'),
    iconBg: 'from-sky-500 to-indigo-500',
  },
  {
    gateTitle: 'SMM & BOOSTING',
    label: 'SMM ও বুস্টিং',
    destination: 'subscription-boosting',
    icon: lucide('zap'),
    iconBg: 'from-amber-400 to-orange-500',
  },
  {
    gateTitle: 'GAMING',
    label: 'গেমিং',
    destination: 'gaming',
    icon: lucide('gamepad-2'),
    iconBg: 'from-violet-500 to-purple-600',
  },
  {
    gateTitle: 'Network Marketing',
    label: 'নেটওয়ার্ক মার্কেটিং',
    destination: 'referral',
    icon: lucide('share-2'),
    iconBg: 'from-violet-500 to-fuchsia-500',
  },
];

import {
  Briefcase,
  Gamepad2,
  Key,
  ListChecks,
  Mail,
  Newspaper,
  PlayCircle,
  Share2,
  ShoppingBag,
  Smartphone,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

/** Ad-hoc lucide icon resolver — keeps the TILES table above readable
 *  as data instead of inline JSX. */
function lucide(name: string): ReactNode {
  const map: Record<string, ReactNode> = {
    briefcase: <Briefcase className="w-5 h-5" />,
    'list-checks': <ListChecks className="w-5 h-5" />,
    'shield-check': <ShieldCheck className="w-5 h-5" />,
    mail: <Mail className="w-5 h-5" />,
    facebook: <Facebook className="w-5 h-5" />,
    'play-circle': <PlayCircle className="w-5 h-5" />,
    newspaper: <Newspaper className="w-5 h-5" />,
    smartphone: <Smartphone className="w-5 h-5" />,
    key: <Key className="w-5 h-5" />,
    'trending-up': <TrendingUp className="w-5 h-5" />,
    'shopping-bag': <ShoppingBag className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    zap: <Zap className="w-5 h-5" />,
    'gamepad-2': <Gamepad2 className="w-5 h-5" />,
    'share-2': <Share2 className="w-5 h-5" />,
  };
  return map[name];
}

export function HomeView({
  user,
  setView,
  onOpenNotifications,
  onOpenSidebar,
  enabledCards,
  isAdmin,
  telegramLink,
  facebookLink,
  whatsappLink,
}: Props) {
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
      <TopHeader
        title="Top Earning"
        onMenu={onOpenSidebar}
        onNotifications={onOpenNotifications}
        hasUnreadNotifications={hasUnreadNotifications}
        onProfile={() => setView('profile')}
      />

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 1. Hero banner — replaces the old balance hero (balance now
            lives on the Wallet tab per the restructure plan). */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card variant="gradient" glow padded className="p-6 relative">
            <div className="relative z-10 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-100/80">
                  সুপার অ্যাপ
                </p>
                <h1 className="text-2xl font-bold mt-1 leading-tight">
                  আপনাকে স্বাগতম<span className="text-indigo-100/90">,</span>
                </h1>
                <p className="text-sm text-indigo-100/90 mt-1 truncate">
                  {user.name || 'প্রিয় সদস্য'}
                </p>
              </div>
              <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-7 h-7" />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 2. Marketing banner — sits between the welcome hero and the
            social row. Served statically from /public so it's not
            dependent on any external image host. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-white/60 shadow-[0_8px_24px_-8px_rgba(15,23,42,0.15)]"
        >
          <img
            src="/home-banner.jpg"
            alt="Top Earning প্রোমো ব্যানার"
            loading="lazy"
            decoding="async"
            className="block w-full h-auto object-cover"
          />
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

        {/* 3. Referral card — dashed-border treatment with copy button. */}
        <Card padded>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-slate-900">
                রেফার করুন, ইনকাম বাড়ান
              </p>
              <p className="text-sm text-slate-600 mt-0.5">
                আপনার রেফারেল কোড শেয়ার করুন
              </p>
            </div>
          </div>

          <div className="flex items-stretch gap-2 rounded-2xl border-2 border-dashed border-indigo-300 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                রেফারেল কোড
              </p>
              <p className="text-xl font-bold tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tabular-nums mt-0.5 truncate">
                {user.numericId || '——'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => user.numericId && handleCopy(user.numericId, 'code')}
              disabled={!user.numericId}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-sm hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {copied === 'code' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> কপি!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> কপি
                </>
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

        {/* 4. Account-status banner — only visible when not active. */}
        {!user.isActive && (
          <motion.button
            type="button"
            onClick={() => setView('account-activation')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full text-left rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white p-4 shadow-[0_12px_28px_-12px_rgba(99,102,241,0.6)] hover:shadow-[0_18px_36px_-12px_rgba(99,102,241,0.7)] transition-all active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-300 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-200">
                  আপনার অ্যাকাউন্ট এখনও অ্যাক্টিভ নয়
                </p>
                <p className="text-xs text-indigo-100/90 mt-0.5">
                  উইথড্র সুবিধা পেতে অ্যাকাউন্ট ভেরিফাই করুন
                </p>
              </div>
              <span className="shrink-0 px-3 h-9 inline-flex items-center rounded-lg bg-white text-indigo-700 text-xs font-bold">
                ভেরিফাই করুন
              </span>
            </div>
          </motion.button>
        )}

        {/* 5. Services grid — 3 columns to match competitor density. */}
        <section>
          <div className="flex items-end justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                ইনকাম শুরু করুন
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                যেকোনো ক্যাটাগরি থেকে কাজ শুরু করুন
              </p>
            </div>
          </div>
          {visibleTiles.length === 0 ? (
            <Card padded>
              <p className="text-sm text-slate-600 text-center py-4">
                এই মুহূর্তে কোনো ইনকাম ক্যাটাগরি চালু নেই।
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {visibleTiles.map((tile, i) => (
                <motion.button
                  key={`${tile.gateTitle}-${i}`}
                  type="button"
                  onClick={() => setView(tile.destination)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: 0.02 + i * 0.02 }}
                  className="relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_6px_18px_-8px_rgba(15,23,42,0.12)] p-3 flex flex-col items-center gap-1.5 text-center transition-shadow hover:shadow-[0_10px_28px_-8px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 min-h-[96px]"
                >
                  <span
                    className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${tile.iconBg} text-white inline-flex items-center justify-center shadow-md`}
                  >
                    {tile.icon}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-900 leading-tight">
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

// Re-export `INCOME_CARDS` participation marker — see previous comment.
void INCOME_CARDS;
