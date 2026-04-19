/**
 * Micro-freelancing folder (category = 'micro').
 *
 * Phase 4 extraction from src/App.tsx. Writes to `microjobSubmissions`
 * and is the most distinct of the four folder views, hence the
 * per-feature module rather than a shared component.
 */

import { useState, type ChangeEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  History,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import type { MicrojobSubmission, UserProfile, View } from '../../types';

export interface DynamicTask {
  id: string;
  title: string;
  desc: string;
  link?: string;
  reward: number;
  category: string;
}

interface Props {
  user: Pick<UserProfile, 'id'>;
  setView: (view: View) => void;
  microjobSubmissions: MicrojobSubmission[];
  dynamicTasks: DynamicTask[];
  handleSubmission: (action: () => Promise<void>, successMsg: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  uploadMedia: (file: File) => Promise<string>;
}

export function FolderAView({
  user,
  setView,
  microjobSubmissions,
  dynamicTasks,
  handleSubmission,
  insertRow,
  uploadMedia,
}: Props) {
  const [step, setStep] = useState<'list' | 'submit' | 'success'>('list');
  const [selectedTask, setSelectedTask] = useState<DynamicTask | null>(null);
  const [submission, setSubmission] = useState({ userName: '', screenshot: '', link: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);
    try {
      const url = await uploadMedia(file);
      setSubmission({ ...submission, screenshot: url });
      setMessage({ text: 'Screenshot uploaded successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Upload failed', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setMessage(null);
    if (!submission.userName || !submission.screenshot) {
      setMessage({ text: 'Please fill all fields', type: 'error' });
      return;
    }
    await handleSubmission(async () => {
      const newSub: MicrojobSubmission = {
        id: crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
        userId: user.id,
        microjobId: selectedTask?.title ?? '',
        userName: submission.userName,
        link: submission.link,
        screenshot: submission.screenshot,
        status: 'pending',
        date: new Date().toLocaleString(),
      };
      await insertRow('microjobSubmissions', newSub as unknown as Record<string, unknown>);
      setStep('success');
    }, 'Microjob submitted successfully!');
  };

  if (showHistory) {
    const mySubmissions = microjobSubmissions.filter((s) => s.userId === user.id);
    return (
      <div className="min-h-screen pb-32 bg-slate-50">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => setShowHistory(false)} className="p-3 glass rounded-2xl text-slate-700">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Work History</h2>
          </div>

          <div className="space-y-4">
            {mySubmissions.length === 0 ? (
              <div className="text-center py-20 opacity-50">
                <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No work logs found</p>
              </div>
            ) : (
              mySubmissions.map((s) => (
                <div key={s.id} className="glass-card border-white/40 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.microjobId}</p>
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
        title="Work Submitted"
        subtitle="Microjob proof received"
        onClose={() => setStep('list')}
        colorClass="bg-indigo-500"
        details={[
          { label: 'Task', value: selectedTask?.title ?? '' },
          { label: 'Reward', value: `৳ ${selectedTask?.reward.toFixed(2) ?? '0.00'}`, color: 'text-indigo-600' },
          { label: 'Status', value: 'Pending Review' },
        ]}
      />
    );
  }

  if (step === 'submit' && selectedTask) {
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
            <h2 className="text-2xl font-black text-slate-900">Submit Proof</h2>
          </div>
          <div className="glass-card space-y-4 border-white/40 shadow-lg">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-4">
              <h4 className="text-sm font-black text-indigo-600 uppercase">{selectedTask.title}</h4>
              <p className="text-[10px] text-indigo-500 font-bold">Reward: ৳ {selectedTask.reward.toFixed(2)}</p>
              {selectedTask.link && (
                <a
                  href={selectedTask.link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit Job Link
                </a>
              )}
            </div>

            {message && (
              <div
                className={`mb-4 p-3 rounded-xl border flex items-center gap-2 ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                    : 'bg-rose-50 border-rose-100 text-rose-600'
                }`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <p className="text-[10px] font-bold uppercase">{message.text}</p>
              </div>
            )}

            <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Username</label>
              <input
                type="text"
                placeholder="Your Social Username"
                value={submission.userName}
                onChange={(e) => setSubmission({ ...submission, userName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Work Link</label>
              <input
                type="text"
                placeholder="Your Profile/Post Link"
                value={submission.link}
                onChange={(e) => setSubmission({ ...submission, link: e.target.value })}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-900 font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div className="text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 mb-1 block">Screenshot Proof</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="screenshot-upload-a"
                  disabled={isUploading}
                />
                <label
                  htmlFor="screenshot-upload-a"
                  className={`w-full flex items-center justify-center gap-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-indigo-500 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                  ) : submission.screenshot ? (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">Screenshot Ready</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8 text-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Select from Gallery</span>
                    </div>
                  )}
                </label>
                {submission.screenshot && (
                  <p className="text-[8px] text-slate-400 mt-2 truncate px-2">URL: {submission.screenshot}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl active:scale-95 transition-all"
            >
              SUBMIT WORK
            </button>

            <div className="mt-6 p-4 bg-slate-100/50 rounded-2xl border border-slate-200">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Submission Rules</h4>
              <ul className="space-y-2">
                <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Upload a clear screenshot of the completed task from your gallery.
                </li>
                <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Ensure the screenshot shows your work clearly.
                </li>
                <li className="text-[9px] text-slate-400 font-bold flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1 shrink-0" />
                  Multiple fake submissions will result in a ban.
                </li>
              </ul>
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
            <h2 className="text-2xl font-black neon-text text-slate-900 glitch-text" data-text="Micro Freelancing">
              Micro Freelancing
            </h2>
          </div>
          <button onClick={() => setShowHistory(true)} className="p-3 glass rounded-2xl text-indigo-600">
            <History className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4">
          {dynamicTasks.filter((t) => t.category === 'micro').length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">No microjobs available</p>
            </div>
          ) : (
            dynamicTasks
              .filter((t) => t.category === 'micro')
              .map((task, i) => (
                <div key={i} className="glass-card flex justify-between items-center border-white/40 shadow-sm hover:shadow-md transition-all">
                  <div className="flex-1 mr-4">
                    <h4 className="text-sm font-black text-slate-900 mb-1">{task.title}</h4>
                    <p className="text-[10px] text-slate-500 mb-2">{task.desc}</p>
                    <button
                      onClick={() => {
                        if (task.link) window.open(task.link, '_blank');
                        setSelectedTask(task);
                        setStep('submit');
                      }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open Task Link
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-600 font-black text-sm">৳ {task.reward.toFixed(2)}</p>
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setStep('submit');
                      }}
                      className="mt-2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
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
