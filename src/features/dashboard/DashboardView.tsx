/**
 * Stats / dashboard screen showing profile, balances, referral summary,
 * achievements and recent task history.
 *
 * Phase 3 extraction from src/App.tsx. Read-only aside from the
 * clipboard copy interaction, so the prop surface stays small.
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Copy, ExternalLink, FileText, User, Users, Wallet } from 'lucide-react';
import type { UserProfile, View } from '../../types';

interface Props {
  user: UserProfile;
  setView: (view: View) => void;
  /** Used to compute referral counts in the referral program card. */
  allUsers: UserProfile[];
  referralCommissionRate: number;
}

export function DashboardView({ user, setView, allUsers, referralCommissionRate }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')} className="p-3 glass rounded-2xl text-slate-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Stats">
              Stats
            </h2>
          </div>
        </div>

        {/* Profile Card */}
        <div className="glass-card mb-8 relative overflow-hidden group border-white/40 shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all" />
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-20 h-20 rounded-[24px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-xl neon-border overflow-hidden">
              {(user as unknown as { profilePic?: string }).profilePic ? (
                <img
                  src={(user as unknown as { profilePic?: string }).profilePic}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">{user.name}</h3>
              <p className="text-xs font-bold text-slate-500 mb-2">{user.id}</p>
              <div className="flex gap-2">
                <span className="bg-indigo-500/10 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-500/20">
                  {user.rank} Rank
                </span>
                <span
                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                    user.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/20 cursor-pointer'
                  }`}
                  onClick={() => !user.isActive && setView('account-activation')}
                >
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {user.isActive && (
                <p className="text-[8px] font-black text-emerald-600 uppercase mt-2">
                  Expires: {new Date(user.activationExpiry).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Live Balance Grid */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          <div className="glass-card bg-gradient-to-br from-indigo-500/5 to-violet-600/5 border-indigo-500/10 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-500/20 rounded-2xl">
                <Wallet className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-500/10 px-2 py-1 rounded-lg uppercase">
                Main Balance
              </span>
            </div>
            <p className="text-3xl font-black text-slate-900 mb-1">৳ {user.mainBalance.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Available Balance</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 border-emerald-500/10 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Total Earned</p>
              <p className="text-xl font-black text-emerald-600">৳ {user.totalEarned.toFixed(2)}</p>
            </div>
            <div className="glass-card p-5 border-indigo-500/10 shadow-md">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Pending</p>
              <p className="text-xl font-black text-indigo-600">৳ {user.pendingPayout.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Enhanced Referral Section */}
        <div className="glass-card mb-8 border-white/40 shadow-xl bg-gradient-to-br from-indigo-500/5 to-violet-600/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              Referral Program
            </h3>
          </div>

          <div className="text-center mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Your Referral Code</p>
            <div
              onClick={() => user.numericId && handleCopy(user.numericId)}
              aria-disabled={!user.numericId}
              className={`relative inline-flex items-center gap-4 bg-white border-2 border-indigo-100 px-10 py-5 rounded-[32px] transition-all group shadow-sm ${
                user.numericId
                  ? 'cursor-pointer hover:border-indigo-500 active:scale-95'
                  : 'cursor-not-allowed opacity-60'
              }`}
            >
              <span className="text-4xl font-black text-indigo-600 tracking-[0.1em]">{user.numericId || '——'}</span>
              <div className="p-2 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                <Copy className="w-6 h-6 text-indigo-600" />
              </div>

              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, x: '-50%' }}
                    animate={{ opacity: 1, y: -60, x: '-50%' }}
                    exit={{ opacity: 0, y: -80, x: '-50%' }}
                    className="absolute left-1/2 bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl whitespace-nowrap"
                  >
                    Copied Successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              disabled={!user.numericId}
              onClick={() => {
                if (!user.numericId) return;
                const link = `${window.location.origin}?ref=${user.numericId}`;
                handleCopy(link);
              }}
              className="mt-4 flex items-center gap-2 mx-auto text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-3 h-3" />
              Copy Referral Link
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Total</p>
              <p className="text-sm font-black text-slate-900">
                {allUsers.filter((u) => u.referredBy === user.id).length}
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Active</p>
              <p className="text-sm font-black text-emerald-600">
                {allUsers.filter((u) => u.referredBy === user.id && u.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Earned</p>
              <p className="text-sm font-black text-indigo-600">৳ {user.totalCommission?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Referral Rules</p>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-slate-600 font-bold">Lifetime Commission</p>
              <p className="text-[10px] font-black text-indigo-600 uppercase">{referralCommissionRate}%</p>
            </div>
            <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
              Earn from every task your team completes
            </p>
          </div>
        </div>

        {/* Achievements */}
        <div className="mt-8">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 px-2">Achievements</h3>
          <div className="space-y-3">
            {user.achievements.map((ach) => (
              <div key={ach.id} className="glass-card p-4 border-white/40 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black text-slate-800 uppercase">{ach.title}</span>
                  <span className="text-[10px] font-bold text-indigo-600">
                    {ach.progress}/{ach.goal}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-violet-600"
                    style={{ width: `${(ach.progress / ach.goal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Task History */}
        <div className="mt-8">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4 px-2">Recent Tasks</h3>
          {user.taskHistory.length === 0 ? (
            <div className="glass-card p-8 text-center border-white/40 shadow-sm">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No tasks completed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {user.taskHistory.map((task) => (
                <div key={task.id} className="glass-card flex justify-between items-center p-4 border-white/40 shadow-sm">
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase">{task.title}</p>
                    <p className="text-[10px] font-bold text-slate-400">{task.date}</p>
                  </div>
                  <p className="text-emerald-600 font-black text-xs">+৳ {task.reward.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
