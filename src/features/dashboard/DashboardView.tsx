/**
 * DashboardView — redesigned stats screen.
 *
 * Replaces the previous "premium" markup (`glass-card`, `glitch-text`,
 * `text-[8px] uppercase tracking-widest` labels, gradient avatar rings)
 * with the calm primitives in `src/components/ui/`.
 *
 * The shape of the props is unchanged so App.tsx wiring is identical
 * to the legacy module — only the visual layer is new.
 *
 * Plan reference: §1, §4, §5 of
 * `plans/user-friendly-ui-redesign-for-production-launch.md`.
 */

import { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Share2,
  Trophy,
  User,
} from 'lucide-react';
import type { UserProfile, View } from '../../types';
import {
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
  /** Used to compute referral counts in the referral program card. */
  allUsers: UserProfile[];
  referralCommissionRate: number;
}

function formatBdt(amount: number): string {
  return `৳${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
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
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-md mx-auto flex items-center gap-3 px-3 py-3">
          <button
            type="button"
            onClick={() => setView('home')}
            aria-label="Back to home"
            className="w-10 h-10 inline-flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-base font-semibold text-slate-900 truncate">
            Stats
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* Profile card */}
        <Card padded>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center overflow-hidden shrink-0">
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
                {user.name || 'Unnamed'}
              </h2>
              {user.id && (
                <p className="text-sm text-slate-500 truncate">{user.id}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                <Chip tone="primary">{user.rank} rank</Chip>
                {user.isActive ? (
                  <Chip tone="success">Active</Chip>
                ) : (
                  <Chip tone="danger" onClick={() => setView('account-activation')}>
                    Inactive — activate
                  </Chip>
                )}
              </div>
              {user.isActive && user.activationExpiry && (
                <p className="text-xs text-slate-500 mt-2">
                  Expires {new Date(user.activationExpiry).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Balances */}
        <Card padded>
          <SectionHeader
            title="Balances"
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setView('finance')}
              >
                Withdraw
              </Button>
            }
          />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Available" value={formatBdt(user.mainBalance)} />
            <Stat
              label="Earned"
              value={formatBdt(user.totalEarned)}
              tone="success"
            />
            <Stat label="Pending" value={formatBdt(user.pendingPayout)} />
          </div>
        </Card>

        {/* Referral program */}
        <Card padded>
          <SectionHeader
            title="Referral program"
            subtitle={`Lifetime commission: ${referralCommissionRate}%`}
          />

          <div className="mt-1 flex flex-col items-center text-center">
            <p className="text-sm text-slate-600 mb-2">Your referral code</p>
            <button
              type="button"
              onClick={() => user.numericId && handleCopy(user.numericId, 'code')}
              disabled={!user.numericId}
              className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="text-3xl font-semibold tracking-wider text-blue-700 tabular-nums">
                {user.numericId || '——'}
              </span>
              <span className="inline-flex w-9 h-9 items-center justify-center rounded-xl bg-white text-blue-600 border border-blue-100">
                {copied === 'code' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </span>
            </button>
            {copied === 'code' && (
              <p className="text-xs text-green-600 mt-2">Copied!</p>
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
              {copied === 'link' ? 'Link copied' : 'Copy referral link'}
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <Stat label="Total" value={totalReferrals} />
            <Stat label="Active" value={activeReferrals} tone="success" />
            <Stat
              label="Earned"
              value={formatBdt(user.totalCommission ?? 0)}
            />
          </div>

          <div className="mt-4">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setView('referral')}
              rightIcon={<ExternalLink className="w-4 h-4" />}
            >
              Open referral hub
            </Button>
          </div>
        </Card>

        {/* Achievements */}
        <section>
          <SectionHeader title="Achievements" />
          {user.achievements.length === 0 ? (
            <Card padded>
              <EmptyState
                icon={<Trophy className="w-7 h-7" />}
                title="No achievements yet"
                description="Complete tasks to unlock milestones."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {user.achievements.map((ach) => {
                const pct = Math.min(
                  100,
                  Math.round((ach.progress / Math.max(1, ach.goal)) * 100),
                );
                return (
                  <Card key={ach.id} padded>
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <p className="text-base font-medium text-slate-900 truncate">
                        {ach.title}
                      </p>
                      <p className="text-sm font-medium text-slate-700 tabular-nums shrink-0">
                        {ach.progress}/{ach.goal}
                      </p>
                    </div>
                    <div
                      className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full bg-blue-600"
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
          <SectionHeader title="Recent tasks" />
          {user.taskHistory.length === 0 ? (
            <Card padded>
              <EmptyState
                icon={<FileText className="w-7 h-7" />}
                title="No tasks completed yet"
                description="Earnings from completed tasks show up here."
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
      </main>
    </div>
  );
}
