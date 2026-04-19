/**
 * Referral zone screen -- shows code, link, rules, and referral stats.
 *
 * Phase 4 extraction from src/App.tsx. Pure read-only, aside from the
 * clipboard copy interaction.
 */

import { useState } from 'react';
import { ArrowLeft, Copy, Info } from 'lucide-react';
import type { UserProfile, View } from '../../types';

interface Props {
  user: Pick<UserProfile, 'numericId' | 'referralLink' | 'referralActiveCount'>;
  setView: (view: View) => void;
  referralActivationBonus: number;
  referralCommissionRate: number;
}

export function ReferralView({ user, setView, referralActivationBonus, referralCommissionRate }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="REFERRAL ZONE">
            REFERRAL ZONE
          </h2>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass-card p-5 border-indigo-500/10 shadow-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Active Referrals</p>
            <p className="text-xl font-black text-indigo-600">{user.referralActiveCount}</p>
          </div>
          <div className="glass-card p-5 border-emerald-500/10 shadow-md">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Bonus</p>
            <p className="text-xl font-black text-emerald-600">
              ৳ {(user.referralActiveCount * referralActivationBonus).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Referral Code & Link */}
        <div className="glass-card border-white/40 shadow-xl space-y-6 mb-8">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Your Referral Code</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 font-black shadow-inner">
                {user.numericId}
              </div>
              <button
                onClick={() => handleCopy(user.numericId)}
                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block ml-1">Referral Link</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[10px] text-slate-900 font-bold shadow-inner truncate">
                {user.referralLink}
              </div>
              <button
                onClick={() => handleCopy(user.referralLink)}
                className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          {copied && (
            <p className="text-[10px] font-black text-emerald-600 text-center uppercase animate-bounce">
              Copied to clipboard!
            </p>
          )}
        </div>

        {/* Referral Rules */}
        <div className="glass-card border-indigo-100 bg-indigo-50/30 p-6">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Referral Program Rules
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-indigo-600">1</span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                আপনার রেফারেল কোড ব্যবহার করে কেউ একাউন্ট খুললে আপনি সাথে সাথে বোনাস পাবেন না।
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-indigo-600">2</span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                যখন আপনার রেফার করা মেম্বার তার একাউন্ট ৳ ১০০ দিয়ে একটিভ করবে, তখন আপনি সাথে সাথে ৳ {referralActivationBonus} বোনাস পাবেন।
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-indigo-600">3</span>
              </div>
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                এছাড়াও আপনার রেফার করা মেম্বারের প্রতিটি কাজ থেকে আপনি {referralCommissionRate}% লাইফটাইম কমিশন পাবেন।
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
