/**
 * Static "top earners" leaderboard. Phase 9 extraction from src/App.tsx.
 *
 * Note: this is currently populated from a hard-coded list, matching
 * the pre-split behavior exactly. Swapping it for a live feed reading
 * `public_user_profiles` is a follow-up.
 */

import { ArrowLeft } from 'lucide-react';
import type { View } from '../../types';

interface Player {
  name: string;
  earned: string;
  rank: number;
}

const PLAYERS: Player[] = [
  { name: 'Ariful Islam', earned: '৳ 45,200', rank: 1 },
  { name: 'Mehedi Hasan', earned: '৳ 38,500', rank: 2 },
  { name: 'Sabbir Ahmed', earned: '৳ 32,100', rank: 3 },
  { name: 'Tanvir Hossain', earned: '৳ 28,900', rank: 4 },
  { name: 'Rashed Khan', earned: '৳ 25,400', rank: 5 },
];

interface Props {
  setView: (view: View) => void;
}

export function LeaderboardView({ setView }: Props) {
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
          <h2
            className="text-2xl font-black neon-text text-slate-900 glitch-text"
            data-text="Leaderboard"
          >
            Leaderboard
          </h2>
        </div>
        <div className="space-y-4">
          {PLAYERS.map((player, i) => (
            <div
              key={i}
              className={`glass-card flex items-center justify-between shadow-sm ${
                i < 3 ? 'border-amber-500/40 bg-amber-50/50' : 'border-white/40'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-sm ${
                    i === 0
                      ? 'bg-amber-500 text-white'
                      : i === 1
                        ? 'bg-slate-300 text-slate-700'
                        : i === 2
                          ? 'bg-orange-400 text-white'
                          : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {player.rank}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">{player.name}</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                    Top Earner
                  </p>
                </div>
              </div>
              <p className="text-amber-600 font-black">{player.earned}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
