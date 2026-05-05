/**
 * NoticesAdminPanel — admin UI for managing the rotating notice
 * marquee that sits on top of the HomeView welcome banner.
 *
 * Lives in its own module so the giant `AdminView.tsx` stays focused
 * on the existing tabs. Reads the realtime-subscribed `notices` list
 * from props and goes through the existing `adminInsert / Update /
 * Delete` server helpers (which bypass RLS) for mutations.
 */
import { useState } from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { adminInsert, adminUpdate, adminDelete } from '../../lib/admin-api';
import { handleListenerError as handleFirestoreError } from '../../utils/db-errors';
import { OperationType } from '../../types';
import type { Notice, NoticeLanguage } from '../../types';

interface Props {
  notices: Notice[];
}

export function NoticesAdminPanel({ notices }: Props) {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState<NoticeLanguage>('bn');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    const body = text.trim();
    if (!body) {
      setError('Notice text cannot be empty.');
      return;
    }
    if (body.length > 500) {
      setError('Notice text must be 500 characters or fewer.');
      return;
    }
    setIsSaving(true);
    try {
      // The DB columns are snake_case (`is_active`, `created_at`).
      await adminInsert('notices', {
        text: body,
        language,
        is_active: isActive,
      });
      setText('');
      setIsActive(true);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'notices');
      setError(e instanceof Error ? e.message : 'Failed to save notice');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (n: Notice) => {
    try {
      await adminUpdate('notices', n.id, { is_active: !n.isActive });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `notices/${n.id}`);
    }
  };

  const remove = async (n: Notice) => {
    if (!confirm('Delete this notice?')) return;
    try {
      await adminDelete('notices', n.id);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `notices/${n.id}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create notice */}
      <div className="glass-card border-white/40 shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              New Notice
            </h3>
            <p className="text-[10px] text-slate-400 font-bold">
              Shown on the home screen marquee
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
              Notice Text (Bangla or English)
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              rows={3}
              dir="auto"
              placeholder="e.g. New offer: 10% bonus on all withdrawals this week!"
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-900 outline-none focus:border-indigo-500"
            />
            <p className="mt-1 text-[10px] text-slate-400 text-right">
              {text.length}/500
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                Language
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['bn', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`h-10 rounded-xl border-2 text-xs font-bold uppercase tracking-widest transition-all ${
                      language === lang
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {lang === 'bn' ? 'বাংলা' : 'English'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                Status
              </label>
              <button
                type="button"
                onClick={() => setIsActive((v) => !v)}
                className={`w-full h-10 rounded-xl border-2 text-xs font-bold uppercase tracking-widest transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-500'
                }`}
              >
                {isActive ? 'Active' : 'Hidden'}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Add Notice'}
          </button>
        </div>
      </div>

      {/* Existing notices */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">
          Manage Notices
        </h3>
        {notices.length === 0 ? (
          <div className="glass-card border-white/40 shadow-sm p-6 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
            No notices yet
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n.id}
              className="glass-card border-white/40 shadow-sm p-4 flex items-center gap-3"
            >
              <span
                className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  n.isActive
                    ? 'bg-amber-500/15 text-amber-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Megaphone className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 line-clamp-2" dir="auto">
                  {n.text}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400 flex items-center gap-2">
                  <span className="uppercase tracking-wider">{n.language}</span>
                  <span>•</span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </p>
              </div>
              <button
                onClick={() => toggleActive(n)}
                className={`shrink-0 px-3 h-9 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  n.isActive
                    ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {n.isActive ? 'Active' : 'Hidden'}
              </button>
              <button
                onClick={() => remove(n)}
                aria-label="Delete notice"
                className="shrink-0 p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
