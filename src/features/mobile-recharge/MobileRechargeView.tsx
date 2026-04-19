/**
 * Mobile recharge submission screen.
 *
 * Phase 3 extraction from src/App.tsx. Preserves the original three
 * sub-states (form / success / history) and verbatim side effects,
 * including the quirky "deduct balance" call that writes a negative
 * delta into mainBalance via updateRow (tracked as a pre-existing
 * issue in the audit plan).
 */

import { useState } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import { generateTransactionId } from '../../utils/sanitize';
import type { RechargeRequest, UserProfile, View } from '../../types';

interface LastRecharge {
  transactionId: string;
  date: string;
  time: string;
  phone: string;
  operator: string;
  amount: number;
  type: 'Prepaid' | 'Postpaid';
  timestamp: number;
  userId: string;
  status: 'pending';
}

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance'>;
  setView: (view: View) => void;
  rechargeRequests: RechargeRequest[];
  rechargeCommissionRate: number;
  /** Inline submission wrapper from the shell (loader + toast). */
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

const OPERATORS = ['GP', 'Robi', 'Banglalink', 'Teletalk', 'Airtel'] as const;

export function MobileRechargeView({
  user,
  setView,
  rechargeRequests,
  rechargeCommissionRate,
  handleSubmission,
  insertRow,
  updateRow,
}: Props) {
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState<string>('GP');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Prepaid' | 'Postpaid'>('Prepaid');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRecharge, setLastRecharge] = useState<LastRecharge | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!phone || !amount) {
      setError('Please fill all fields');
      return;
    }
    const amt = parseFloat(amount);
    if (amt < 20) {
      setError('Minimum recharge is ৳ 20');
      return;
    }
    if (user.mainBalance < amt) {
      setError('Insufficient balance');
      return;
    }

    await handleSubmission(async () => {
      const rechargeData: LastRecharge = {
        userId: user.id,
        phone,
        operator,
        amount: amt,
        type,
        status: 'pending',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        transactionId: generateTransactionId('REC'),
      };
      await insertRow('rechargeRequests', rechargeData as unknown as Record<string, unknown>);

      // Deduct balance -- preserves the original write shape.
      await updateRow('users', user.id, {
        mainBalance: -amt,
      });

      setLastRecharge(rechargeData);
      setStep('success');
    }, 'Mobile recharge request submitted successfully!');
  };

  if (showHistory) {
    const myRequests = rechargeRequests.filter((r) => r.userId === user.id);
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Recharge History</h2>
          </div>
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No recharge logs</p>
              </div>
            ) : (
              myRequests.map((r) => (
                <div key={r.id} className="glass-card border-white/40 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                        {r.operator} • {r.type}
                      </p>
                      <p className="text-lg font-black text-slate-900 mt-1">৳ {r.amount.toFixed(2)}</p>
                      <p className="text-[10px] font-bold text-slate-500">{r.phone}</p>
                    </div>
                    <span
                      className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : r.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">{r.date}</p>
                    {r.reason && <p className="text-[8px] font-bold text-rose-500 uppercase">Note: {r.reason}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success' && lastRecharge) {
    return (
      <SuccessView
        title="Recharge Requested"
        subtitle="Mobile recharge logged"
        onClose={() => setStep('form')}
        colorClass="bg-indigo-600"
        details={[
          { label: 'Transaction ID', value: lastRecharge.transactionId },
          { label: 'Date & Time', value: `${lastRecharge.date} | ${lastRecharge.time}` },
          { label: 'Phone', value: lastRecharge.phone },
          { label: 'Amount', value: `৳ ${lastRecharge.amount.toFixed(2)}`, color: 'text-indigo-600' },
          { label: 'Operator', value: lastRecharge.operator },
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
              onClick={() => setView('mobile-banking')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Mobile Recharge">
              Mobile Recharge
            </h2>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
            <History className="w-6 h-6" />
          </button>
        </div>

        <div className="glass-card border-white/40 shadow-xl space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Mobile Number</label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Operator</label>
              <div className="grid grid-cols-3 gap-2">
                {OPERATORS.map((op) => (
                  <button
                    key={op}
                    onClick={() => setOperator(op)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      operator === op
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg scale-105'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-500'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Amount (৳)</label>
              {error && <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>}
              <input
                type="number"
                placeholder="Min ৳ 20"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-[10px] font-black text-emerald-600 mt-2 ml-1 uppercase">
                  Commission: ৳ {((parseFloat(amount) / 1000) * rechargeCommissionRate).toFixed(2)}
                </p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['Prepaid', 'Postpaid'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                      type === t ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
          >
            RECHARGE NOW
          </button>

          <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Recharge Rules</h4>
            <ul className="space-y-2">
              <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                Minimum recharge amount is ৳ 20.
              </li>
              <li className="text-[9px] text-indigo-600 font-black flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1 shrink-0" />
                প্রতি ১০০০ টাকা রিচার্জে ৳ {rechargeCommissionRate} কমিশন পাবেন।
              </li>
              <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                Processing time: 10 minutes to 2 hours.
              </li>
              <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                Ensure the mobile number is correct before submitting.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
