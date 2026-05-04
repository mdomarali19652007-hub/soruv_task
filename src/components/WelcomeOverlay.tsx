/**
 * Two-step welcome modal shown on first visit (branding + platform rules).
 *
 * Extracted from src/App.tsx. The original was an inline closure reading
 * outer `showWelcome`, `setShowWelcome`, and `rulesText`; it now takes
 * those as props and owns its own step state internally.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldCheck, Sparkles, Star, Zap } from 'lucide-react';

interface Props {
  /** Whether the overlay should be visible. */
  show: boolean;
  /** Called when the user accepts the rules on step 2. */
  onDismiss: () => void;
  /** Platform rules body copy rendered on step 2. */
  rulesText: string;
}

export function WelcomeOverlay({ show, onDismiss, rulesText }: Props) {
  const [step, setStep] = useState(1);

  if (!show) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md"
      >
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -40 }}
            className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-[#6366f1]/30 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#ec4899] animate-gradient" />
            {/* Decorative sparkles around the logo for a playful welcome */}
            <Sparkles
              className="absolute top-8 left-8 w-5 h-5 text-fuchsia-400 animate-sparkle"
              aria-hidden="true"
            />
            <Star
              className="absolute top-12 right-10 w-4 h-4 text-indigo-400 animate-sparkle"
              style={{ animationDelay: '0.6s' }}
              aria-hidden="true"
            />
            <Sparkles
              className="absolute bottom-32 right-6 w-4 h-4 text-violet-400 animate-sparkle"
              style={{ animationDelay: '1.2s' }}
              aria-hidden="true"
            />
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 via-violet-100 to-fuchsia-100 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#6366f1]/20 animate-float">
              <Zap className="w-12 h-12 text-[#6366f1]" />
            </div>
            <h1
              className="text-4xl font-black mb-2 tracking-tighter uppercase gradient-text-vivid"
            >
              SMART TASK
            </h1>
            <p className="text-[#6366f1] text-xs font-black uppercase tracking-[0.3em] mb-12">Next-Gen Earning Platform</p>
            <button
              onClick={() => setStep(2)}
              className="sheen-host w-full py-5 bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#ec4899] bg-[length:200%_200%] animate-gradient text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-transform duration-200"
            >
              GET STARTED
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -40 }}
            className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-[#6366f1]/30 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#ec4899] animate-gradient" />
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-pop-in shadow-inner">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Platform Rules</h2>
            <div className="bg-slate-50 rounded-2xl p-4 mb-8 max-h-[200px] overflow-y-auto text-left border border-slate-100">
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">{rulesText}</p>
            </div>
            <button
              onClick={onDismiss}
              className="sheen-host w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-transform duration-200"
            >
              I AGREE & ENTER
            </button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
