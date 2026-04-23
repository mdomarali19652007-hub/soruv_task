import { useState, type FormEvent } from 'react';
import { Mail, Loader2 } from 'lucide-react';
import { verifyEmailCode, resendEmailVerificationCode } from '../../lib/auth-client';

interface Props {
  onVerified: () => void;
  onCancel: () => void;
}

/**
 * Overlay shown after `registerWithReferral()` when Clerk still needs
 * the user to confirm ownership of the email by entering the 6-digit
 * code we just emailed. On success we activate the new session; the
 * Clerk `user.created` webhook inserts the DB profile asynchronously
 * and App.tsx's polling hydration picks it up within a few seconds.
 */
export function EmailVerificationOverlay({ onVerified, onCancel }: Props) {
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sent' | 'sending'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    if (!/^\d{4,10}$/.test(code.trim())) {
      setErrorMsg('Enter the 6-digit code from your email.');
      return;
    }
    setSubmitting(true);
    const result = await verifyEmailCode(code.trim());
    setSubmitting(false);
    if (!result.success) {
      setErrorMsg(result.error || 'Verification failed. Check the code and try again.');
      return;
    }
    onVerified();
  }

  async function onResend() {
    setResendState('sending');
    const r = await resendEmailVerificationCode();
    setResendState(r.success ? 'sent' : 'idle');
    if (!r.success) setErrorMsg(r.error || 'Could not resend the code.');
  }

  return (
    <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
        <Mail className="w-12 h-12 text-indigo-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-widest">VERIFY YOUR EMAIL</h2>
      <p className="text-sm text-slate-500 mb-8 leading-relaxed max-w-sm">
        We sent a 6-digit verification code to your email. Enter it below to finish creating your account.
      </p>

      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="123456"
          autoComplete="one-time-code"
          required
          className="w-full px-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-center text-lg font-black tracking-[0.5em] focus:outline-none focus:border-indigo-500"
        />

        {errorMsg && (
          <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3 text-left">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? 'Verifying…' : 'Verify & continue'}
        </button>

        <button
          type="button"
          onClick={onResend}
          disabled={resendState === 'sending'}
          className="w-full py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-60"
        >
          {resendState === 'sending' && 'Sending…'}
          {resendState === 'idle' && 'RESEND CODE'}
          {resendState === 'sent' && 'CODE RESENT'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest"
        >
          Cancel and try again
        </button>
      </form>
    </div>
  );
}
