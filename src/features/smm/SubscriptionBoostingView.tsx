/**
 * Subscription / "Boosting Hub" screen -- landing + purchase flows for
 * YouTube Premium, Telegram Premium, and Meta Verified. The SMM panel
 * entry is just a tile that routes to src/features/smm/SmmPanelView.
 *
 * Phase 8 extraction from src/App.tsx. DB writes go through the legacy
 * updateRow / insertRow helpers so behavior is byte-for-byte identical
 * to the inline version.
 */

import { useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  ChevronRight,
  Facebook,
  History,
  Mail,
  RefreshCw,
  Send,
  Smartphone,
  Youtube,
  Zap,
} from 'lucide-react';
import { SuccessView } from '../../components/SuccessView';
import type { SubscriptionRequest, UserProfile, View } from '../../types';
import { useFeedback } from '../../components/feedback/FeedbackProvider';

type Step = 'list' | 'youtube' | 'telegram' | 'meta' | 'success';

interface Props {
  user: Pick<UserProfile, 'id' | 'mainBalance'>;
  setView: (view: View) => void;
  isAdmin: boolean;
  enabledSmmServices: string[];
  subscriptionRequests: SubscriptionRequest[];
  handleSubmission: (action: () => Promise<void>, successMsg?: string) => Promise<void>;
  insertRow: (table: string, data: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: string, id: string, patch: Record<string, unknown>) => Promise<unknown>;
}

export function SubscriptionBoostingView({
  user,
  setView,
  isAdmin,
  enabledSmmServices,
  subscriptionRequests,
  handleSubmission,
  insertRow,
  updateRow,
}: Props) {
  const fb = useFeedback();
  const [step, setStep] = useState<Step>('list');
  const [email, setEmail] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const handleSubscribe = async (type: 'youtube' | 'telegram', price: number) => {
    if (user.mainBalance < price) {
      fb.showToast('Insufficient balance', 'error');
      return;
    }
    if (type === 'youtube' && !email.trim()) {
      fb.showToast('Please enter your email', 'error');
      return;
    }
    if (type === 'telegram' && !telegramId.trim()) {
      fb.showToast('Please enter your Telegram User ID', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSubmission(async () => {
        const newReq: SubscriptionRequest = {
          id: crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase(),
          userId: user.id,
          type,
          email: type === 'youtube' ? email : undefined,
          telegramId: type === 'telegram' ? telegramId : undefined,
          price,
          status: 'pending',
          date: new Date().toLocaleString(),
        };

        await updateRow('users', user.id, { mainBalance: -price });
        await insertRow('subscriptionRequests', { ...newReq });
        setStep('success');
      }, 'Subscription request submitted successfully!');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showHistory) {
    const myRequests = subscriptionRequests.filter((r) => r.userId === user.id);
    return (
      <div className="min-h-screen pb-32 bg-[#F8FAFC]">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setShowHistory(false)}
              className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Sub History
              </h2>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Premium Access Log
              </p>
            </div>
          </div>
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
                <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  No history found
                </p>
              </div>
            ) : (
              myRequests.map((r) => (
                <div
                  key={r.id}
                  className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                        {r.type} PREMIUM
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">
                        {r.date}
                      </p>
                      <p className="text-xs font-black text-indigo-600 mt-3 tracking-tight">
                        ৳ {r.price}
                      </p>
                    </div>
                    <span
                      className={`text-[7px] font-black px-3 py-1 rounded-full uppercase border ${
                        r.status === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : r.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.reason && (
                    <p className="text-[8px] font-bold text-rose-500 uppercase mt-3 pt-3 border-t border-slate-50">
                      Note: {r.reason}
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

  if (step === 'youtube') {
    return (
      <div className="min-h-screen pb-32 bg-[#F8FAFC]">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                YouTube Premium
              </h2>
              <p className="text-[8px] font-bold text-rose-600 uppercase tracking-[0.2em]">
                Ad-free Experience
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-[32px] text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                  <Youtube className="w-8 h-8" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">
                  1 Month Access
                </span>
              </div>
              <h3 className="text-4xl font-black mb-1 tracking-tighter">৳ 55.00</h3>
              <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">
                Premium Individual Plan
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-rose-50/50 rounded-3xl border border-rose-100/50">
                <h4 className="text-[8px] font-black text-rose-500 uppercase tracking-[0.3em] mb-4">
                  Activation Rules
                </h4>
                <ul className="space-y-3">
                  <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    আপনার ইউটিউব ইমেইলটি নিচে দিন।
                  </li>
                  <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    পেমেন্ট সফল হওয়ার ২৪ ঘণ্টার মধ্যে প্রিমিয়াম একটিভ হবে।
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                  YouTube Account Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-black outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner"
                  />
                  <Mail className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              </div>

              <button
                onClick={() => handleSubscribe('youtube', 55)}
                disabled={isSubmitting}
                className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'PROCESSING...' : 'CONFIRM PURCHASE - ৳ 55'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'telegram') {
    return (
      <div className="min-h-screen pb-32 bg-[#F8FAFC]">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Telegram Premium
              </h2>
              <p className="text-[8px] font-bold text-sky-600 uppercase tracking-[0.2em]">
                Exclusive Features
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-[32px] text-white shadow-2xl shadow-sky-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30">
                  <Send className="w-8 h-8" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">
                  1 Month Access
                </span>
              </div>
              <h3 className="text-4xl font-black mb-1 tracking-tighter">৳ 550.00</h3>
              <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">
                Premium Subscription
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-sky-50/50 rounded-3xl border border-sky-100/50">
                <h4 className="text-[8px] font-black text-sky-500 uppercase tracking-[0.3em] mb-4">
                  Activation Rules
                </h4>
                <ul className="space-y-3">
                  <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                    Enter your Telegram User ID correctly.
                  </li>
                  <li className="text-[10px] text-slate-600 font-bold flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                    Activation takes up to 24 hours.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">
                  Telegram User ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. 123456789"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-xs font-black outline-none focus:border-sky-500 focus:bg-white transition-all shadow-inner"
                  />
                  <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                </div>
              </div>

              <button
                onClick={() => handleSubscribe('telegram', 550)}
                disabled={isSubmitting}
                className="w-full bg-sky-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-sky-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'PROCESSING...' : 'CONFIRM PURCHASE - ৳ 550'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'meta') {
    return (
      <div className="min-h-screen pb-32 bg-[#F8FAFC]">
        <div className="p-6 pt-12">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setStep('list')}
              className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm border border-slate-100"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                Meta Verified
              </h2>
              <p className="text-[8px] font-bold text-blue-600 uppercase tracking-[0.2em]">
                Official Verification
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[32px] text-white shadow-2xl shadow-blue-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <Facebook className="w-12 h-12" />
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                    <Check className="w-3 h-3" />
                  </div>
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] bg-white/20 px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/30">
                  Official Badge
                </span>
              </div>
              <h3 className="text-3xl font-black mb-1 tracking-tighter uppercase">Meta Verified</h3>
              <p className="text-[8px] opacity-80 font-black uppercase tracking-[0.3em]">
                Identity Verification Service
              </p>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50">
                <h4 className="text-[8px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">
                  Service Details
                </h4>
                <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                  Meta Verified provides account verification with a blue badge, increased account
                  protection, and direct support. To get Meta Verified through us, please contact
                  our developer directly on Telegram for manual processing.
                </p>
              </div>

              <a
                href="https://t.me/your_devlopar"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                <Send className="w-4 h-4" />
                CONTACT DEVELOPER
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <SuccessView
        title="Order Placed"
        subtitle="Subscription request sent"
        onClose={() => {
          setStep('list');
          setEmail('');
          setTelegramId('');
        }}
        colorClass="bg-indigo-600"
        details={[
          { label: 'Status', value: 'Pending Review' },
          { label: 'Time', value: 'Within 24 Hours' },
        ]}
      />
    );
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setView('home')}
              className="p-3 glass rounded-2xl text-slate-700"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-black text-slate-900">Boosting Hub</h2>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="p-3 glass rounded-2xl text-slate-700"
          >
            <History className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(isAdmin ||
            enabledSmmServices.some((s) =>
              ['fb-like', 'fb-star', 'fb-follow', 'tg-member', 'tg-view', 'tg-star'].includes(s),
            )) && (
            <button
              onClick={() => setView('smm-panel')}
              className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group bg-gradient-to-br from-indigo-500/5 to-blue-600/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-all">
                  <Zap className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase">SMM Panel</h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    FB Likes, Stars, TG Members
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          )}

          {(isAdmin || enabledSmmServices.includes('youtube-premium')) && (
            <button
              onClick={() => setStep('youtube')}
              className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:rotate-6 transition-all">
                  <Youtube className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase">YouTube Premium</h3>
                  <p className="text-[10px] text-slate-400 font-bold">৳ 55.00 / Month</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          )}

          {(isAdmin || enabledSmmServices.includes('telegram-premium')) && (
            <button
              onClick={() => setStep('telegram')}
              className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20 group-hover:rotate-6 transition-all">
                  <Send className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Telegram Premium</h3>
                  <p className="text-[10px] text-slate-400 font-bold">৳ 550.00 / Month</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          )}

          {(isAdmin || enabledSmmServices.includes('meta-verified')) && (
            <button
              onClick={() => setStep('meta')}
              className="glass-card border-white/40 shadow-lg p-6 flex items-center justify-between hover:scale-[1.02] transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:rotate-6 transition-all relative">
                  <Check className="w-8 h-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-black text-slate-900 uppercase">Meta Verified</h3>
                  <p className="text-[10px] text-slate-400 font-bold">
                    Blue Badge • Identity Verification
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
          )}
        </div>

        <div className="mt-8 p-6 glass-card border-indigo-100 bg-indigo-50/30">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="w-6 h-6 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 uppercase">Web Bot By Ara</h3>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mb-6 leading-relaxed">
            Get custom web bots and automation tools developed by Ara. High performance and full
            admin control.
          </p>
          <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
}
