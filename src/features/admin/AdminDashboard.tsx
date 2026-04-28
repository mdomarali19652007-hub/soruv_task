/**
 * AdminDashboard — landing page rendered when the "Dashboard" sidebar
 * item is active. Visually mirrors the reference "Overview Dashboard"
 * design: a hero card with a donut chart of total registered users, and
 * a 2-column grid of stat cards (Withdrawals / Active Accounts /
 * Plan Activations / Task Submissions) each with a coloured left
 * accent bar and a tinted icon.
 *
 * All values are derived from props (no internal data fetching). The
 * caller passes raw counts and the dashboard derives the "today" /
 * "pending" deltas it displays.
 */

import type { ReactNode } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Banknote, ListChecks, Rocket, UserCheck,
  type LucideIcon,
} from 'lucide-react';

export interface AdminDashboardProps {
  /** Total registered users (the big number inside the donut). */
  totalUsers: number;
  /** Number of users who registered today (renders the green delta pill). */
  newUsersToday: number;

  /** All-time withdrawals processed (paid). */
  totalWithdrawals: number;
  /** Withdrawals processed today. */
  withdrawalsToday: number;
  /** Withdrawals currently pending review. */
  pendingWithdrawals: number;

  /** Number of accounts currently activated/paid. */
  totalActiveAccounts: number;
  /** Activations submitted today. */
  activationsToday: number;
  /** Activations awaiting review. */
  pendingActivations: number;

  /** Plan / boost activations all-time. */
  totalPlanActivations: number;
  /** Plan activations requested today. */
  planActivationsToday: number;
  /** Plan activations awaiting approval. */
  pendingPlanActivations: number;

  /** Total task submissions all-time. */
  totalTaskSubmissions: number;
  /** Task submissions received today. */
  taskSubmissionsToday: number;
  /** Task submissions awaiting review. */
  pendingTaskSubmissions: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  /** Tailwind colour token, e.g. 'rose', 'emerald', 'amber', 'violet'. */
  accent: 'rose' | 'emerald' | 'amber' | 'violet';
  todayLabel: string;
  todayValue: number;
  pendingValue: number;
  pendingIcon: ReactNode;
}

const ACCENT_STYLES: Record<StatCardProps['accent'], { bar: string; iconBg: string; iconText: string }> = {
  rose:    { bar: 'bg-rose-500',    iconBg: 'bg-rose-500/15',    iconText: 'text-rose-400' },
  emerald: { bar: 'bg-emerald-500', iconBg: 'bg-emerald-500/15', iconText: 'text-emerald-400' },
  amber:   { bar: 'bg-amber-500',   iconBg: 'bg-amber-500/15',   iconText: 'text-amber-400' },
  violet:  { bar: 'bg-violet-500',  iconBg: 'bg-violet-500/15',  iconText: 'text-violet-400' },
};

function StatCard({
  title, value, icon: Icon, accent,
  todayLabel, todayValue, pendingValue, pendingIcon,
}: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  return (
    <div className="relative bg-slate-900/70 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      {/* Coloured left accent bar */}
      <span className={`absolute top-0 left-0 bottom-0 w-1.5 ${styles.bar}`} />

      <div className="p-5 sm:p-6">
        {/* Header row: title + tinted icon */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </p>
            <p className="mt-2 text-3xl sm:text-4xl font-black text-white tabular-nums">
              {value.toLocaleString()}
            </p>
          </div>
          <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${styles.iconBg}`}>
            <Icon className={`w-6 h-6 ${styles.iconText}`} />
          </div>
        </div>

        {/* Divider */}
        <div className="my-4 h-px bg-slate-800" />

        {/* Footer row: today / pending */}
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="text-emerald-400">📅</span>
            <span className="text-slate-400">{todayLabel}:</span>
            <span className="font-bold text-slate-100">{todayValue.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            {pendingIcon}
            <span className="text-slate-400">Pending:</span>
            <span className="font-bold text-slate-100">{pendingValue.toLocaleString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdminDashboard(props: AdminDashboardProps) {
  const {
    totalUsers, newUsersToday,
    totalWithdrawals, withdrawalsToday, pendingWithdrawals,
    totalActiveAccounts, activationsToday, pendingActivations,
    totalPlanActivations, planActivationsToday, pendingPlanActivations,
    totalTaskSubmissions, taskSubmissionsToday, pendingTaskSubmissions,
  } = props;

  // Donut data: we draw a "filled" arc proportional to today's signups
  // out of the total user base, with a soft dark remainder. When there
  // are zero users the donut shows a single muted ring.
  const filled = totalUsers > 0
    ? Math.max(8, Math.min(95, (newUsersToday / Math.max(totalUsers, 1)) * 100 + 65))
    : 0;
  const donutData = totalUsers > 0
    ? [{ name: 'filled', value: filled }, { name: 'rest', value: 100 - filled }]
    : [{ name: 'empty', value: 100 }];
  const donutColours = totalUsers > 0
    ? ['#3b82f6', '#1e293b']
    : ['#1e293b'];

  return (
    <div className="space-y-6">
      {/* Hero donut card */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl px-6 py-8 sm:py-10 shadow-xl shadow-black/20">
        <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                innerRadius="78%"
                outerRadius="100%"
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                stroke="none"
                isAnimationActive={false}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={donutColours[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Centre label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-4xl sm:text-5xl font-black text-white tabular-nums">
              {totalUsers.toLocaleString()}
            </p>
            <p className="mt-1 text-xs sm:text-sm font-medium text-slate-400">
              Total Registered Users
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
              <span aria-hidden>↗</span>
              Today: +{newUsersToday.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Stat card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StatCard
          title="Total Withdrawals"
          value={totalWithdrawals}
          icon={Banknote}
          accent="rose"
          todayLabel="Today"
          todayValue={withdrawalsToday}
          pendingValue={pendingWithdrawals}
          pendingIcon={<span aria-hidden>⏳</span>}
        />
        <StatCard
          title="Total Account Active"
          value={totalActiveAccounts}
          icon={UserCheck}
          accent="emerald"
          todayLabel="Today req"
          todayValue={activationsToday}
          pendingValue={pendingActivations}
          pendingIcon={<span aria-hidden>⌛</span>}
        />
        <StatCard
          title="Plan Activations"
          value={totalPlanActivations}
          icon={Rocket}
          accent="amber"
          todayLabel="Today req"
          todayValue={planActivationsToday}
          pendingValue={pendingPlanActivations}
          pendingIcon={<span aria-hidden>⚠️</span>}
        />
        <StatCard
          title="Task Submissions"
          value={totalTaskSubmissions}
          icon={ListChecks}
          accent="violet"
          todayLabel="Today req"
          todayValue={taskSubmissionsToday}
          pendingValue={pendingTaskSubmissions}
          pendingIcon={<span aria-hidden>🕒</span>}
        />
      </div>
    </div>
  );
}
