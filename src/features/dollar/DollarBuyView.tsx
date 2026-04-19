/**
 * Buy-dollar screen -- converts BDT balance to dollars via a configured
 * receive method (Binance / Trust Wallet / Pyypl).
 *
 * Phase 6 extraction from src/App.tsx. Writes to `dollarBuyRequests`
 * and debits mainBalance via the same legacy updateRow shape the
 * monolith used.
 */

import { useState } from 'react';
import { ArrowLeft, History } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import { generateTransactionId } from '../../utils/sanitize';
import type { DollarBuyRequest, UserProfile, View } from '../../types';

interface LastBuy {
  orderId: string;
  date: string;
  time: string;
  amount: number;
  price: number;
  method: string;
}

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance'>;
  setView: (view: View) => void;
  dollarBuyRate: number;
  dollarBuyRequests: DollarBuyRequest[];
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function DollarBuyView({
  user,
  setView,
  dollarBuyRate,
  dollarBuyRequests,
  handleSubmission,
  insertRow,
  updateRow,
}: Props) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Binance');
  const [wallet, setWallet] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState('');
  const [lastBuy, setLastBuy] = useState<LastBuy | null>(null);

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      setError('Valid amount required');
      return;
    }
    if (!wallet) {
      setError('Wallet address/ID required');
      return;
    }

    const totalPrice = val * dollarBuyRate;
    if (totalPrice > user.mainBalance) {
      setError('Insufficient balance in your account');
      return;
    }

    await handleSubmission(async () => {
      const buyData = {
        userId: user.id,
        amount: val,
        price: totalPrice,
        method,
        wallet,
        status: 'pending' as const,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        orderId: generateTransactionId('BUY'),
      };

      await insertRow('dollarBuyRequests', buyData);

      await updateRow('users', user.id, {
        mainBalance: -totalPrice,
      });

      setLastBuy(buyData);
      setStep('success');
    }, 'Dollar buy request submitted successfully!');
  };

  if (step === 'success' && lastBuy) {
    return (
      <SuccessView
        title="Purchase Success"
        subtitle="Dollar buy request logged"
        onClose={() => setView('otp-buy-sell')}
        colorClass="bg-indigo-600"
        details={[
          { label: 'Order ID', value: lastBuy.orderId },
          { label: 'Date & Time', value: `${lastBuy.date} | ${lastBuy.time}` },
          { label: 'Amount ($)', value: `$ ${lastBuy.amount.toFixed(2)}` },
          { label: 'Total Paid', value: `৳ ${lastBuy.price.toFixed(2)}`, color: 'text-indigo-600' },
          { label: 'Method', value: lastBuy.method },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('otp-buy-sell')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black text-slate-900">Buy Dollar</h2>
        </div>

        <div className="glass-card border-white/40 shadow-xl space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
            <p className="text-[10px] font-black text-indigo-600 uppercase">Current Rate</p>
            <p className="text-2xl font-black text-slate-900">$1 = ৳ {dollarBuyRate.toFixed(2)}</p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Dollar Amount ($)</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
            />
            <p className="text-[8px] font-bold text-slate-400 mt-1 ml-1">
              Total Cost: ৳ {(parseFloat(amount) * dollarBuyRate || 0).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Receive Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
            >
              <option value="Binance">Binance (Pay ID)</option>
              <option value="Trust Wallet">Trust Wallet (USDT BEP20)</option>
              <option value="Pyypl">Pyypl</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
              Your Wallet Address / Pay ID
            </label>
            <input
              type="text"
              placeholder="Where should we send?"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          {error && <p className="text-[10px] font-bold text-rose-500 text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
          >
            BUY DOLLARS NOW
          </button>

          <div className="mt-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Purchase Rules</h4>
            <ul className="space-y-2">
              <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                Cost is deducted from your main balance.
              </li>
              <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                Processing time: 1-12 hours.
              </li>
              <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                Ensure your wallet details are 100% correct.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            Buy History
          </h3>
          <div className="space-y-3">
            {dollarBuyRequests.filter((r) => r.userId === user.id).length === 0 ? (
              <div className="glass-card text-center py-10 border-white/40">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No buy history found</p>
              </div>
            ) : (
              dollarBuyRequests
                .filter((r) => r.userId === user.id)
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((r) => (
                  <div key={r.id} className="glass-card border-white/40 shadow-sm flex justify-between items-center p-4">
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        ${r.amount} via {r.method}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{r.date}</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-600'
                          : r.status === 'rejected'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      {r.status}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
