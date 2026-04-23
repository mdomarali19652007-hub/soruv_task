/**
 * Gaming zone landing -- routes into Ludo tournaments; reserves a
 * disabled "Free Fire" tile for a future upcoming feature.
 *
 * Phase 9 extraction from src/App.tsx. Purely presentational.
 */

import { ArrowLeft, ChevronRight, Gamepad2, Trophy } from 'lucide-react';
import type { View } from '../../types';

interface Props {
  setView: (view: View) => void;
}

export function GamingView({ setView }: Props) {
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 pt-12 pb-24 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10">
          <button
            onClick={() => setView('home')}
            className="w-10 h-10 glass rounded-xl flex items-center justify-center text-white mb-6 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
            Gaming Zone
          </h1>
          <p className="text-purple-100 text-xs font-bold uppercase tracking-widest opacity-80">
            Play & Earn Real Money
          </p>
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setView('ludo-earn')}
            className="glass-card p-6 flex items-center gap-6 border-white/40 shadow-xl group hover:scale-[1.02] transition-all"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                Ludo Earn
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Daily Tournaments
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 ml-auto group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="glass-card p-6 flex items-center gap-6 border-white/40 shadow-xl opacity-60 grayscale">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white shadow-lg">
              <Gamepad2 className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                Free Fire
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Upcoming Soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
