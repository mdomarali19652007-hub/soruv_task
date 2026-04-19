/**
 * "Spin & Win" screen.
 *
 * Phase 2 extraction out of src/App.tsx. Behaviour is intentionally
 * unchanged: the result is generated client-side (a known issue --
 * the real `processSpin` RPC in lib/database is not yet wired up).
 * That bug is out of scope for this mechanical split.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, TrendingUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
  /** Displayed spin cost; kept as a number so formatting matches the rest of the app. */
  spinCost: number;
}

const SPIN_REWARDS = ['৳ 0.50', '৳ 1.00', '৳ 2.00', 'Try Again', '৳ 5.00'];

export function SpinView({ setView, spinCost }: Props) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setResult(null);
    setTimeout(() => {
      const win = SPIN_REWARDS[Math.floor(Math.random() * SPIN_REWARDS.length)];
      setResult(win);
      setIsSpinning(false);
      if (win !== 'Try Again') {
        confetti({ particleCount: 50, spread: 60 });
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('home')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Spin & Win">
            Spin & Win
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <motion.div
            animate={isSpinning ? { rotate: 360 * 5 } : {}}
            transition={isSpinning ? { duration: 2, ease: 'easeInOut' } : {}}
            className="w-64 h-64 rounded-full border-8 border-amber-500/10 flex items-center justify-center relative mb-12 shadow-2xl bg-white"
          >
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-amber-500/20 animate-spin-slow" />
            <TrendingUp className="w-20 h-20 text-amber-500" />
          </motion.div>

          {result && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mb-8 text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">You Won</p>
              <h3 className="text-4xl font-black text-amber-600 neon-text">{result}</h3>
            </motion.div>
          )}

          <button
            onClick={spin}
            disabled={isSpinning}
            className="px-12 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSpinning ? 'SPINNING...' : `SPIN NOW (৳ ${spinCost.toFixed(2)})`}
          </button>

          <div className="mt-12 w-full max-w-xs">
            <div className="glass-card border-amber-500/20 bg-amber-50/30 p-4">
              <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Spinning Rules
              </h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                  Each spin costs ৳ {spinCost.toFixed(2)} from your main balance.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                  Rewards are added instantly to your wallet.
                </li>
                <li className="text-[9px] text-slate-500 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-amber-400 rounded-full mt-1 shrink-0" />
                  Fair play system: Results are randomly generated.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
