/**
 * HomeView — redesigned, calm landing screen.
 *
 * Implements §3 + §5 of `plans/user-friendly-ui-redesign-for-production-launch.md`:
 *   - Greeting + balance summary
 *   - Activate-account banner only when needed
 *   - 4 quick-action chips (Withdraw / Refer / Recharge / Support)
 *   - 5 grouped Earn category cards (no more 16-tile dump)
 *   - Recent activity from `taskHistory` (last 5)
 *   - Daily reward CTA (only when feature is enabled and not yet claimed)
 *   - Notice banner (admin global notice)
 *
 * Rendered inside the existing App shell; the parent supplies a top
 * spacing offset and bottom padding for the persistent BottomNav.
 */
import {
  ArrowRight,
  Bell,
  Briefcase,
  ChevronRight,
  Gamepad2,
  Gift,
  Headphones,
  Megaphone,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { UserProfile, View } from '../../types';
import {
  BalancePill,
  Button,
  Card,
  Chip,
  EmptyState,
  ListRow,
  SectionHeader,
  Stat,
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
  /** Cards from `INCOME_CARDS` that are gated under this category. If
   *  none of them are in `enabledCards` the category card is hidden. */
  gateTitles: string[];
}

/** Five Earn category cards — the de-duplicated version of the legacy
 *  16-tile `INCOME_CARDS` dump. The `gateTitles` are matched against
 *  the admin's `enabledCards` flag so a category only appears when at
 *  least one of its underlying tiles is enabled. */
const CATEGORIES: CategoryDef[] = [
  {
    id: 'daily',
    title: 'Daily Tasks',
    description: 'Today\'s job and micro tasks',
    destination: 'folder-a',
    icon: <Briefcase className="w-6 h-6" />,
    gateTitles: ['Daily Job', 'Micro Tasks', 'Premium Jobs'],
  },
  {
    id: 'ads',
    title: 'Ads & News',
    description: 'Watch ads, read news, spin to win',
    destination: 'ads-earn',
    icon: <PlayCircle className="w-6 h-6" />,
    gateTitles: ['Ads Earn', 'TOP NEWS'],
  },
  {
    id: 'social',
    title: 'Social & Marketing',
    description: 'Social tasks, SMM panel, boosting',
    destination: 'social-hub',
    icon: <Megaphone className="w-6 h-6" />,
    gateTitles: ['Fb Marketing', 'SOCIAL', 'SMM & BOOSTING'],
  },
  {
    id: 'sell',
    title: 'Sell & Trade',
    description: 'OTP, Gmail, Dollar, e-commerce',
    destination: 'otp-buy-sell',
    icon: <TrendingUp className="w-6 h-6" />,
    gateTitles: ['BUY SELL', 'Gmail Sell', 'Asset Trading', 'E-commerce'],
  },
  {
    id: 'gaming',
    title: 'Gaming',
    description: 'Tournaments and Ludo earn',
    destination: 'gaming',
    icon: <Gamepad2 className="w-6 h-6" />,
    gateTitles: ['GAMING'],
  },
];

function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function greeting(name: string | undefined | null): string {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  if (!name) return part;
  // Use first word of the name for compact display.
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
  const hasUnreadNotifications = user.notifications.length > 0;
  const recentTasks = user.taskHistory.slice(0, 5);

  const visibleCategories = CATEGORIES.filter(
    (c) => isAdmin || c.gateTitles.some((t) => enabledCards.includes(t)),
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 truncate">{greeting(user.name)}</p>
            <h1 className="text-base font-semibold text-slate-900 truncate">
              Top Earning
            </h1>
          </div>
          <BalancePill amount={user.mainBalance} onClick={() => setView('finance')} />
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="relative w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Bell className="w-5 h-5" />
            {hasUnreadNotifications && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border border-white" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setView('profile')}
            aria-label="Profile"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Activate banner — only when account is inactive */}
        {!user.isActive && (
          <Card padded className="border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-10 h-10 rounded-full bg-red-100 text-red-600 inline-flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-900">
                  Activate your account
                </p>
                <p className="text-sm text-slate-600 mt-0.5">
                  Unlock withdrawals and earn referral commission.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                fullWidth
                onClick={() => setView('account-activation')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Activate now
              </Button>
            </div>
          </Card>
        )}

        {/* Balance summary */}
        <Card padded>
          <SectionHeader
            title="Your balance"
            action={
              <button
                type="button"
                onClick={() => setView('dashboard')}
                className="text-sm font-medium text-blue-600 hover:underline focus:outline-none"
              >
                Details
              </button>
            }
          />
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Available"
              value={formatBdt(user.mainBalance)}
              icon={<Wallet className="w-4 h-4" />}
            />
            <Stat
              label="Earned"
              value={formatBdt(user.totalEarned)}
              tone="success"
            />
            <Stat
              label="Pending"
              value={formatBdt(user.pendingPayout)}
            />
          </div>
        </Card>

        {/* Daily reward */}
        {dailyClaimEnabled && (
          <Card padded>
            <div className="flex items-center gap-3">
              <span className="shrink-0 w-10 h-10 rounded-full bg-blue-50 text-blue-600 inline-flex items-center justify-center">
                <Gift className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-slate-900">Daily reward</p>
                <p className="text-sm text-slate-600">
                  {user.dailyClaimed
                    ? 'Come back tomorrow'
                    : `Claim ${formatBdt(dailyReward)} today`}
                </p>
              </div>
              <Button
                size="sm"
                variant={user.dailyClaimed ? 'secondary' : 'primary'}
                disabled={user.dailyClaimed}
                onClick={onClaimDaily}
              >
                {user.dailyClaimed ? 'Claimed' : 'Claim'}
              </Button>
            </div>
          </Card>
        )}

        {/* Quick actions */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4">
          <Chip
            tone="primary"
            leadingIcon={<Wallet className="w-4 h-4" />}
            onClick={() => setView('finance')}
          >
            Withdraw
          </Chip>
          <Chip
            tone="primary"
            leadingIcon={<Users className="w-4 h-4" />}
            onClick={() => setView('referral')}
          >
            Refer
          </Chip>
          <Chip
            tone="primary"
            leadingIcon={<Smartphone className="w-4 h-4" />}
            onClick={() => setView('mobile-recharge')}
          >
            Recharge
          </Chip>
          <Chip
            tone="primary"
            leadingIcon={<Headphones className="w-4 h-4" />}
            onClick={() => setView('support')}
          >
            Support
          </Chip>
        </div>

        {/* Notice */}
        {globalNotice && (
          <Card padded className="bg-blue-50 border-blue-100">
            <div className="flex items-start gap-3">
              <span className="shrink-0 mt-0.5 inline-flex w-8 h-8 rounded-full bg-blue-100 text-blue-700 items-center justify-center">
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
          <SectionHeader title="Earn" subtitle="Pick a category to start" />
          <div className="grid grid-cols-1 gap-3">
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setView(cat.destination)}
                className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <span className="shrink-0 w-12 h-12 rounded-xl bg-blue-50 text-blue-600 inline-flex items-center justify-center">
                  {cat.icon}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-base font-semibold text-slate-900">
                    {cat.title}
                  </span>
                  <span className="block text-sm text-slate-600 truncate">
                    {cat.description}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
              </button>
            ))}
            {visibleCategories.length === 0 && (
              <Card padded>
                <EmptyState
                  title="No categories enabled"
                  description="Ask an admin to enable earning features."
                />
              </Card>
            )}
          </div>
        </section>

        {/* Recent activity */}
        <section>
          <SectionHeader
            title="Recent activity"
            action={
              recentTasks.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setView('dashboard')}
                  className="text-sm font-medium text-blue-600 hover:underline focus:outline-none"
                >
                  See all
                </button>
              ) : undefined
            }
          />
          {recentTasks.length === 0 ? (
            <Card padded>
              <EmptyState
                title="No tasks yet"
                description="Your completed tasks will appear here."
                action={
                  <Button onClick={() => setView('folder-a')} size="sm">
                    Browse tasks
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
                    <span className="text-base font-semibold text-green-600 tabular-nums">
                      +{formatBdt(task.reward)}
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
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <Stat
              label="Total paid"
              value={`৳${totalPaid.toLocaleString('en-US')}+`}
              tone="success"
              className="pr-3"
            />
            <Stat
              label="Active workers"
              value={`${(activeWorkerCount / 1000).toFixed(0)}k+`}
              className="pl-3"
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
