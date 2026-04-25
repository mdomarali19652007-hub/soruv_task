/**
 * Full-screen processing indicator shown while a form submission
 * (withdrawal, recharge, task proof etc.) is in flight.
 *
 * Extracted from src/App.tsx. Previously this closed over the
 * outer `isSubmitting` / `submissionProgress` state; it now takes
 * them as props so it can live in its own module.
 */

import { AnimatePresence, motion } from 'motion/react';

interface Props {
  isSubmitting: boolean;
  /** 0..100, matches the original outer-state semantics. */
  submissionProgress: number;
}

export function SubmissionLoader({ isSubmitting, submissionProgress }: Props) {
  return (
    <AnimatePresence>
      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-xl"
        >
          <div className="w-24 h-24 relative mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <motion.circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 251.2 - (251.2 * submissionProgress) / 100 }}
                className="text-[#6366f1]"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-white font-black text-xl">
              {Math.ceil((1.5 * (100 - submissionProgress)) / 100)}s
            </div>
          </div>
          <h3 className="text-white font-black text-xl uppercase tracking-[0.3em] mb-2">Processing...</h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">দয়া করে অপেক্ষা করুন</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
