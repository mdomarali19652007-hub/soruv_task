/**
 * Full-screen takeover shown when the logged-in user's account is
 * banned or suspended. Extracted from src/App.tsx.
 *
 * The original closed over `user` and called signOut() + setView('login')
 * inline. It now takes `user` and an `onLogout` callback so the parent
 * owns the navigation + sign-out side effects.
 */

import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import type { UserProfile } from '../types';

interface Props {
  user: Pick<UserProfile, 'status' | 'restrictionReason' | 'suspensionUntil'>;
  /** Called when the user taps the "Logout" button. */
  onLogout: () => void | Promise<void>;
  /** Support channel opened when the user taps "Contact Support". */
  supportUrl?: string;
}

export function RestrictionScreen({ user, onLogout, supportUrl = 'https://t.me/smarttask_support' }: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex items-center justify-center p-6 text-center">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card bg-white/10 border-white/20 p-8 max-w-sm w-full"
      >
        <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Account {user.status}</h2>
        <p className="text-rose-200 text-xs font-bold mb-6 leading-relaxed">
          {user.restrictionReason || 'Your account has been restricted due to a policy violation.'}
        </p>

        {user.status === 'suspended' && user.suspensionUntil && (
          <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Suspension Ends</p>
            <p className="text-lg font-black text-white">{new Date(user.suspensionUntil).toLocaleDateString()}</p>
          </div>
        )}

        <div className="space-y-3">
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="block w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
          >
            Contact Support
          </a>
          <button
            onClick={() => void onLogout()}
            className="block w-full bg-white/10 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 active:scale-95 transition-all"
          >
            Logout
          </button>
        </div>
      </motion.div>
    </div>
  );
}
