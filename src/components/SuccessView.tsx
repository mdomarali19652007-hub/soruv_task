/**
 * Generic "action submitted successfully" confirmation screen.
 *
 * Extracted unchanged from src/App.tsx. This component was already
 * prop-clean in the original monolith, so the move is literally a
 * relocation -- no behaviour change.
 */

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface SuccessViewDetail {
  label: string;
  value: string;
  color?: string;
}

interface Props {
  title: string;
  subtitle: string;
  details: SuccessViewDetail[];
  onClose: () => void;
  colorClass?: string;
}

/**
 * Fires a short, two-burst confetti celebration when the success view
 * mounts. Respects `prefers-reduced-motion` — users who opt out of
 * animations get the success card without the particles.
 */
function useCelebrate() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
    confetti({
      particleCount: 80,
      spread: 70,
      startVelocity: 35,
      origin: { y: 0.45 },
      colors,
      scalar: 0.9,
    });
    const t = window.setTimeout(() => {
      confetti({
        particleCount: 60,
        spread: 100,
        startVelocity: 25,
        origin: { y: 0.5 },
        colors,
        scalar: 0.8,
      });
    }, 220);
    return () => window.clearTimeout(t);
  }, []);
}

export function SuccessView({ title, subtitle, details, onClose, colorClass = 'bg-emerald-500' }: Props) {
  useCelebrate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="w-full max-w-md glass-card border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className={`${colorClass} p-8 flex flex-col items-center text-white relative overflow-hidden`}>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/15 to-transparent"
          />
          <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md animate-check-pop glow-ring-success">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest relative">{title}</h2>
          <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-tighter relative">{subtitle}</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {details.map((d, i) => (
              <div
                key={i}
                className={`flex justify-between items-center ${i !== details.length - 1 ? 'border-b border-slate-50 pb-3' : ''}`}
              >
                <span className="text-[10px] font-black text-slate-400 uppercase">{d.label}</span>
                <span className={`text-[10px] font-black uppercase ${d.color || 'text-slate-900'}`}>{d.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <p className="text-[9px] font-bold text-slate-500 text-center italic">
              "Your submission is under review. Our team will verify it shortly."
            </p>
          </div>

          <button
            onClick={onClose}
            className="sheen-host w-full bg-gradient-to-br from-slate-900 to-slate-800 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-95 transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
