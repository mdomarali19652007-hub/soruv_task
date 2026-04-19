/**
 * Social job screen (per-platform payment + screenshot proof).
 *
 * Phase 6 extraction from src/App.tsx. Reads `selectedSocialJob` (the
 * item the user tapped on the Social Hub) as a prop so the feature
 * module does not depend on the outer navigation state.
 */

import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  Copy,
  History,
  Image as ImageIcon,
  RefreshCw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { SocialSubmission, UserProfile, View } from '../../types';
import { OperationType } from '../../types';
import { handleDbError } from '../../utils/db-errors';

export interface SelectedSocialJob {
  title: string;
  color: string;
  icon?: ReactNode;
}

interface Props {
  user: Pick<UserProfile, 'id' | 'name'>;
  setView: (view: View) => void;
  selectedSocialJob: SelectedSocialJob | null;
  allSocialSubmissions: SocialSubmission[];
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  uploadMedia: (file: File) => Promise<string>;
  /** Overridable for tests; defaults to the monolith's original constant. */
  payeerAccount?: string;
  /** Overridable for tests; defaults to the monolith's original link. */
  telegramBotUrl?: string;
}

export function SocialJobView({
  user,
  setView,
  selectedSocialJob,
  allSocialSubmissions,
  insertRow,
  uploadMedia,
  payeerAccount = '59383883',
  telegramBotUrl = 'https://t.me/IMADMIN1_BOT',
}: Props) {
  const [trxId, setTrxId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedSocialJob) return null;

  const handleSubmit = async () => {
    if (!trxId || !screenshot) {
      alert('Please provide both Transaction ID and Screenshot.');
      return;
    }

    setIsSubmitting(true);
    try {
      const submission: SocialSubmission = {
        id: Date.now().toString(),
        userId: user.id,
        userName: user.name,
        type: selectedSocialJob.title,
        trxId,
        screenshot,
        status: 'pending',
        date: new Date().toISOString(),
      };

      await insertRow('socialSubmissions', submission as unknown as Record<string, unknown>);
      alert('Submission successful! Please wait for admin approval.');
      setView('social-hub');
    } catch (e) {
      handleDbError(e, OperationType.WRITE, 'socialSubmissions');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setView('social-hub')}
            className="p-3 glass rounded-2xl text-slate-700 hover:scale-110 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-black neon-text text-slate-900 uppercase">{selectedSocialJob.title}</h2>
        </div>

        <div className="space-y-6">
          {/* Rules Section */}
          <div className="glass-card p-6 border-indigo-100 bg-indigo-50/30">
            <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              কাজের নিয়মাবলী (Rules)
            </h3>
            <ul className="space-y-3">
              {[
                'এই কাজটি করতে হলে আপনাকে অবশ্যই আমাদের নিয়ম মেনে চলতে হবে।',
                'ভুল তথ্য দিলে আপনার একাউন্ট ব্যান হতে পারে।',
                'পেমেন্ট করার পর ট্রানজেকশন আইডি এবং স্ক্রিনশট জমা দিন।',
                'এডমিন যাচাই করার পর আপনার একাউন্টে ব্যালেন্স যোগ হবে।',
                'যেকোনো সমস্যার জন্য আমাদের টেলিগ্রাম বোটে যোগাযোগ করুন।',
              ].map((rule, i) => (
                <li key={i} className="flex gap-3 text-xs font-bold text-slate-700 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 text-[10px]">
                    {i + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Telegram Bot Button */}
          <a
            href={telegramBotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 bg-sky-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Send className="w-5 h-5" />
            Contact Telegram Bot
          </a>

          {/* Payment Info */}
          <div className="glass-card p-6 border-white/40 shadow-xl">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payeer Account Number</p>
            <div className="flex items-center justify-between bg-slate-900 p-4 rounded-2xl shadow-inner">
              <span className="text-xl font-black text-white tracking-widest">{payeerAccount}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(payeerAccount);
                  alert('Payeer account copied!');
                }}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
            <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase">Click copy button and pay via Payeer</p>
          </div>

          {/* Submission Form */}
          <div className="glass-card p-6 border-white/40 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Submit Proof</h3>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">
                Transaction ID (Trx ID)
              </label>
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value)}
                placeholder="Enter Transaction ID"
                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Screenshot Proof</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="social-job-screenshot"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadMedia(file);
                      setScreenshot(url);
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Upload failed');
                    }
                  }}
                />
                <label
                  htmlFor="social-job-screenshot"
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-indigo-500 transition-all"
                >
                  {screenshot ? (
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
                {screenshot && <p className="text-[8px] text-slate-400 mt-2 truncate px-2">URL: {screenshot}</p>}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                isSubmitting ? 'bg-slate-200 text-slate-400' : 'bg-gradient-to-r from-indigo-600 to-violet-700 text-white active:scale-95'
              }`}
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {isSubmitting ? 'Submitting...' : 'Submit Now'}
            </button>
          </div>

          {/* History Section */}
          <div className="glass-card p-6 border-white/40 shadow-xl">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-500" />
              Submission History
            </h3>
            <div className="space-y-3">
              {allSocialSubmissions.filter(
                (s) => s.userId === user.id && s.type === selectedSocialJob.title,
              ).length === 0 ? (
                <p className="text-[10px] text-slate-400 text-center py-4 uppercase font-bold">No history found</p>
              ) : (
                allSocialSubmissions
                  .filter((s) => s.userId === user.id && s.type === selectedSocialJob.title)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase">{s.trxId}</p>
                        <p className="text-[8px] text-slate-400 font-bold">{new Date(s.date).toLocaleDateString()}</p>
                      </div>
                      <span
                        className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${
                          s.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : s.status === 'rejected'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
