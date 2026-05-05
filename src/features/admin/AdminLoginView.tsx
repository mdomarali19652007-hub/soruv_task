/**
 * AdminLoginView -- dedicated sign-in surface for the admin shell.
 *
 * Rationale:
 *   The consumer login at [`src/App.tsx`](src/App.tsx:1108) is built for
 *   end-users (referral codes, country picker, Google sign-up, "join the
 *   global network" copy, light pastel palette). Showing the same form
 *   on `admin.<host>` is confusing and visually inconsistent with the
 *   navy admin shell unified in PR #67. This view is a small, focused
 *   admin-only login: email + password, no registration, no social
 *   sign-in, restrained navy theme that matches `admin-shell` so the
 *   UX feels unmistakably like an operator console without being
 *   over-the-top.
 *
 * The view stays a presentational component -- the actual `signIn.email`
 * call and any post-login navigation is owned by `App.tsx`, mirroring
 * how the consumer `loginView` is wired. We accept submit + reset
 * callbacks plus controlled inputs so App keeps a single auth code path.
 */

import { useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Server,
} from 'lucide-react';

export interface AdminLoginViewProps {
  email: string;
  password: string;
  onEmailChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: () => void | Promise<void>;
  onForgotPassword: () => void | Promise<void>;
  /**
   * Optional Google OAuth handler. When provided a "Continue with
   * Google" button is rendered above the email/password form. The
   * underlying Clerk session still needs the resulting user to be
   * marked `isAdmin = true` for App.tsx to actually route to the
   * admin shell — Google is just an additional sign-in factor for
   * existing operators.
   */
  onGoogleSignIn?: () => void | Promise<void>;
  isSubmitting?: boolean;
  /** Optional product / build label rendered in the footer. */
  buildTag?: string;
}

export function AdminLoginView({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
  onGoogleSignIn,
  isSubmitting = false,
  buildTag = 'Admin Console',
}: AdminLoginViewProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    void onSubmit();
  };

  return (
    <div
      key="admin-login"
      className="admin-shell min-h-screen w-full relative overflow-hidden bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-10"
    >
      {/* Background: subtle dot grid + soft radial glow. Restrained -- no
          animated blobs, no gradient party. Just enough texture to
          differentiate from a flat sign-in form. */}
      <div
        className="absolute inset-0 opacity-[0.18] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(148, 163, 184, 0.35) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[640px] h-[640px] bg-blue-500/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[480px] h-[480px] bg-indigo-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Top status strip -- a small operator-console flourish. */}
      <div className="absolute top-0 inset-x-0 border-b border-slate-800/70 bg-slate-950/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-2.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
            <span>Secure Channel</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-500">
            <Server className="w-3 h-3" />
            <span>{buildTag}</span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Card */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
          {/* Hairline accent on top edge */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

          <div className="p-7 sm:p-8">
            {/* Header */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-inner">
                <ShieldCheck
                  className="w-5 h-5 text-blue-400"
                  strokeWidth={2.25}
                />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400/80">
                  Admin Console
                </p>
                <h1 className="text-lg font-semibold text-slate-100 leading-tight">
                  Operator Sign-in
                </h1>
              </div>
            </div>

            <p className="text-[12px] text-slate-400 leading-relaxed mb-6">
              Restricted access. Authorized personnel only. All sessions are
              logged for audit.
            </p>

            {onGoogleSignIn && (
              <>
                <button
                  type="button"
                  onClick={() => void onGoogleSignIn()}
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-white hover:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 text-sm font-semibold py-3 rounded-lg border border-slate-200 shadow-sm transition-colors"
                >
                  <GoogleMark />
                  <span>Continue with Google</span>
                </button>
                <div className="flex items-center gap-3 my-5 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                  <div className="h-px flex-1 bg-slate-800/80" />
                  <span>or</span>
                  <div className="h-px flex-1 bg-slate-800/80" />
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Operator ID
                </span>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    autoComplete="username"
                    spellCheck={false}
                    placeholder="admin@domain.tld"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-3 pl-10 pr-3 text-sm font-mono tracking-tight text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  />
                </div>
              </label>

              {/* Password field */}
              <label className="block">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Passphrase
                </span>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg py-3 pl-10 pr-11 text-sm font-mono tracking-tight text-slate-100 placeholder:text-slate-600 outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </label>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  <Lock className="w-3 h-3" />
                  <span>TLS · session-bound</span>
                </div>
                <button
                  type="button"
                  onClick={() => void onForgotPassword()}
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Reset access
                </button>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold tracking-wide py-3 rounded-lg shadow-[0_10px_30px_-12px_rgba(59,130,246,0.7)] transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card footer */}
          <div className="px-7 sm:px-8 py-4 border-t border-slate-800/80 rounded-b-2xl bg-slate-950/40">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Unauthorized attempts are recorded. If you do not recognize this
              console, close this tab.
            </p>
          </div>
        </div>

        {/* Footer line under card */}
        <div className="flex items-center justify-center mt-6 text-[10px] uppercase tracking-[0.25em] text-slate-600">
          <span>Internal · Not for public use</span>
        </div>
      </motion.div>
    </div>
  );
}

/** Inline Google "G" mark — keeps the brand colours so the button is
 *  recognisable without depending on a separate asset. */
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
      <path fill="none" d="M0 0h48v48H0z" />
    </svg>
  );
}
