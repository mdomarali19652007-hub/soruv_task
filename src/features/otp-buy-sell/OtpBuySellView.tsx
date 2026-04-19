/**
 * OTP Buy/Sell landing screen -- lists the buy/sell sub-flows
 * (Dollar buy, Dollar sell, upcoming WhatsApp/Telegram/KYC).
 *
 * Phase 8 extraction from src/App.tsx. Pure presentational; the only
 * interaction is routing via `setView`.
 */

import type { ReactNode } from 'react';
import { ArrowLeft, ChevronRight, DollarSign, MessageCircle, Send, ShieldCheck } from 'lucide-react';
import type { View } from '../../types';

interface MenuItem {
  title: string;
  color: string;
  icon: ReactNode;
  view?: View;
}

interface Props {
  setView: (view: View) => void;
}

export function OtpBuySellView({ setView }: Props) {
  const items: MenuItem[] = [
    {
      title: 'DOLLAR BUY',
      color: 'from-indigo-500 to-violet-600',
      icon: <DollarSign className="w-6 h-6" />,
      view: 'dollar-buy',
    },
    {
      title: 'DOLLAR SELL',
      color: 'from-emerald-500 to-teal-600',
      icon: <DollarSign className="w-6 h-6" />,
      view: 'dollar-sell',
    },
    {
      title: 'WHATSAPP SELL',
      color: 'from-emerald-500 to-green-600',
      icon: <MessageCircle className="w-6 h-6" />,
    },
    {
      title: 'TELEGRAM SELL',
      color: 'from-sky-500 to-blue-600',
      icon: <Send className="w-6 h-6" />,
    },
    {
      title: 'KYC BY SELL',
      color: 'from-purple-500 to-indigo-600',
      icon: <ShieldCheck className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('home')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2
            className="text-2xl font-black neon-text text-slate-900 glitch-text"
            data-text="BUY SELL"
          >
            BUY SELL
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {items.map((item, i) => (
            <div
              key={i}
              onClick={() => item.view && setView(item.view)}
              className={`glass-card p-6 flex items-center justify-between border-white/40 shadow-lg group relative overflow-hidden ${item.view ? 'cursor-pointer active:scale-95' : ''} transition-all`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-all`}
              />
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}
                >
                  {item.icon}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  {item.title}
                </h3>
              </div>
              {item.view ? (
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-all" />
              ) : (
                <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter relative z-10">
                  Upcoming
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
