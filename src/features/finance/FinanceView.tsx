/**
 * Finance / "The Vault" screen -- balance display + deposit and
 * withdrawal forms + transaction history.
 *
 * Phase 8 extraction from src/App.tsx. Behavior is preserved exactly:
 * - Inactive accounts are redirected to activation before withdrawing.
 * - Withdrawal goes through the server-side RPC `submitWithdrawal` for
 *   atomicity; deposit creates a `rechargeRequests` row for admin review.
 * - Success and deposit-success states use the shared SuccessView.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Copy, CreditCard, History, PlusCircle, ShieldCheck } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import { isValidMobileWallet, sanitizeAccountNumber } from '../../utils/sanitize';
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
  user: Pick<UserProfile, 'id' | 'isActive' | 'mainBalance' | 'pendingPayout' | 'totalEarned'>;
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
}

export function FinanceView({
  user,
  setView,
  financeStep,
  setFinanceStep,
  minWithdrawal,
  withdrawalFee,
  withdrawals,
  lastWithdrawal,
  setLastWithdrawal,
  lastDeposit,
  setLastDeposit,
  isSubmitting,
  handleSubmission,
  submitWithdrawal,
  insertRow,
}: Props) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bKash' | 'Nagad' | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  const handleWithdraw = async () => {
    if (!user.isActive) {
      alert('Your account is not active. Please activate your account to withdraw funds.');
      setView('account-activation');
      return;
    }
    setError('');
    const val = parseFloat(amount);
    const fee = (val * withdrawalFee) / 100;

    if (!val || val < minWithdrawal) {
      setError(`Minimum withdrawal is ৳ ${minWithdrawal}`);
      return;
    }
    if (val > user.mainBalance) {
      setError('Insufficient balance');
      return;
    }
    if (!method) {
      setError('Please select a withdrawal method');
      return;
    }
    const sanitizedAccount = sanitizeAccountNumber(accountNumber);
    if (!sanitizedAccount) {
      setError('Please enter your account number');
      return;
    }
    if (!isValidMobileWallet(sanitizedAccount)) {
      setError('Please enter a valid 11-digit Bangladeshi mobile number');
      return;
    }

    await handleSubmission(async () => {
      await submitWithdrawal(user.id, val, method, sanitizedAccount);

      setLastWithdrawal({
        userId: user.id,
        amount: val,
        receiveAmount: val - fee,
        fee,
        method: `${method} (${sanitizedAccount})`,
        status: 'pending',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      });
      setAmount('');
      setMethod(null);
      setAccountNumber('');
      setFinanceStep('success');
    });
  };

  const handleDeposit = async () => {
    setError('');
    const val = parseFloat(amount);
    if (!val || val < 10) {
      setError('Minimum deposit is ৳ 10');
      return;
    }
    if (!method) {
      setError('Please select a deposit method');
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
      setMethod(null);
      setAccountNumber('');
      setFinanceStep('deposit-success');
    });
  };

  if (showHistory) {
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(false)}
                className="p-3 glass rounded-2xl text-slate-700"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h2 className="text-2xl font-black text-slate-900">Vault History</h2>
            </div>
          </div>

          <div className="space-y-4">
            {withdrawals.filter((w) => w.userId === user.id).length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                  No transaction logs
                </p>
              </div>
            ) : (
              withdrawals
                .filter((w) => w.userId === user.id)
                .map((w) => (
                  <div key={w.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          {w.method}
                        </p>
                        <p className="text-lg font-black text-slate-900 mt-1">
                          ৳ {w.amount.toFixed(2)}
                        </p>
                        {w.fee !== undefined && (
                          <p className="text-[8px] font-bold text-slate-400 uppercase">
                            Fee: ৳ {w.fee.toFixed(2)} | Receive: ৳ {w.receiveAmount?.toFixed(2)}
                          </p>
                        )}
                      </div>
                      <span
                        className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                          w.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                            : w.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">{w.date}</p>
                      {w.reason && (
                        <p className="text-[8px] font-bold text-rose-500 uppercase">
                          Note: {w.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('home')}
              className="p-3 glass rounded-2xl text-slate-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2
              className="text-2xl font-black neon-text text-slate-900 glitch-text"
              data-text="The Vault"
            >
              The Vault
            </h2>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="p-3 glass rounded-2xl text-indigo-600"
          >
            <History className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Balance Display */}
          <div className="glass-card bg-gradient-to-br from-indigo-600 to-violet-700 border-none text-center py-12 shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 blur-3xl rounded-full" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.3em] mb-3 opacity-80">
                Available for Extraction
              </p>
              <h3 className="text-5xl font-black text-white mb-6 drop-shadow-lg">
                ৳ {user.mainBalance.toFixed(2)}
              </h3>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setFinanceStep('deposit')}
                  className="flex-1 bg-white text-indigo-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  Deposit
                </button>
                <button
                  onClick={() => setFinanceStep('form')}
                  className="flex-1 bg-white/20 backdrop-blur-md text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/30 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  Withdraw
                </button>
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <p className="text-[8px] font-black text-indigo-100 uppercase mb-1">Pending</p>
                  <p className="text-sm font-black text-white">
                    ৳ {user.pendingPayout.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                  <p className="text-[8px] font-black text-indigo-100 uppercase mb-1">
                    Total Earned
                  </p>
                  <p className="text-sm font-black text-white">
                    ৳ {user.totalEarned.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Forms */}
          {financeStep === 'deposit' ? (
            <div className="glass-card border-white/40 shadow-lg p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Deposit Funds
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">Add money to your wallet</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
                    Amount (৳)
                  </label>
                  {error && (
                    <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>
                  )}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Min ৳ 10"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 pl-8 text-lg text-slate-900 font-black outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
                    Sender Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Your bKash/Nagad number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-900 font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMethod('bKash')}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'bKash' ? 'border-pink-500 bg-pink-500/5' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'bKash' ? 'bg-pink-500 scale-110 shadow-lg shadow-pink-500/20' : 'bg-slate-200'}`}
                    >
                      bKash
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${method === 'bKash' ? 'text-pink-600' : 'text-slate-500'}`}
                    >
                      bKash
                    </span>
                  </button>
                  <button
                    onClick={() => setMethod('Nagad')}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'Nagad' ? 'border-orange-500 bg-orange-500/5' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'Nagad' ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/20' : 'bg-slate-200'}`}
                    >
                      Nagad
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${method === 'Nagad' ? 'text-orange-600' : 'text-slate-500'}`}
                    >
                      Nagad
                    </span>
                  </button>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">
                    Deposit Rules & Instructions:
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-emerald-200">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          Official Number (Personal)
                        </span>
                        <code className="text-sm font-black text-emerald-600 tracking-widest">
                          01774397545
                        </code>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('01774397545');
                          confetti({ particleCount: 30, spread: 50 });
                          alert('Number copied! Use "Send Money" only.');
                        }}
                        className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase active:scale-95 transition-all shadow-md flex items-center gap-2"
                      >
                        <Copy className="w-3 h-3" />
                        COPY
                      </button>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-[9px] text-slate-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>
                          Only <span className="font-black text-rose-500">&quot;Send Money&quot;</span> is
                          allowed. No Cash-in or Recharge.
                        </span>
                      </li>
                      <li className="text-[9px] text-slate-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>
                          Minimum deposit amount is <span className="font-black">৳ 10</span>.
                        </span>
                      </li>
                      <li className="text-[9px] text-slate-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>
                          Balance will be added to your account within{' '}
                          <span className="font-black">30-60 minutes</span> after verification.
                        </span>
                      </li>
                      <li className="text-[9px] text-slate-600 flex items-start gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>Enter your sender number and amount accurately to avoid delays.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={isSubmitting}
                  className={`w-full py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all ${isSubmitting ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white active:scale-95'}`}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card border-white/40 shadow-lg p-8">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[8px] font-black text-indigo-400 uppercase mb-1">Min Limit</p>
                  <p className="text-sm font-black text-indigo-700">৳ {minWithdrawal}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[8px] font-black text-rose-400 uppercase mb-1">Service Fee</p>
                  <p className="text-sm font-black text-rose-700">{withdrawalFee}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    Initiate Extraction
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Secure payout to your mobile wallet
                  </p>
                </div>
              </div>

              <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <p className="text-[10px] font-black text-indigo-600 uppercase mb-3">
                  Withdrawal Rules:
                </p>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>
                      Minimum withdrawal amount is{' '}
                      <span className="font-black">৳ {minWithdrawal}</span>.
                    </span>
                  </li>
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>
                      A service fee of{' '}
                      <span className="font-black text-rose-500">{withdrawalFee}%</span> applies to
                      every transaction (৳ 200 per ৳ 1000).
                    </span>
                  </li>
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>
                      Payments are processed within <span className="font-black">24 hours</span> of
                      request.
                    </span>
                  </li>
                  <li className="text-[9px] text-slate-600 flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <span>
                      Ensure your bKash/Nagad number is correct. We are not responsible for wrong
                      numbers.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
                    Amount (৳)
                  </label>
                  {error && (
                    <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>
                  )}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">
                      ৳
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Min ৳ ${minWithdrawal}`}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 pl-8 text-lg text-slate-900 font-black outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  {parseFloat(amount) >= minWithdrawal && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p className="text-[8px] font-black text-indigo-400 uppercase">
                          Withdrawal Fee ({withdrawalFee}%)
                        </p>
                        <p className="text-xs font-black text-indigo-600">
                          - ৳ {((parseFloat(amount) * withdrawalFee) / 100).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-400 uppercase">
                          You will receive
                        </p>
                        <p className="text-sm font-black text-emerald-600">
                          ৳{' '}
                          {(
                            parseFloat(amount) -
                            (parseFloat(amount) * withdrawalFee) / 100
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter bKash/Nagad number"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm text-slate-900 font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setMethod('bKash')}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'bKash' ? 'border-pink-500 bg-pink-500/5' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'bKash' ? 'bg-pink-500 scale-110 shadow-lg shadow-pink-500/20' : 'bg-slate-200'}`}
                    >
                      bKash
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${method === 'bKash' ? 'text-pink-600' : 'text-slate-500'}`}
                    >
                      bKash Wallet
                    </span>
                    {method === 'bKash' && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setMethod('Nagad')}
                    className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden ${method === 'Nagad' ? 'border-orange-500 bg-orange-500/5' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black italic text-lg transition-all ${method === 'Nagad' ? 'bg-orange-500 scale-110 shadow-lg shadow-orange-500/20' : 'bg-slate-200'}`}
                    >
                      Nagad
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${method === 'Nagad' ? 'text-orange-600' : 'text-slate-500'}`}
                    >
                      Nagad Wallet
                    </span>
                    {method === 'Nagad' && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                  </button>
                </div>

                {amount && parseFloat(amount) >= minWithdrawal && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                  >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Withdrawal Amount</span>
                      <span className="text-slate-900">৳ {parseFloat(amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-rose-500">
                      <span>Service Fee ({withdrawalFee}%)</span>
                      <span>
                        - ৳ {((parseFloat(amount) * withdrawalFee) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        You will receive
                      </span>
                      <span className="text-lg font-black text-emerald-600">
                        ৳{' '}
                        {(
                          parseFloat(amount) -
                          (parseFloat(amount) * withdrawalFee) / 100
                        ).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handleWithdraw}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-700 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all neon-border"
                >
                  Confirm Extraction
                </button>
              </div>
            </div>
          )}

          {/* Withdrawal Rules */}
          <div className="glass-card bg-slate-50 border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h4 className="font-black text-sm text-slate-800 uppercase tracking-widest">
                Withdrawal Rules
              </h4>
            </div>
            <ul className="space-y-3">
              {[
                `Minimum withdrawal amount is ৳ ${minWithdrawal}.`,
                'Payments are processed within 1-24 hours.',
                'Ensure your account number is correct before submitting.',
                `Withdrawal fee: ${withdrawalFee}% (৳ 200 per ৳ 1000).`,
              ].map((rule, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <p className="text-[11px] font-medium text-slate-600 leading-tight">{rule}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
