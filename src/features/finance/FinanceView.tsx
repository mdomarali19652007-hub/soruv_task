/**
 * FinanceView — Wallet dashboard.
 *
 * Per the "Competitor-aligned UI Restructure" plan this view is now
 * the slim Wallet dashboard. It shows:
 *   1. Balance hero (the card MOVED from HomeView).
 *   2. Quick action row (Withdraw + Balance history + Add funds).
 *   3. Income breakdown list (Today / Yesterday / 7d / 30d / Total),
 *      each tile clicks through to `IncomeDetailView`.
 *
 * The withdrawal form / withdrawal history previously hosted in this
 * file have moved to `src/features/wallet/`. The deposit flow stays
 * here (it is a separate, smaller surface) and the success states
 * for both deposit and withdrawal are still rendered here so the
 * `financeStep` state machine in `App.tsx` keeps working unchanged.
 *
 * The component's prop signature is preserved so `App.tsx` does not
 * need to change its `<FinanceView>` invocation.
 */

import { useMemo, useState, type ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowDownToLine,
  Copy,
  History as HistoryIcon,
  PlusCircle,
  Wallet as WalletIcon,
} from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import {
  Card,
  IncomeBreakdownList,
  TopHeader,
  type IncomeBreakdownItem,
  type IncomePeriod,
} from '../../components/ui';
import type { UserProfile, View } from '../../types';

export type FinanceStep = 'form' | 'success' | 'deposit' | 'deposit-success';

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

export interface WithdrawalRecord {
  userId: string;
  amount: number;
  receiveAmount: number;
  fee: number;
  method: string;
  status: 'pending';
  date: string;
  time: string;
  transactionId?: string;
}

export interface DepositRecord {
  userId: string;
  phone: string;
  operator: 'bKash' | 'Nagad';
  amount: number;
  type: 'Prepaid';
  status: 'pending';
  date: string;
  time: string;
  timestamp: number;
}

interface Props {
  user: Pick<
    UserProfile,
    'id' | 'isActive' | 'mainBalance' | 'pendingPayout' | 'totalEarned' | 'taskHistory'
  >;
  setView: (view: View) => void;
  financeStep: FinanceStep;
  setFinanceStep: (step: FinanceStep) => void;
  minWithdrawal: number;
  withdrawalFee: number;
  withdrawals: WithdrawalRow[];
  lastWithdrawal: WithdrawalRecord | null;
  setLastWithdrawal: (record: WithdrawalRecord | null) => void;
  lastDeposit: DepositRecord | null;
  setLastDeposit: (record: DepositRecord | null) => void;
  isSubmitting: boolean;
  handleSubmission: (action: () => Promise<void>, successMsg?: string) => Promise<void>;
  submitWithdrawal: (
    userId: string,
    amount: number,
    method: string,
    accountNumber: string,
  ) => Promise<unknown>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  /**
   * Optional callback so the wallet header's hamburger can open the
   * App-shell sidebar drawer. Provided by App.tsx.
   */
  onOpenSidebar?: () => void;
  /**
   * Tracks which income period the user picked from the breakdown
   * list. The parent (App.tsx) reads this when rendering
   * `income-detail`.
   */
  onSelectIncomePeriod?: (period: IncomePeriod, amount: number, title: string) => void;
}

function formatBdt(amount: number): string {
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Breaks `taskHistory` rewards into Today / Yesterday / last 7d / last
 * 30d totals. Falls back to 0 silently when a row has an unparsable
 * date — we never want a NaN to leak into the UI.
 */
function aggregateIncome(
  taskHistory: UserProfile['taskHistory'],
  totalEarned: number,
): IncomeBreakdownItem[] {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const today = startOfDay.getTime();
  const yesterday = today - 24 * 60 * 60 * 1000;
  const last7 = today - 7 * 24 * 60 * 60 * 1000;
  const last30 = today - 30 * 24 * 60 * 60 * 1000;

  let todaySum = 0;
  let yesterdaySum = 0;
  let last7Sum = 0;
  let last30Sum = 0;

  for (const row of taskHistory ?? []) {
    const ts = Date.parse(row.date);
    if (Number.isNaN(ts)) continue;
    const reward = Number(row.reward) || 0;
    if (ts >= today) todaySum += reward;
    else if (ts >= yesterday) yesterdaySum += reward;
    if (ts >= last7) last7Sum += reward;
    if (ts >= last30) last30Sum += reward;
  }

  return [
    { period: 'today', title: 'আজকের ইনকাম', amount: todaySum, subtitle: 'আজ অর্জিত' },
    { period: 'yesterday', title: 'গতকালের ইনকাম', amount: yesterdaySum, subtitle: 'গতকাল অর্জিত' },
    { period: 'last7', title: '৭ দিনের ইনকাম', amount: last7Sum, subtitle: 'গত ৭ দিন' },
    { period: 'last30', title: '৩০ দিনের ইনকাম', amount: last30Sum, subtitle: 'গত ৩০ দিন' },
    { period: 'total', title: 'মোট ইনকাম', amount: totalEarned, subtitle: 'লাইফটাইম' },
  ];
}

export function FinanceView({
  user,
  setView,
  financeStep,
  setFinanceStep,
  lastWithdrawal,
  lastDeposit,
  setLastDeposit,
  isSubmitting,
  handleSubmission,
  insertRow,
  onOpenSidebar,
  onSelectIncomePeriod,
}: Props) {
  const items = useMemo(
    () => aggregateIncome(user.taskHistory ?? [], user.totalEarned),
    [user.taskHistory, user.totalEarned],
  );

  // ----- Success states (preserved from the previous implementation) -----
  if (financeStep === 'success') {
    return (
      <SuccessView
        title="Withdrawal Success"
        subtitle="Your extraction has been logged"
        onClose={() => setFinanceStep('form')}
        colorClass="bg-indigo-600"
        details={[
          { label: 'Transaction ID', value: lastWithdrawal?.transactionId ?? '' },
          {
            label: 'Date & Time',
            value: `${lastWithdrawal?.date ?? ''} | ${lastWithdrawal?.time ?? ''}`,
          },
          { label: 'Method', value: lastWithdrawal?.method?.split(' (')[0] ?? '' },
          {
            label: 'Amount (TK)',
            value: `৳ ${lastWithdrawal?.amount?.toFixed(2) ?? '0.00'}`,
            color: 'text-indigo-600',
          },
        ]}
      />
    );
  }

  if (financeStep === 'deposit-success') {
    return (
      <SuccessView
        title="Deposit Submitted"
        subtitle="Your deposit is pending admin review"
        onClose={() => setFinanceStep('form')}
        colorClass="bg-emerald-500"
        details={[
          { label: 'Method', value: lastDeposit?.operator ?? '' },
          { label: 'Sender Number', value: lastDeposit?.phone ?? '' },
          {
            label: 'Date & Time',
            value: `${lastDeposit?.date ?? ''} | ${lastDeposit?.time ?? ''}`,
          },
          {
            label: 'Amount',
            value: `৳ ${lastDeposit?.amount?.toFixed(2) ?? '0.00'}`,
            color: 'text-emerald-600',
          },
          { label: 'Status', value: 'Pending Review', color: 'text-amber-600' },
        ]}
      />
    );
  }

  // ----- Deposit form (kept inline; smaller surface than withdraw) -----
  if (financeStep === 'deposit') {
    return (
      <DepositForm
        user={user}
        setFinanceStep={setFinanceStep}
        setLastDeposit={setLastDeposit}
        isSubmitting={isSubmitting}
        handleSubmission={handleSubmission}
        insertRow={insertRow}
        onOpenSidebar={onOpenSidebar}
      />
    );
  }

  // ----- Default Wallet dashboard -----
  return (
    <div className="min-h-screen pb-28">
      <TopHeader
        title="ওয়ালেট"
        onMenu={onOpenSidebar}
        onProfile={() => setView('profile')}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* 1. Balance hero — moved from HomeView */}
        <Card variant="gradient" glow padded className="p-6">
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-[0.25em] text-indigo-100/80">
              Current Balance
            </p>
            <p className="text-4xl font-bold tabular-nums mt-1">
              <span className="text-indigo-100/80 text-2xl mr-1 align-top">৳</span>
              {formatBdt(user.mainBalance)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2.5">
                <p className="text-[11px] tracking-wide text-indigo-100/70">মোট ইনকাম</p>
                <p className="text-base font-semibold tabular-nums mt-0.5">
                  ৳ {formatBdt(user.totalEarned)}
                </p>
              </div>
              <div className="rounded-xl bg-white/15 border border-white/20 px-3 py-2.5">
                <p className="text-[11px] tracking-wide text-indigo-100/70">পেন্ডিং</p>
                <p className="text-base font-semibold tabular-nums mt-0.5">
                  ৳ {formatBdt(user.pendingPayout)}
                </p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] text-indigo-100">
              <span>{new Date().toLocaleDateString()}</span>
              <span className="opacity-50">•</span>
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </Card>

        {/* 2. Quick action row */}
        <div className="grid grid-cols-3 gap-2">
          <QuickAction
            label="উইথড্র"
            icon={<ArrowDownToLine className="w-4 h-4" />}
            onClick={() => setView('withdraw')}
            tone="primary"
          />
          <QuickAction
            label="ব্যালেন্স হিস্ট্রি"
            icon={<HistoryIcon className="w-4 h-4" />}
            onClick={() => setView('balance-history')}
            tone="muted"
          />
          <QuickAction
            label="ডিপোজিট"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setFinanceStep('deposit')}
            tone="muted"
          />
        </div>

        {/* 3. Income breakdown */}
        <section>
          <div className="flex items-end justify-between mb-2">
            <h2 className="text-base font-semibold text-slate-900">ইনকাম ব্রেকডাউন</h2>
            <button
              type="button"
              onClick={() => setView('income-history')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              সম্পূর্ণ হিস্ট্রি
            </button>
          </div>
          <IncomeBreakdownList
            items={items}
            onSelect={(period, amount, title) => {
              if (onSelectIncomePeriod) {
                onSelectIncomePeriod(period, amount, title);
              } else {
                setView('income-detail');
              }
            }}
          />
        </section>
      </main>
    </div>
  );
}

interface QuickActionProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  tone: 'primary' | 'muted';
}

function QuickAction({ label, icon, onClick, tone }: QuickActionProps) {
  const isPrimary = tone === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isPrimary
          ? 'h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-fuchsia-500 text-white text-sm font-semibold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5'
          : 'h-12 rounded-2xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold shadow-sm hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5'
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

// =============================================================
// Deposit form — kept inline since deposit isn't extracted by the
// restructure plan. Same logic as before, just visually trimmed.
// =============================================================

interface DepositFormProps {
  user: Pick<UserProfile, 'id'>;
  setFinanceStep: (step: FinanceStep) => void;
  setLastDeposit: (record: DepositRecord | null) => void;
  isSubmitting: boolean;
  handleSubmission: (action: () => Promise<void>, successMsg?: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  onOpenSidebar?: () => void;
}

function DepositForm({
  user,
  setFinanceStep,
  setLastDeposit,
  isSubmitting,
  handleSubmission,
  insertRow,
  onOpenSidebar,
}: DepositFormProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');

  const handleDeposit = async () => {
    setError('');
    const val = parseFloat(amount);
    if (!val || val < 10) {
      setError('Minimum deposit is ৳ 10');
      return;
    }
    if (!accountNumber.trim()) {
      setError('Please enter your sender number');
      return;
    }
    const depositData: DepositRecord = {
      userId: user.id,
      phone: accountNumber,
      operator: method,
      amount: val,
      type: 'Prepaid',
      status: 'pending',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now(),
    };
    setLastDeposit(depositData);
    await handleSubmission(async () => {
      await insertRow('rechargeRequests', { ...depositData });
      setAmount('');
      setAccountNumber('');
      setFinanceStep('deposit-success');
    });
  };

  return (
    <div className="min-h-screen pb-28 bg-slate-50">
      <TopHeader
        title="ডিপোজিট"
        showBack
        onBack={() => setFinanceStep('form')}
        onMenu={onOpenSidebar}
      />
      <main className="max-w-md mx-auto px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest">
                Deposit Funds
              </h3>
              <p className="text-[11px] text-slate-500">Add money to your wallet</p>
            </div>
          </div>

          <label className="block text-[11px] font-semibold text-slate-600">
            অ্যামাউন্ট (৳)
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Min ৳ 10"
                className="w-full h-11 pl-7 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-base font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
          </label>

          <label className="block text-[11px] font-semibold text-slate-600">
            সেন্ডার নম্বর
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="bKash/Nagad number"
              className="mt-1 w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            {(['bKash', 'Nagad'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`h-12 rounded-xl border-2 text-sm font-semibold transition-all ${
                  method === m
                    ? m === 'bKash'
                      ? 'border-pink-500 bg-pink-50 text-pink-600'
                      : 'border-orange-500 bg-orange-50 text-orange-600'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 space-y-2 text-[11px] text-slate-700">
            <div className="flex items-center justify-between gap-2">
              <span>
                <span className="block text-[9px] uppercase tracking-widest text-slate-400">
                  Send Money to
                </span>
                <code className="text-sm font-bold text-emerald-700 tracking-wider">
                  01774397545
                </code>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('01774397545');
                  confetti({ particleCount: 24, spread: 50 });
                }}
                className="inline-flex items-center gap-1 px-3 h-8 rounded-lg bg-emerald-500 text-white text-[11px] font-bold"
              >
                <Copy className="w-3 h-3" /> COPY
              </button>
            </div>
            <p>• "Send Money" only — no Cash-in / Recharge.</p>
            <p>• Minimum deposit ৳ 10.</p>
            <p>• Balance is added within 30-60 minutes after verification.</p>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={handleDeposit}
            disabled={isSubmitting}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 transition-all"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Deposit'}
          </button>
        </div>
      </main>
    </div>
  );
}

// Re-export marker for type-safety analysis.
void WalletIcon;
