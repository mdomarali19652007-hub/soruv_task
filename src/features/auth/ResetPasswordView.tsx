import { useEffect, useState, type FormEvent } from 'react';
import { Lock, Loader2, CheckCircle2, Mail } from 'lucide-react';
import { requestPasswordReset, completePasswordReset } from '../../lib/auth-client';

type Step = 'email' | 'verify' | 'done';

interface Props {
  /** Called when the user is done and wants to return to login. */
  onReturnToLogin: () => void;
  /** Optional email pre-fill (from the login form). */
  initialEmail?: string;
}

/**
 * Password reset view -- Clerk code-based flow.
 *
 * The user enters their email, Clerk sends a 6-digit code, they enter
 * that code plus a new password, and we finalise the reset. Unlike the
 * old Better Auth token link there is no `/reset-password?token=...`
 * URL anymore; this view can be rendered as a modal from the login
 * screen.
 */
export function ResetPasswordView({ onReturnToLogin, initialEmail = '' }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  async function onRequestCode(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setSubmitting(true);
    const { error } = await requestPasswordReset(email);
    setSubmitting(false);
    if (error) {
      // Keep the message generic to avoid leaking whether the email
      // is registered (enumeration defence). Log the real error.
      console.warn('[reset] requestPasswordReset failed:', error);
    }
    setStep('verify');
  }

  async function onVerify(e: FormEvent) {
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
    if (!/^\d{4,10}$/.test(code.trim())) {
      setErrorMsg('Enter the verification code from your email.');
      return;
    }
    setSubmitting(true);
    const { error } = await completePasswordReset(password, code.trim());
    setSubmitting(false);
    if (error) {
      setErrorMsg(error.message || 'The code is invalid or has expired.');
      return;
    }
    setStep('done');
    window.history.replaceState({}, '', '/');
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">Password updated</h1>
        <p className="text-sm text-slate-500 mb-8 max-w-sm">
          You are signed in with your new password.
        </p>
        <button
          onClick={onReturnToLogin}
          className="w-full max-w-xs py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Continue
        </button>
      </div>
    );
  }

  if (step === 'email') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-indigo-500" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Reset password</h1>
            <p className="text-sm text-slate-500 mt-2 text-center">
              Enter your email. We will send you a 6-digit code.
            </p>
          </div>

          <form onSubmit={onRequestCode} className="space-y-4">
            <label className="block">
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
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
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Sending…' : 'Send reset code'}
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

  // step === 'verify'
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-white">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">Reset password</h1>
          <p className="text-sm text-slate-500 mt-2 text-center">
            If an account exists for {email || 'that email'}, we sent a 6-digit code.
          </p>
        </div>

        <form onSubmit={onVerify} className="space-y-4">
          <label className="block">
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Verification code</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="one-time-code"
              required
              className="mt-1 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm tracking-widest focus:outline-none focus:border-indigo-500"
            />
          </label>

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
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Updating…' : 'Update password'}
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
