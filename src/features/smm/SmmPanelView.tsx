/**
 * SMM panel / growth-engine screen -- select a social growth service,
 * enter a target link and BDT investment, then place an order that the
 * admin will fulfil.
 *
 * Phase 7 extraction from src/App.tsx. Writes go through the legacy
 * updateRow / insertRow helpers so behavior matches the pre-split build
 * exactly.
 */

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, ChevronRight, Globe, History, Zap } from 'lucide-react';
import { SMM_SERVICES } from '../../constants';
import { handleFirestoreError } from '../../utils/db-errors';
import { OperationType, type SmmOrder, type UserProfile, type View } from '../../types';

interface Props {
  user: Pick<UserProfile, 'id' | 'name' | 'mainBalance'>;
  setView: (view: View) => void;
  isAdmin: boolean;
  enabledSmmServices: string[];
  smmOrders: SmmOrder[];
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function SmmPanelView({
  user,
  setView,
  isAdmin,
  enabledSmmServices,
  smmOrders,
  isSubmitting,
  setIsSubmitting,
  insertRow,
  updateRow,
}: Props) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [showHistory, setShowHistory] = useState(false);

  const services = SMM_SERVICES.filter((s) => isAdmin || enabledSmmServices.includes(s.id));
  const currentService = services.find((s) => s.id === selectedService);
  const calculatedQuantity = currentService
    ? Math.floor((amount / currentService.pricePer1k) * 1000)
    : 0;

  const handleOrder = async () => {
    if (!selectedService || !link || amount <= 0) {
      alert('Please fill all fields');
      return;
    }

    if (user.mainBalance < amount) {
      alert('Insufficient balance');
      return;
    }

    if (currentService && calculatedQuantity < currentService.min) {
      alert(`Minimum order is ${currentService.min} for this service`);
      return;
    }

    try {
      setIsSubmitting(true);
      const orderId = crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase();

      await updateRow('users', user.id, {
        mainBalance: -amount,
      });

      await insertRow('smmOrders', {
        id: orderId,
        userId: user.id,
        userName: user.name,
        service: currentService?.name || selectedService,
        link,
        amount,
        quantity: calculatedQuantity,
        status: 'pending',
        date: new Date().toLocaleString(),
        timestamp: Date.now(),
      });

      alert('Order submitted successfully!');
      setLink('');
      setAmount(0);
      setSelectedService(null);
      setIsSubmitting(false);
      confetti({ particleCount: 100, spread: 70 });
    } catch (e) {
      setIsSubmitting(false);
      handleFirestoreError(e, OperationType.CREATE, 'smmOrders');
    }
  };

  if (showHistory) {
    const myOrders = smmOrders.filter((o) => o.userId === user.id);
    return (
      <div className="min-h-screen pb-32 bg-[#F8FAFC]">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setShowHistory(false)}
              className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Order History
              </h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Track your growth
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {myOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No orders found
                </p>
              </div>
            ) : (
              myOrders.map((o) => (
                <div
                  key={o.id}
                  className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                          {o.service}
                        </p>
                        <span
                          className={`text-[7px] font-black px-2 py-0.5 rounded-md uppercase border ${
                            o.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : o.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {o.status}
                        </span>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                        {o.date}
                      </p>
                      <div className="mt-3 flex items-center gap-4">
                        <div>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                            Amount
                          </p>
                          <p className="text-xs font-black text-indigo-600 tracking-tight">
                            ৳ {o.amount}
                          </p>
                        </div>
                        <div className="w-px h-6 bg-slate-100" />
                        <div>
                          <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">
                            Quantity
                          </p>
                          <p className="text-xs font-black text-slate-900 tracking-tight">
                            {o.quantity}
                          </p>
                        </div>
                      </div>
                      <p className="text-[8px] text-slate-400 mt-3 font-medium truncate max-w-[200px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {o.link}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-[#F8FAFC]">
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('subscription-boosting')}
              className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                Growth Engine
              </h2>
              <p className="text-[8px] font-bold text-indigo-600 uppercase tracking-[0.2em]">
                Professional SMM Services
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm border border-slate-100"
          >
            <History className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {!selectedService ? (
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-500/20 mb-2">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-70 mb-1">
                  Service Catalog
                </p>
                <h3 className="text-xl font-black tracking-tight uppercase">Select Your Boost</h3>
              </div>
              {services.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedService(s.id)}
                  className="bg-white p-5 rounded-[32px] flex items-center gap-5 border border-slate-100 shadow-sm group hover:border-indigo-500 transition-all relative overflow-hidden"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}
                  >
                    {s.icon}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        {s.name}
                      </h3>
                      <span className="text-[6px] font-black px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md uppercase tracking-widest border border-indigo-100">
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ৳ {s.pricePer1k} <span className="opacity-50">/ 1k</span>
                    </p>
                  </div>
                  <div className="ml-auto w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div
                className={`p-8 bg-gradient-to-br ${currentService?.color} rounded-[40px] text-white shadow-2xl relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                    {currentService?.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">
                      ৳ {currentService?.pricePer1k} / 1k
                    </span>
                  </div>
                </div>
                <h3 className="text-3xl font-black mb-1 tracking-tighter uppercase">
                  {currentService?.name}
                </h3>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">
                    Instant Delivery Active
                  </p>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
                <div className="space-y-3">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                    Target Destination Link
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://facebook.com/post/..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    <Globe className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                    Investment Amount (৳)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={amount || ''}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xl font-black outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-300">
                      BDT
                    </span>
                  </div>
                </div>

                {amount > 0 && (
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
                    <p className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                      Estimated Growth Result
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-4xl font-black text-indigo-600 tracking-tighter">
                        {calculatedQuantity.toLocaleString()}
                      </p>
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mt-2">
                        {currentService?.name.split(' ').pop()}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
                          Non-Drop
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">
                          Fast Start
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setSelectedService(null)}
                    className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-all"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleOrder}
                    disabled={isSubmitting || amount <= 0}
                    className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'PROCESSING...' : `CONFIRM ORDER - ৳ ${amount}`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
