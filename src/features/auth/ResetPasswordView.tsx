import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Lock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { completePasswordReset } from '../../lib/auth-client';

type Status = 'idle' | 'submitting' | 'done' | 'error' | 'missing-token';

interface Props {
  /** Called when the user is done and wants to return to login. */
  onReturnToLogin: () => void;
}

/**
 * `/reset-password` SPA view.
 *
 * Entered from the link sent in the password-reset email. Extracts the
 * Better Auth token from the URL query string, lets the user pick a new
 * password, and calls the Better Auth reset endpoint.
 *
 * Wiring: `src/App.tsx` detects `window.location.pathname === '/reset-password'`
 * at startup and switches to this view. This avoids adding a router
 * dependency for a single route.
 */
export function ResetPasswordView({ onReturnToLogin }: Props) {
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || '';
  }, []);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>(token ? 'idle' : 'missing-token');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Scroll to top when the view mounts.
    window.scrollTo(0, 0);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    try {
      const { error } = await completePasswordReset(password, token);
      if (error) {
        setStatus('error');
        setErrorMsg(error.message || 'Reset link is invalid or has expired.');
        return;
      }
      setStatus('done');
      // Clear token from the URL so refreshes do not re-submit.
      window.history.replaceState({}, '', '/');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    }
  }

  if (status === 'missing-token') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">Invalid reset link</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-sm">
          No reset token was found. Please open the reset link from your email again, or request a new one.
        </p>
        <button
          onClick={onReturnToLogin}
          className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Back to login
        </button>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">Password updated</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-sm">
          You can now sign in with your new password.
        </p>
        <button
          onClick={onReturnToLogin}
          className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Continue to login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Reset password</h1>
          <p className="text-sm text-slate-500 mt-2 text-center">Choose a new password for your account.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:border-indigo-500"
            />
          </label>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === 'submitting' && <Loader2 className="w-4 h-4 animate-spin" />}
            {status === 'submitting' ? 'Updating…' : 'Update password'}
          </button>

          <button
            type="button"
            onClick={onReturnToLogin}
            className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
