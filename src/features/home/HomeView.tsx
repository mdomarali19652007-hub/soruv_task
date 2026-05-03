/**
 * HomeView — modern fintech-style landing screen.
 *
 * Combines the IA improvements from
 * `plans/user-friendly-ui-redesign-for-production-launch.md` (5
 * grouped Earn categories instead of 16-tile dump, persistent shell,
 * activate-banner only when needed) with a richer visual language:
 *   - gradient hero balance card with soft glow
 *   - frosted-glass surfaces over a mesh-gradient body
 *   - per-category accent gradients with subtle motion
 *   - animated tap response on every interactive surface
 */
import {
  ArrowRight,
  Bell,
  Briefcase,
  ChevronRight,
  Eye,
  EyeOff,
  Gamepad2,
  Gift,
  Headphones,
  Megaphone,
  PlayCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, type ReactNode } from 'react';
import type { UserProfile, View } from '../../types';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  ListRow,
  SectionHeader,
} from '../../components/ui';

interface Props {
  user: UserProfile;
  setView: (view: View) => void;
  onOpenNotifications: () => void;
  /** Daily reward in BDT (admin-tunable). */
  dailyReward: number;
  /** Whether the daily-claim feature is admin-enabled. */
  dailyClaimEnabled: boolean;
  onClaimDaily: () => void;
  /** Marquee/notice text from admin config. */
  globalNotice: string;
  totalPaid: number;
  activeWorkerCount: number;
  /** Feature flags (from admin config) — used to gate categories. */
  enabledCards: string[];
  isAdmin: boolean;
}

interface CategoryDef {
  id: string;
  title: string;
  description: string;
  destination: View;
  icon: ReactNode;
  /** Tailwind gradient classes for the icon tile. */
  iconBg: string;
  /** Subtle background tint for the whole card. */
  cardTint: string;
  /** Cards from `INCOME_CARDS` that are gated under this category. */
  gateTitles: string[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'daily',
    title: 'দৈনিক কাজ',
    description: 'আজকের জব ও মাইক্রো টাস্ক',
    destination: 'folder-a',
    icon: <Briefcase className="w-6 h-6" />,
    iconBg: 'from-indigo-500 to-blue-500',
    cardTint: 'from-indigo-500/5 to-blue-500/5',
    gateTitles: ['Daily Job', 'Micro Tasks', 'Premium Jobs'],
  },
  {
    id: 'ads',
    title: 'বিজ্ঞাপন ও সংবাদ',
    description: 'অ্যাড দেখুন, খবর পড়ুন, স্পিন জিতুন',
    destination: 'ads-earn',
    icon: <PlayCircle className="w-6 h-6" />,
    iconBg: 'from-amber-500 to-orange-500',
    cardTint: 'from-amber-500/5 to-orange-500/5',
    gateTitles: ['Ads Earn', 'TOP NEWS'],
  },
  {
    id: 'social',
    title: 'সোশ্যাল ও মার্কেটিং',
    description: 'সোশ্যাল টাস্ক, SMM প্যানেল, বুস্টিং',
    destination: 'social-hub',
    icon: <Megaphone className="w-6 h-6" />,
    iconBg: 'from-pink-500 to-rose-500',
    cardTint: 'from-pink-500/5 to-rose-500/5',
    gateTitles: ['Fb Marketing', 'SOCIAL', 'SMM & BOOSTING'],
  },
  {
    id: 'sell',
    title: 'বিক্রি ও ট্রেডিং',
    description: 'OTP, জিমেইল, ডলার, ই-কমার্স',
    destination: 'otp-buy-sell',
    icon: <TrendingUp className="w-6 h-6" />,
    iconBg: 'from-emerald-500 to-teal-500',
    cardTint: 'from-emerald-500/5 to-teal-500/5',
    gateTitles: ['BUY SELL', 'Gmail Sell', 'Asset Trading', 'E-commerce'],
  },
  {
    id: 'gaming',
    title: 'গেমিং',
    description: 'টুর্নামেন্ট ও লুডো ইনকাম',
    destination: 'gaming',
    icon: <Gamepad2 className="w-6 h-6" />,
    iconBg: 'from-violet-500 to-purple-600',
    cardTint: 'from-violet-500/5 to-purple-500/5',
    gateTitles: ['GAMING'],
  },
];

function formatBdt(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function greeting(name: string | undefined | null): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'শুভ সকাল' : hour < 17 ? 'শুভ দুপুর' : 'শুভ সন্ধ্যা';
  if (!name) return part;
  return `${part}, ${name.split(/\s+/)[0]}`;
}

export function HomeView({
  user,
  setView,
  onOpenNotifications,
  dailyReward,
  dailyClaimEnabled,
  onClaimDaily,
  globalNotice,
  totalPaid,
  activeWorkerCount,
  enabledCards,
  isAdmin,
}: Props) {
  const [balanceHidden, setBalanceHidden] = useState(false);
  const hasUnreadNotifications = user.notifications.length > 0;
  const recentTasks = user.taskHistory.slice(0, 5);

  const visibleCategories = CATEGORIES.filter(
    (c) => isAdmin || c.gateTitles.some((t) => enabledCards.includes(t)),
  );

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/40 border-b border-white/40">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-600 truncate">{greeting(user.name)}</p>
            <h1 className="text-base font-semibold text-slate-900 truncate flex items-center gap-1.5">
              টপ আর্নিং
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h1>
          </div>
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="নোটিফিকেশন"
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
            aria-label="প্রোফাইল"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Hero balance card — gradient with soft glow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <Card variant="gradient" glow padded className="p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 text-indigo-100/90">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">প্রধান ব্যালেন্স</span>
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
                  <p className="text-[11px] uppercase tracking-wide text-indigo-100/70">মোট আয়</p>
                  <p className="text-base font-semibold tabular-nums mt-0.5">
                    ৳{balanceHidden ? '••••' : formatBdt(user.totalEarned)}
                  </p>
                </div>
                <div className="rounded-xl glass-highlight px-3 py-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-indigo-100/70">পেন্ডিং</p>
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
                  onClick={() => setView('referral')}
                  className="flex-1 h-11 rounded-xl bg-white/15 text-white font-semibold text-sm border border-white/20 hover:bg-white/25 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> রেফার
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Activate banner */}
        {!user.isActive && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card padded className="border-rose-200/70 bg-gradient-to-br from-rose-50/80 to-amber-50/80">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 text-white inline-flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-900">
                    আপনার অ্যাকাউন্ট অ্যাক্টিভেট করুন
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    উইথড্র ও রেফারেল কমিশন আনলক করুন।
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <Button
                  fullWidth
                  onClick={() => setView('account-activation')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  এখনই অ্যাক্টিভেট করুন
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Daily reward */}
        {dailyClaimEnabled && (
          <Card padded>
            <div className="flex items-center gap-3">
              <span className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white inline-flex items-center justify-center shadow-md">
                <Gift className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-900">দৈনিক পুরস্কার</p>
                <p className="text-sm text-slate-600">
                  {user.dailyClaimed
                    ? 'আগামীকাল আবার আসুন'
                    : `আজ ৳${formatBdt(dailyReward)} ক্লেইম করুন`}
                </p>
              </div>
              <Button
                size="sm"
                variant={user.dailyClaimed ? 'secondary' : 'primary'}
                disabled={user.dailyClaimed}
                onClick={onClaimDaily}
              >
                {user.dailyClaimed ? 'ক্লেইম হয়েছে' : 'ক্লেইম'}
              </Button>
            </div>
          </Card>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          <Chip
            tone="primary"
            leadingIcon={<Smartphone className="w-4 h-4" />}
            onClick={() => setView('mobile-recharge')}
          >
            রিচার্জ
          </Chip>
          <Chip
            tone="primary"
            leadingIcon={<Headphones className="w-4 h-4" />}
            onClick={() => setView('support')}
          >
            সাপোর্ট
          </Chip>
          <Chip
            tone="primary"
            leadingIcon={<Users className="w-4 h-4" />}
            onClick={() => setView('leaderboard')}
          >
            লিডারবোর্ড
          </Chip>
          <Chip
            tone="primary"
            leadingIcon={<TrendingUp className="w-4 h-4" />}
            onClick={() => setView('spin')}
          >
            স্পিন
          </Chip>
        </div>

        {/* Notice */}
        {globalNotice && (
          <Card padded className="bg-gradient-to-r from-indigo-50/70 to-violet-50/70 border-indigo-100/60">
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 inline-flex w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white items-center justify-center shadow-sm">
                <Megaphone className="w-4 h-4" />
              </span>
              <p className="flex-1 text-sm text-slate-800 leading-relaxed">
                {globalNotice}
              </p>
            </div>
          </Card>
        )}

        {/* Earn categories */}
        <section>
          <SectionHeader title="ইনকাম শুরু করুন" subtitle="যেকোনো ক্যাটাগরি বেছে নিন" />
          <div className="grid grid-cols-1 gap-3">
            {visibleCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                type="button"
                onClick={() => setView(cat.destination)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 + i * 0.04 }}
                className={`relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white/60 rounded-2xl shadow-[0_8px_24px_-8px_rgba(15,23,42,0.12)] p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-[0_12px_36px_-8px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500`}
              >
                {/* Subtle category tint background */}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${cat.cardTint}`}
                />
                <span
                  className={`relative shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br ${cat.iconBg} text-white inline-flex items-center justify-center shadow-md`}
                >
                  {cat.icon}
                </span>
                <span className="relative flex-1 min-w-0">
                  <span className="block text-base font-semibold text-slate-900">
                    {cat.title}
                  </span>
                  <span className="block text-sm text-slate-600 truncate">
                    {cat.description}
                  </span>
                </span>
                <ChevronRight className="relative w-5 h-5 text-slate-400 shrink-0" />
              </motion.button>
            ))}
            {visibleCategories.length === 0 && (
              <Card padded>
                <EmptyState
                  title="কোনো ক্যাটাগরি চালু নেই"
                  description="অ্যাডমিনকে ইনকাম ফিচার চালু করতে বলুন।"
                />
              </Card>
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <SectionHeader
            title="সাম্প্রতিক কাজ"
            action={
              recentTasks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setView('dashboard')}
                  className="text-sm font-semibold text-indigo-600 hover:underline focus:outline-none"
                >
                  সব দেখুন
                </button>
              ) : undefined
            }
          />
          {recentTasks.length === 0 ? (
            <Card padded>
              <EmptyState
                title="এখনো কোনো কাজ করা হয়নি"
                description="আপনার সম্পূর্ণ করা কাজগুলো এখানে দেখা যাবে।"
                action={
                  <Button onClick={() => setView('folder-a')} size="sm">
                    কাজ দেখুন
                  </Button>
                }
              />
            </Card>
          ) : (
            <Card padded={false}>
              {recentTasks.map((task) => (
                <ListRow
                  key={task.id}
                  title={task.title}
                  subtitle={task.date}
                  trailing={
                    <span className="text-base font-semibold text-emerald-600 tabular-nums">
                      +৳{formatBdt(task.reward)}
                    </span>
                  }
                  showChevron={false}
                />
              ))}
            </Card>
          )}
        </section>

        {/* Trust strip */}
        <Card padded>
          <div className="grid grid-cols-2 divide-x divide-slate-200/60">
            <div className="pr-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">মোট পরিশোধিত</p>
              <p className="text-lg font-semibold tabular-nums text-emerald-600 mt-0.5">
                ৳{totalPaid.toLocaleString('en-US')}+
              </p>
            </div>
            <div className="pl-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">সক্রিয় ইউজার</p>
              <p className="text-lg font-semibold tabular-nums text-indigo-600 mt-0.5">
                {(activeWorkerCount / 1000).toFixed(0)}k+
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
