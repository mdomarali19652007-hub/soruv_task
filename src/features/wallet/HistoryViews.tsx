/**
 * History sub-views reachable from the sidebar drawer.
 *
 *   - IncomeHistoryView   — every reward earned (from `taskHistory`)
 *   - BalanceHistoryView  — running ledger derived from rewards +
 *                           withdrawals
 *   - PaymentHistoryView  — withdrawals + deposits
 *
 * The plan calls for "the existing transaction list rendering with
 * different filters" so all three views render the same row shape
 * (icon, title, amount tone, date) — just over different data.
 */
import type { ReactNode } from 'react';
import { ArrowDownToLine, ArrowUpFromLine, Coins } from 'lucide-react';
import { EmptyState, TopHeader } from '../../components/ui';
import type { UserProfile, View } from '../../types';

interface WithdrawalRow {
  id: string;
  userId?: string;
  amount: number;
  receiveAmount?: number;
  fee?: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  reason?: string;
}

interface DepositRow {
  id: string;
  userId?: string;
  amount: number;
  operator?: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface CommonProps {
  user: UserProfile;
  withdrawals: WithdrawalRow[];
  recharges: DepositRow[];
  setView: (view: View) => void;
  onOpenSidebar?: () => void;
}

function formatBdt(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

interface RowData {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  amountTone: 'positive' | 'negative' | 'neutral';
  date: string;
  badge?: string;
  icon: ReactNode;
  iconBg: string;
}

function renderRow(row: RowData) {
  return (
    <li
      key={row.id}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm"
    >
      <span
        className={`shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br ${row.iconBg} text-white inline-flex items-center justify-center shadow-sm`}
      >
        {row.icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">{row.title}</p>
        {row.subtitle && (
          <p className="text-[11px] text-slate-500 truncate">{row.subtitle}</p>
        )}
        <p className="text-[10px] text-slate-400 mt-0.5">{row.date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`text-sm font-bold tabular-nums ${
            row.amountTone === 'positive'
              ? 'text-emerald-600'
              : row.amountTone === 'negative'
                ? 'text-rose-600'
                : 'text-slate-700'
          }`}
        >
          {row.amountTone === 'positive' ? '+' : row.amountTone === 'negative' ? '-' : ''}৳{' '}
          {formatBdt(Math.abs(row.amount))}
        </p>
        {row.badge && (
          <span className="inline-flex mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
            {row.badge}
          </span>
        )}
      </div>
    </li>
  );
}

export function IncomeHistoryView({ user, setView, onOpenSidebar }: CommonProps) {
  const rows: RowData[] = (user.taskHistory ?? [])
    .slice()
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
    .map((r) => ({
      id: r.id,
      title: r.title,
      amount: r.reward,
      amountTone: 'positive' as const,
      date: r.date,
      icon: <Coins className="w-5 h-5" />,
      iconBg: 'from-emerald-500 to-teal-600',
    }));

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="ইনকাম হিস্ট্রি"
        showBack
        onBack={() => setView('finance')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4">
        {rows.length === 0 ? (
          <EmptyState
            title="এখনও কোনো ইনকাম নেই"
            description="কাজ সম্পন্ন করুন এবং এখানে আপনার সম্পূর্ণ হিস্ট্রি দেখুন।"
          />
        ) : (
          <ul className="space-y-2.5">{rows.map(renderRow)}</ul>
        )}
      </main>
    </div>
  );
}

export function BalanceHistoryView({ user, withdrawals, setView, onOpenSidebar }: CommonProps) {
  const rows: RowData[] = [
    ...(user.taskHistory ?? []).map((t) => ({
      id: `inc-${t.id}`,
      title: t.title,
      amount: t.reward,
      amountTone: 'positive' as const,
      date: t.date,
      icon: <Coins className="w-5 h-5" />,
      iconBg: 'from-emerald-500 to-teal-600',
    })),
    ...withdrawals
      .filter((w) => w.userId === user.id)
      .map((w) => ({
        id: `w-${w.id}`,
        title: `উইথড্র • ${w.method}`,
        amount: w.amount,
        amountTone: 'negative' as const,
        date: w.date,
        badge: w.status,
        icon: <ArrowUpFromLine className="w-5 h-5" />,
        iconBg: 'from-rose-500 to-pink-600',
      })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="ব্যালেন্স হিস্ট্রি"
        showBack
        onBack={() => setView('finance')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4">
        {rows.length === 0 ? (
          <EmptyState title="কোনো ব্যালেন্স পরিবর্তন হয়নি" />
        ) : (
          <ul className="space-y-2.5">{rows.map(renderRow)}</ul>
        )}
      </main>
    </div>
  );
}

export function PaymentHistoryView({
  user,
  withdrawals,
  recharges,
  setView,
  onOpenSidebar,
}: CommonProps) {
  const rows: RowData[] = [
    ...withdrawals
      .filter((w) => w.userId === user.id)
      .map((w) => ({
        id: `w-${w.id}`,
        title: `উইথড্র • ${w.method}`,
        amount: w.amount,
        amountTone: 'negative' as const,
        date: w.date,
        badge: w.status,
        icon: <ArrowUpFromLine className="w-5 h-5" />,
        iconBg: 'from-rose-500 to-pink-600',
      })),
    ...recharges
      .filter((r) => r.userId === user.id)
      .map((r) => ({
        id: `d-${r.id}`,
        title: `ডিপোজিট${r.operator ? ` • ${r.operator}` : ''}`,
        amount: r.amount,
        amountTone: 'positive' as const,
        date: r.date,
        badge: r.status,
        icon: <ArrowDownToLine className="w-5 h-5" />,
        iconBg: 'from-emerald-500 to-teal-600',
      })),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="পেমেন্ট হিস্ট্রি"
        showBack
        onBack={() => setView('finance')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4">
        {rows.length === 0 ? (
          <EmptyState title="কোনো পেমেন্ট রেকর্ড নেই" />
        ) : (
          <ul className="space-y-2.5">{rows.map(renderRow)}</ul>
        )}
      </main>
    </div>
  );
}
