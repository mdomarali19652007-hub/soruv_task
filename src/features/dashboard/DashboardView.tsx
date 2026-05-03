/**
 * DashboardView — modern fintech-style stats screen.
 *
 * Glass / gradient aesthetic that matches `HomeView`:
 *   - hero balance card with brand gradient and soft glow
 *   - frosted-glass referral card with a prominent code pill
 *   - achievement progress bars rendered with gradient fills and
 *     `aria-valuenow` for accessibility
 *
 * The shape of the props is unchanged so App.tsx wiring is identical.
 */

import { useState } from 'react';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Share2,
  Trophy,
  User,
  Wallet,
} from 'lucide-react';
import { motion } from 'motion/react';
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
  /** Used to compute referral counts in the referral program card. */
  allUsers: UserProfile[];
  referralCommissionRate: number;
}

function formatBdt(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function DashboardView({
  user,
  setView,
  allUsers,
  referralCommissionRate,
}: Props) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const profilePic = (user as unknown as { profilePic?: string }).profilePic;

  const totalReferrals = allUsers.filter((u) => u.referredBy === user.id).length;
  const activeReferrals = allUsers.filter(
    (u) => u.referredBy === user.id && u.isActive,
  ).length;

  const handleCopy = (text: string, kind: 'code' | 'link') => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen pb-28">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/40 border-b border-white/40">
        <div className="max-w-md mx-auto flex items-center gap-3 px-3 py-3">
          <button
            type="button"
            onClick={() => setView('home')}
            aria-label="Back to home"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 bg-white/60 backdrop-blur border border-white/60 hover:bg-white/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-base font-semibold text-slate-900 truncate">
            পরিসংখ্যান
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card padded>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                {profilePic ? (
                  <img
                    src={profilePic}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User className="w-8 h-8" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 truncate">
                  {user.name || 'নামহীন'}
                </h2>
                {user.id && (
                  <p className="text-sm text-slate-500 truncate">{user.id}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <Chip tone="primary">{user.rank} র‍্যাঙ্ক</Chip>
                  {user.isActive ? (
                    <Chip tone="success">অ্যাক্টিভ</Chip>
                  ) : (
                    <Chip tone="danger" onClick={() => setView('account-activation')}>
                      ইনঅ্যাক্টিভ — অ্যাক্টিভেট করুন
                    </Chip>
                  )}
                </div>
                {user.isActive && user.activationExpiry && (
                  <p className="text-xs text-slate-500 mt-2">
                    মেয়াদ শেষ: {new Date(user.activationExpiry).toLocaleDateString('bn-BD')}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Hero balance — gradient with glow */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card variant="gradient" glow padded className="p-6">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-indigo-100/90">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm font-medium">মেইন ব্যালেন্স</span>
                </div>
                <button
                  type="button"
                  onClick={() => setView('finance')}
                  className="text-xs font-semibold tracking-wide text-white bg-white/15 hover:bg-white/25 transition-colors rounded-full px-3 py-1"
                >
                  উইথড্র
                </button>
              </div>
              <p className="text-4xl font-bold tracking-tight tabular-nums">
                <span className="text-indigo-100/80 text-2xl mr-1 align-top">৳</span>
                {formatBdt(user.mainBalance)}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl glass-highlight px-3 py-2.5">
                  <p className="text-[11px] tracking-wide text-indigo-100/70">মোট ইনকাম</p>
                  <p className="text-base font-semibold tabular-nums mt-0.5">
                    ৳{formatBdt(user.totalEarned)}
                  </p>
                </div>
                <div className="rounded-xl glass-highlight px-3 py-2.5">
                  <p className="text-[11px] tracking-wide text-indigo-100/70">পেন্ডিং</p>
                  <p className="text-base font-semibold tabular-nums mt-0.5">
                    ৳{formatBdt(user.pendingPayout)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Referral program — frosted glass with prominent code */}
        <Card padded>
          <SectionHeader
            title="রেফারেল প্রোগ্রাম"
            subtitle={`লাইফটাইম কমিশন: ${referralCommissionRate}%`}
          />

          <div className="mt-1 flex flex-col items-center text-center">
            <p className="text-sm text-slate-600 mb-2">আপনার রেফারেল কোড</p>
            <button
              type="button"
              onClick={() => user.numericId && handleCopy(user.numericId, 'code')}
              disabled={!user.numericId}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-200/60 hover:from-indigo-500/15 hover:to-violet-500/15 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <span className="text-3xl font-bold tracking-wider bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tabular-nums">
                {user.numericId || '——'}
              </span>
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
                {copied === 'code' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </span>
            </button>
            {copied === 'code' && (
              <p className="text-xs text-emerald-600 mt-2">কপি হয়েছে!</p>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={!user.numericId}
              leftIcon={
                copied === 'link' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )
              }
              className="mt-3"
              onClick={() => {
                if (!user.numericId) return;
                handleCopy(
                  `${window.location.origin}?ref=${user.numericId}`,
                  'link',
                );
              }}
            >
              {copied === 'link' ? 'লিংক কপি হয়েছে' : 'রেফারেল লিংক কপি করুন'}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/60 border border-white/70 backdrop-blur p-3 text-center">
              <p className="text-xs tracking-wide text-slate-500">মোট</p>
              <p className="text-lg font-semibold text-slate-900 mt-0.5 tabular-nums">
                {totalReferrals}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-200/60 p-3 text-center">
              <p className="text-xs tracking-wide text-emerald-700/80">অ্যাক্টিভ</p>
              <p className="text-lg font-semibold text-emerald-700 mt-0.5 tabular-nums">
                {activeReferrals}
              </p>
            </div>
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-200/60 p-3 text-center">
              <p className="text-xs tracking-wide text-indigo-700/80">ইনকাম</p>
              <p className="text-lg font-semibold text-indigo-700 mt-0.5 tabular-nums">
                ৳{formatBdt(user.totalCommission ?? 0)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setView('referral')}
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              রেফারেল হাব খুলুন
            </Button>
          </div>
        </Card>

        {/* Achievements */}
        <section>
          <SectionHeader title="অর্জনসমূহ" />
          {user.achievements.length === 0 ? (
            <Card padded>
              <EmptyState
                icon={<Trophy className="w-7 h-7" />}
                title="এখনো কোনো অর্জন নেই"
                description="কাজ সম্পন্ন করে মাইলফলক আনলক করুন।"
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {user.achievements.map((ach) => {
                const pct = Math.min(
                  100,
                  Math.round((ach.progress / Math.max(1, ach.goal)) * 100),
                );
                const done = pct >= 100;
                return (
                  <Card key={ach.id} padded>
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 w-9 h-9 rounded-xl text-white inline-flex items-center justify-center shadow-sm ${done ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' : 'bg-gradient-to-br from-indigo-400 to-violet-600'}`}>
                          <Award className="w-4 h-4" />
                        </span>
                        <p className="text-base font-semibold text-slate-900 truncate">
                          {ach.title}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 tabular-nums shrink-0">
                        {ach.progress}/{ach.goal}
                      </p>
                    </div>
                    <div
                      className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${done ? 'from-emerald-400 to-emerald-600' : 'from-indigo-500 to-violet-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent tasks */}
        <section>
          <SectionHeader title="সাম্প্রতিক কাজ" />
          {user.taskHistory.length === 0 ? (
            <Card padded>
              <EmptyState
                icon={<FileText className="w-7 h-7" />}
                title="এখনো কোনো কাজ সম্পন্ন হয়নি"
                description="সম্পন্ন কাজ থেকে আয় এখানে দেখা যাবে।"
              />
            </Card>
          ) : (
            <Card padded={false}>
              {user.taskHistory.slice(0, 20).map((task) => (
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
      </main>
    </div>
  );
}
