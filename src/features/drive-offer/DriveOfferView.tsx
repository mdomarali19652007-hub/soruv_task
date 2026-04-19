/**
 * Drive offer purchase screen (list / submit / success / history).
 *
 * Phase 3 extraction from src/App.tsx. Behaviour is preserved verbatim,
 * including the pre-existing mainBalance write quirk (passing a negative
 * delta through updateRow rather than using a proper decrement).
 */

import { useState } from 'react';
import { ArrowLeft, History, Zap } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import { generateTransactionId } from '../../utils/sanitize';
import type { DriveOffer, DriveOfferRequest, UserProfile, View } from '../../types';

interface LastOffer {
  transactionId: string;
  date: string;
  time: string;
  phone: string;
  amount: number;
  timestamp: number;
  userId: string;
  driveOfferId: string;
  status: 'pending';
}

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance'>;
  setView: (view: View) => void;
  driveOffers: DriveOffer[];
  driveOfferRequests: DriveOfferRequest[];
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function DriveOfferView({
  user,
  setView,
  driveOffers,
  driveOfferRequests,
  handleSubmission,
  insertRow,
  updateRow,
}: Props) {
  const [phone, setPhone] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<DriveOffer | null>(null);
  const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOffer, setLastOffer] = useState<LastOffer | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!phone || !selectedOffer) {
      setError('Please fill all fields');
      return;
    }
    if (user.mainBalance < selectedOffer.price) {
      setError('Insufficient balance');
      return;
    }

    await handleSubmission(async () => {
      const offerData: LastOffer = {
        userId: user.id,
        driveOfferId: selectedOffer.id,
        phone,
        amount: selectedOffer.price,
        status: 'pending',
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        transactionId: generateTransactionId('DRV'),
      };
      await insertRow('driveOfferRequests', offerData as unknown as Record<string, unknown>);

      await updateRow('users', user.id, {
        mainBalance: -selectedOffer.price,
      });

      setLastOffer(offerData);
      setStep('success');
    }, 'Drive offer request submitted successfully!');
  };

  if (showHistory) {
    const myRequests = driveOfferRequests.filter((r) => r.userId === user.id);
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Drive History</h2>
          </div>
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No drive logs</p>
              </div>
            ) : (
              myRequests.map((r) => {
                const offer = driveOffers.find((o) => o.id === r.driveOfferId);
                return (
                  <div key={r.id} className="glass-card border-white/40 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                          {offer?.title || 'Drive Offer'}
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
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success' && lastOffer) {
    return (
      <SuccessView
        title="Offer Requested"
        subtitle="Drive offer logged"
        onClose={() => setStep('list')}
        colorClass="bg-amber-600"
        details={[
          { label: 'Transaction ID', value: lastOffer.transactionId },
          { label: 'Date & Time', value: `${lastOffer.date} | ${lastOffer.time}` },
          { label: 'Phone', value: lastOffer.phone },
          { label: 'Amount', value: `৳ ${lastOffer.amount.toFixed(2)}`, color: 'text-amber-600' },
          { label: 'Operator', value: selectedOffer?.operator || '' },
        ]}
      />
    );
  }

  if (step === 'submit') {
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Confirm Purchase</h2>
          </div>
          <div className="glass-card border-white/40 shadow-xl space-y-6">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <h4 className="text-sm font-black text-indigo-600 uppercase">{selectedOffer?.title}</h4>
              <p className="text-[10px] text-indigo-500 font-bold">{selectedOffer?.description}</p>
              <p className="text-lg font-black text-slate-900 mt-2">৳ {selectedOffer?.price.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Mobile Number</label>
              {error && <p className="text-[10px] font-bold text-rose-500 mb-2 ml-1">{error}</p>}
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all mt-4"
            >
              BUY NOW
            </button>

            <div className="mt-6 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3">Drive Offer Rules</h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                  ড্রাইভ অফার সচল হতে ১০ মিনিট থেকে ২ ঘণ্টা সময় লাগতে পারে।
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                  ভুল নাম্বারে অফার কিনলে কর্তৃপক্ষ দায়ী থাকবে না।
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                  অফার সফল হওয়ার পর কোনো রিফান্ড হবে না।
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
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
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Drive Offer">
              Drive Offer
            </h2>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
            <History className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {driveOffers.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <Zap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No drive offers available</p>
            </div>
          ) : (
            driveOffers.map((offer) => (
              <div key={offer.id} className="glass-card border-white/40 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{offer.title}</h4>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{offer.operator}</p>
                  </div>
                  <p className="text-lg font-black text-emerald-600">৳ {offer.price}</p>
                </div>
                <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">{offer.description}</p>
                <button
                  onClick={() => {
                    setSelectedOffer(offer);
                    setStep('submit');
                  }}
                  className="w-full py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Buy Offer
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
