/**
 * Sell-dollar screen -- converts dollars back to BDT balance via the
 * configured payout method (Binance Pay ID / USDT BEP20).
 *
 * Phase 7 extraction from src/App.tsx. Companion to DollarBuyView.
 * Writes to `withdrawals` (with a "Dollar Sell (...)" method prefix so
 * the withdrawal tab can filter them) and atomically debits mainBalance
 * / credits pendingPayout.
 */

import { useState } from 'react';
import { ArrowLeft, Copy, History } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import { sanitizeAccountNumber, generateTransactionId } from '../../utils/sanitize';
import type { UserProfile, View } from '../../types';

interface SellRecord {
  transactionId: string;
  date: string;
  time: string;
  amount: number;
  method: string;
}

type SellPaymentMethod = 'Binance' | 'USDT (BEP20)';

interface WithdrawalRow {
  id: string;
  userId?: string;
  amount: number;
  method: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  timestamp: number;
}

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance'>;
  setView: (view: View) => void;
  dollarSellRate: number;
  withdrawals: WithdrawalRow[];
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  incrementFields: (
    table: string,
    id: string,
    increments: Record<string, number>,
  ) => Promise<unknown>;
}

const ADMIN_RECEIVE_DETAILS: Record<SellPaymentMethod, string> = {
  Binance: '737474885',
  'USDT (BEP20)': 'OXGGCCGCCGG',
};

export function DollarSellView({
  user,
  setView,
  dollarSellRate,
  withdrawals,
  handleSubmission,
  insertRow,
  incrementFields,
}: Props) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<SellPaymentMethod>('Binance');
  const [wallet, setWallet] = useState('');
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [lastSell, setLastSell] = useState<SellRecord | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Valid amount required');
      return;
    }
    if (!wallet) {
      setError('Wallet address/ID required');
      return;
    }
    const totalTk = parseFloat(amount) * dollarSellRate;
    if (totalTk > user.mainBalance) {
      setError('Insufficient balance for this dollar sell amount');
      return;
    }

    await handleSubmission(async () => {
      const sellData = {
        userId: user.id,
        amount: totalTk,
        method: `Dollar Sell (${method}) - ${sanitizeAccountNumber(wallet, 60)}`,
        status: 'pending' as const,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        transactionId: generateTransactionId('SEL'),
      };

      await insertRow('withdrawals', sellData);
      await incrementFields('users', user.id, {
        mainBalance: -totalTk,
        pendingPayout: totalTk,
      });
      setLastSell({
        transactionId: sellData.transactionId,
        date: sellData.date,
        time: sellData.time,
        amount: sellData.amount,
        method,
      });
      setStep('success');
    }, 'Dollar sell request submitted successfully!');
  };

  if (step === 'success' && lastSell) {
    return (
      <SuccessView
        title="Submission Received"
        subtitle="Dollar sell request logged"
        onClose={() => setView('otp-buy-sell')}
        colorClass="bg-emerald-600"
        details={[
          { label: 'Transaction ID', value: lastSell.transactionId },
          { label: 'Date & Time', value: `${lastSell.date} | ${lastSell.time}` },
          { label: 'Amount ($)', value: `$ ${parseFloat(amount).toFixed(2)}` },
          { label: 'Estimated TK', value: `৳ ${lastSell.amount.toFixed(2)}`, color: 'text-emerald-600' },
          { label: 'Method', value: lastSell.method },
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
          <h2 className="text-2xl font-black text-slate-900">Sell Dollar</h2>
        </div>

        <div className="glass-card border-white/40 shadow-xl space-y-6">
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
            <p className="text-[10px] font-black text-emerald-600 uppercase">Current Rate</p>
            <p className="text-2xl font-black text-slate-900">
              $1 = ৳ {dollarSellRate.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
              Dollar Amount ($)
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-emerald-500 shadow-inner"
            />
            <p className="text-[8px] font-bold text-slate-400 mt-1 ml-1">
              You will receive: ৳ {(parseFloat(amount) * dollarSellRate || 0).toFixed(2)}
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as SellPaymentMethod)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-emerald-500 shadow-inner"
            >
              <option value="Binance">Binance (Pay ID)</option>
              <option value="USDT (BEP20)">USDT (BEP20)</option>
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-500 uppercase">
                Admin {method === 'Binance' ? 'Pay ID' : 'Address'}
              </p>
              {copied && (
                <span className="text-[8px] font-black text-emerald-500 uppercase animate-pulse">
                  Copied!
                </span>
              )}
            </div>
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
              <code className="text-xs font-black text-slate-900 break-all">
                {ADMIN_RECEIVE_DETAILS[method]}
              </code>
              <button
                onClick={() => handleCopy(ADMIN_RECEIVE_DETAILS[method])}
                className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[8px] font-bold text-slate-400 italic">
              Send your dollars to this {method === 'Binance' ? 'ID' : 'Address'} first, then
              submit your details below.
            </p>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">
              Your Wallet Address / Pay ID
            </label>
            <input
              type="text"
              placeholder="Enter your sender details"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-emerald-500 shadow-inner"
            />
          </div>

          {error && <p className="text-[10px] font-bold text-rose-500 text-center">{error}</p>}

          <button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
          >
            SUBMIT SELL REQUEST
          </button>

          <div className="mt-6 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">
              Exchange Rules
            </h4>
            <ul className="space-y-2">
              <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1 shrink-0" />
                Rate is fixed at ৳ {dollarSellRate.toFixed(2)} per Dollar.
              </li>
              <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1 shrink-0" />
                Processing time: 1-6 hours.
              </li>
              <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1 shrink-0" />
                Double check your Pay ID/Wallet address.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-500" />
            Sell History
          </h3>
          <div className="space-y-3">
            {withdrawals.filter((w) => w.userId === user.id && w.method.startsWith('Dollar Sell'))
              .length === 0 ? (
              <div className="glass-card text-center py-10 border-white/40">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No sell history found
                </p>
              </div>
            ) : (
              withdrawals
                .filter((w) => w.userId === user.id && w.method.startsWith('Dollar Sell'))
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((w) => (
                  <div
                    key={w.id}
                    className="glass-card border-white/40 shadow-sm flex justify-between items-center p-4"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        {w.method.split(' - ')[0]}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{w.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-600">৳ {w.amount}</p>
                      <div
                        className={`mt-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest inline-block ${
                          w.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : w.status === 'rejected'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {w.status}
                      </div>
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
