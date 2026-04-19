/**
 * Gmail Sale / Digital Assets folder (category = 'gmail').
 *
 * Phase 5 extraction from src/App.tsx. Unlike FolderA/B, this flow
 * uses a single email input instead of a screenshot upload, and
 * displays an admin-provided app password. Submissions go to
 * `gmailSubmissions` with a `GmailSubmission` row shape.
 */

import { useState } from 'react';
import { ArrowLeft, ExternalLink, History } from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import type { GmailSubmission, UserProfile, View } from '../../types';
import type { DynamicTask } from './FolderAView';

interface Props {
  user: Pick<UserProfile, 'id'>;
  setView: (view: View) => void;
  gmailSubmissions: GmailSubmission[];
  dynamicTasks: DynamicTask[];
  gmailReward: number;
  gmailPassword: string;
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
}

export function FolderCView({
  user,
  setView,
  gmailSubmissions,
  dynamicTasks,
  gmailReward,
  gmailPassword,
  handleSubmission,
  insertRow,
}: Props) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
  const [selectedTask, setSelectedTask] = useState<DynamicTask | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    await handleSubmission(async () => {
      const newSub: GmailSubmission = {
        id: crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
        userId: user.id,
        email,
        status: 'pending',
        date: new Date().toLocaleString(),
        reward: selectedTask ? selectedTask.reward : gmailReward,
      };
      await insertRow('gmailSubmissions', newSub as unknown as Record<string, unknown>);
      setEmail('');
      setStep('success');
    }, 'Gmail submitted successfully!');
  };

  if (showHistory) {
    const mySubmissions = gmailSubmissions.filter((s) => s.userId === user.id);
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Gmail History</h2>
          </div>

          <div className="space-y-4">
            {mySubmissions.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Gmail logs found</p>
              </div>
            ) : (
              mySubmissions.map((s) => (
                <div key={s.id} className="glass-card border-white/40 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">{s.email}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{s.date}</p>
                    </div>
                    <span
                      className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter border ${
                        s.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : s.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  {s.reason && (
                    <p className="text-[8px] font-bold text-rose-500 uppercase mt-2 pt-2 border-t border-slate-100">
                      Note: {s.reason}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <SuccessView
        title="Account Logged"
        subtitle="Gmail submission received"
        onClose={() => setStep('list')}
        colorClass="bg-rose-500"
        details={[
          { label: 'Account', value: email },
          {
            label: 'Reward',
            value: `৳ ${(selectedTask ? selectedTask.reward : gmailReward).toFixed(2)}`,
            color: 'text-rose-600',
          },
          { label: 'Status', value: 'Pending Review' },
        ]}
      />
    );
  }

  if (step === 'submit') {
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Submit Task</h2>
          </div>
          <div className="glass-card space-y-6 border-white/40 shadow-lg">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <h4 className="text-sm font-black text-rose-900 mb-1">{selectedTask?.title || 'Gmail Sale'}</h4>
              <p className="text-[10px] text-rose-600 font-bold uppercase tracking-widest">
                Reward: ৳ {(selectedTask ? selectedTask.reward : gmailReward).toFixed(2)}
              </p>
              {selectedTask?.link && (
                <a
                  href={selectedTask.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 w-full py-2 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit Gmail Link
                </a>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Gmail Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 text-sm text-black font-medium outline-none focus:border-indigo-500 shadow-sm"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-5 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
              >
                SUBMIT WORK
              </button>

              <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Asset Rules</h4>
                <ul className="space-y-2">
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                    Gmail accounts must be verified and active.
                  </li>
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                    Use the required app password provided in the dashboard.
                  </li>
                  <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                    <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                    Payments are made after account verification.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('workstation')}
              className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Digital Assets">
              Digital Assets
            </h2>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-rose-600">
            <History className="w-6 h-6" />
          </button>
        </div>
        <div className="glass-card mb-6 border-amber-500/20 bg-amber-50/50 shadow-sm">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Required App Password</p>
          <h3 className="text-xl font-black text-slate-900 mb-2">{gmailPassword}</h3>
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
            Use this password for all your Gmail submissions.
          </p>
        </div>
        <div className="glass-card mb-6 border-white/40 shadow-lg">
          <h3 className="text-lg font-black text-slate-900 mb-2">Bulk Gmail Submission</h3>
          <p className="text-xs text-slate-500 mb-4">Submit your verified Gmail accounts for bulk sale.</p>
          <div className="space-y-4">
            <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Gmail Address</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-black font-medium outline-none focus:border-amber-500 shadow-sm"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              SUBMIT ACCOUNT (৳ {gmailReward.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Dynamic Gmail Tasks */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Special Gmail Tasks</h3>
          {dynamicTasks.filter((t) => t.category === 'gmail').length === 0 ? (
            <div className="text-center py-10 glass-card border-dashed border-slate-200">
              <p className="text-[8px] text-slate-400 uppercase font-bold">No special tasks available</p>
            </div>
          ) : (
            dynamicTasks
              .filter((t) => t.category === 'gmail')
              .map((task, i) => (
                <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm">
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-black text-slate-900 mb-1">{task.title}</h4>
                    <p className="text-[10px] text-slate-500">{task.desc}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-600 font-black text-sm">৳ {task.reward.toFixed(2)}</p>
                    <button
                      onClick={() => {
                        if (task.link) window.open(task.link, '_blank');
                        setSelectedTask(task);
                        setStep('submit');
                      }}
                      className="mt-2 bg-amber-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase shadow-md active:scale-95 transition-all"
                    >
                      Start
                    </button>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
