/**
 * Generic "action submitted successfully" confirmation screen.
 *
 * Extracted unchanged from src/App.tsx. This component was already
 * prop-clean in the original monolith, so the move is literally a
 * relocation -- no behaviour change.
 */

import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

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

export function SuccessView({ title, subtitle, details, onClose, colorClass = 'bg-emerald-500' }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md glass-card border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className={`${colorClass} p-8 flex flex-col items-center text-white`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-md">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
          <p className="text-[10px] font-bold opacity-80 mt-1 uppercase tracking-tighter">{subtitle}</p>
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
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
