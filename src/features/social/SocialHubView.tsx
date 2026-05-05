/**
 * Social Hub landing -- claim the daily "FREE KOP" bonus plus routing
 * into per-platform SocialJobView flows (Tiktok, Telegram, Taiping, etc).
 *
 * Phase 9 extraction from src/App.tsx. Behavior preserved: the free bonus
 * updates the user's mainBalance through the same legacy updateRow path
 * the inline version used.
 */

import type { ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Gift, Instagram, Keyboard, Music, Send } from 'lucide-react';
import type { UserProfile, View } from '../../types';
import { useFeedback } from '../../components/feedback/FeedbackProvider';

export interface SocialJob {
  title: string;
  color: string;
  icon: ReactNode;
}

interface Props {
  user: Pick<UserProfile, 'id'>;
  setView: (view: View) => void;
  setSelectedSocialJob: (job: SocialJob) => void;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

const JOBS: SocialJob[] = [
  { title: 'Tiktok Earn', color: 'from-pink-500 to-rose-600', icon: <Music className="w-6 h-6" /> },
  { title: 'Teligram Earn', color: 'from-sky-400 to-blue-500', icon: <Send className="w-6 h-6" /> },
  {
    title: 'Taiping Work',
    color: 'from-slate-600 to-slate-800',
    icon: <Keyboard className="w-6 h-6" />,
  },
  {
    title: 'Inestragram job',
    color: 'from-purple-500 to-pink-500',
    icon: <Instagram className="w-6 h-6" />,
  },
];

export function SocialHubView({ user, setView, setSelectedSocialJob, updateRow }: Props) {
  const fb = useFeedback();
  const claimFreeKop = () => {
    confetti({ particleCount: 100, spread: 70 });
    fb.showToast('You claimed a FREE gift! +৳ 5.00 added to your balance.', 'success');
    updateRow('users', user.id, { mainBalance: 5 });
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
          <h2
            className="text-2xl font-black neon-text text-slate-900 glitch-text"
            data-text="SOCIAL HUB"
          >
            SOCIAL HUB
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div
            onClick={claimFreeKop}
            className="glass-card p-6 flex items-center justify-between border-amber-200 bg-amber-50/50 shadow-lg group relative overflow-hidden cursor-pointer active:scale-95 transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-5 transition-all" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  FREE KOP
                </h3>
                <p className="text-[8px] font-bold text-amber-600 uppercase">Claim ৳ 5.00 Bonus</p>
              </div>
            </div>
            <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter relative z-10">
              Claim Now
            </span>
          </div>

          {JOBS.map((item, i) => (
            <div
              key={i}
              onClick={() => {
                setSelectedSocialJob(item);
                setView('social-job');
              }}
              className="glass-card p-6 flex items-center justify-between border-white/40 shadow-lg group relative overflow-hidden cursor-pointer active:scale-95 transition-all"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-0 group-hover:opacity-5 transition-all`}
              />
              <div className="flex items-center gap-4 relative z-10">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-lg`}
                >
                  {item.icon}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  {item.title}
                </h3>
              </div>
              <span className="bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter relative z-10">
                Open Job
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
