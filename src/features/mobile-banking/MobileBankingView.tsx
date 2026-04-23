/**
 * Mobile banking hub -- landing tiles for Mobile Recharge and Drive
 * Offer flows. Phase 9 extraction from src/App.tsx.
 */

import { motion } from 'motion/react';
import { ArrowLeft, Smartphone, Zap } from 'lucide-react';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
  enabledFeatures: string[];
  isAdmin: boolean;
}

const ITEMS = [
  {
    id: 'mobile-recharge',
    title: 'Mobile Recharge',
    desc: 'Recharge any mobile number instantly.',
    icon: <Smartphone className="w-8 h-8" />,
    color: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'drive-offer',
    title: 'Drive Offer',
    desc: 'Exclusive internet and talk-time offers.',
    icon: <Zap className="w-8 h-8" />,
    color: 'from-amber-500 to-orange-600',
  },
];

export function MobileBankingView({ setView, enabledFeatures, isAdmin }: Props) {
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
            data-text="Mobile Banking"
          >
            Mobile Banking
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {ITEMS.map((item, i) => {
            const locked = !enabledFeatures.includes(item.id) && !isAdmin;
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.98 }}
                onClick={() => setView(item.id as View)}
                className={`glass-card text-left relative overflow-hidden group border-white/40 shadow-lg p-6 ${
                  locked ? 'opacity-50 grayscale cursor-not-allowed' : ''
                }`}
                disabled={locked}
              >
                <div
                  className={`absolute top-0 right-0 w-32 h-full bg-gradient-to-l ${item.color} opacity-5 group-hover:opacity-10 transition-all`}
                />
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[80%]">
                      {item.desc}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg text-white`}
                  >
                    {item.icon}
                  </div>
                </div>
                {locked && (
                  <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
                    <span className="bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase">
                      Locked by Admin
                    </span>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
