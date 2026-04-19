/**
 * Watch-ads-for-reward screen.
 *
 * Phase 2 extraction out of src/App.tsx. Behaviour is preserved
 * verbatim, including the known quirk that `updateRow` here sets
 * mainBalance/totalEarned to the flat reward value rather than
 * incrementing them. That is how the original monolith behaved;
 * correcting it is a separate concern tracked in the audit plan.
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { UserProfile, View } from '../../types';
import { OperationType } from '../../types';
import { handleDbError } from '../../utils/db-errors';

interface Props {
  user: Pick<UserProfile, 'id' | 'adWatches'>;
  setView: (view: View) => void;
  dailyAdLimit: number;
  adReward: number;
  /** Loose typing -- matches the surface of lib/database.updateRow. */
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function AdsEarnView({ user, setView, dailyAdLimit, adReward, updateRow }: Props) {
  const today = new Date().toISOString().split('T')[0];
  const todayWatch = user.adWatches.find((w) => w.date === today) || {
    id: today,
    date: today,
    count: 0,
  };
  const [isWatching, setIsWatching] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const watchAd = () => {
    setMessage(null);
    if (todayWatch.count >= dailyAdLimit) {
      setMessage({ text: 'Daily ad limit reached!', type: 'error' });
      return;
    }
    setIsWatching(true);
    setTimeout(async () => {
      setIsWatching(false);
      const newCount = todayWatch.count + 1;
      const newAdWatches = user.adWatches.filter((w) => w.date !== today);
      newAdWatches.push({ ...todayWatch, count: newCount });

      try {
        await updateRow('users', user.id, {
          mainBalance: adReward,
          totalEarned: adReward,
          adWatches: newAdWatches,
        });
        confetti({ particleCount: 50, spread: 60 });
        setMessage({ text: `Ad watched! You earned ৳ ${adReward.toFixed(2)}`, type: 'success' });
      } catch (e) {
        handleDbError(e, OperationType.UPDATE, `users/${user.id}`);
      }
    }, 5000);
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
          <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Ads Earn">
            Ads Earn
          </h2>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            <p className="text-xs font-bold uppercase tracking-widest">{message.text}</p>
          </div>
        )}

        <div className="glass-card text-center py-10 mb-8 border-white/40 shadow-lg">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Today's Progress</p>
          <h3 className="text-4xl font-black text-slate-900 mb-4">
            {todayWatch.count} / {dailyAdLimit}
          </h3>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden max-w-[200px] mx-auto">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(todayWatch.count / dailyAdLimit) * 100}%` }}
              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            />
          </div>
        </div>

        <div className="glass-card border-indigo-500/20 bg-indigo-50/50 mb-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <PlayCircle className="w-6 h-6 text-indigo-600" />
            <h4 className="font-black text-sm text-slate-800 uppercase tracking-widest">Monetag Ads</h4>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Watch short video ads to earn instant rewards. Each ad pays ৳ {adReward.toFixed(2)}. Watch 10 ads to earn ৳ 4.00.
          </p>
          <div className="space-y-3">
            <button
              onClick={watchAd}
              disabled={isWatching || todayWatch.count >= dailyAdLimit}
              className={`w-full py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all ${
                isWatching || todayWatch.count >= dailyAdLimit
                  ? 'bg-slate-200 text-slate-400'
                  : 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white'
              }`}
            >
              {isWatching ? 'WATCHING AD...' : todayWatch.count >= dailyAdLimit ? 'LIMIT REACHED' : 'VIEW ADS'}
            </button>
            <a
              href="https://monetag.com"
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 border border-indigo-200 text-indigo-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              Visit Ad Network
            </a>
          </div>

          <div className="mt-8 pt-8 border-t border-indigo-100">
            <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4">Earning Rules</h4>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-50">
                <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase">Daily Limit</p>
                  <p className="text-[8px] text-slate-400 font-bold">You can watch up to {dailyAdLimit} ads per day.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-indigo-50">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-800 uppercase">Instant Reward</p>
                  <p className="text-[8px] text-slate-400 font-bold">Earn ৳ {adReward.toFixed(2)} for every successful ad view.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
