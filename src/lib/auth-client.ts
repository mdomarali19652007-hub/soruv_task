import { createAuthClient } from 'better-auth/react';
import { adminClient } from 'better-auth/client/plugins';

/**
 * Better Auth React client.
 *
 * Communicates with the Express server at /api/auth for all auth operations.
 * Session is cookie-based and DB-backed for instant revocation.
 *
 * Key method mapping from Supabase Auth:
 *   supabase.auth.signUp             -> authClient.signUp.email
 *   supabase.auth.signInWithPassword -> authClient.signIn.email
 *   supabase.auth.signInWithOAuth    -> authClient.signIn.social
 *   supabase.auth.signOut            -> authClient.signOut
 *   supabase.auth.getSession         -> authClient.getSession / useSession
 */
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: '/api/auth',
  plugins: [adminClient()],
});

// Export typed hooks and methods for use in components
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

/**
 * Request a password reset email.
 * Uses Better Auth's forgetPassword endpoint.
 *
 * NOTE: This will only work once an email transport (e.g. Resend, SMTP)
 * is configured in the Better Auth server config (src/server/auth.ts).
 * Without it, Better Auth cannot deliver the reset link.
 */
export async function requestPasswordReset(email: string, redirectTo?: string) {
  return authClient.forgetPassword({
    email,
    redirectTo: redirectTo || `${window.location.origin}/reset-password`,
  });
}

/**
 * Complete password reset with token.
 * Uses Better Auth's resetPassword endpoint.
 *
 * NOTE: Requires a frontend route at /reset-password that extracts the
 * token from the URL and calls this function.  Currently the app uses
 * state-based navigation (setView) so this route does not exist yet.
 */
export async function completePasswordReset(newPassword: string, token?: string) {
  return authClient.resetPassword({
    newPassword,
    token,
  });
}

/**
 * Custom registration that includes referral code validation.
 * Calls our custom /api/register endpoint instead of Better Auth's built-in signUp.
 */
export async function registerWithReferral(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  country?: string;
  age?: string;
  refCode: string;
}): Promise<{ success: boolean; user?: any; error?: string }> {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  const result = await res.json();

  if (!res.ok) {
    return { success: false, error: result.error || 'Registration failed' };
  }

  return { success: true, user: result.user };
}

/**
 * Create Google OAuth profile with referral code after OAuth redirect.
 */
export async function createGoogleProfile(refCode?: string): Promise<{ success: boolean; numericId?: string; error?: string }> {
  const res = await fetch('/api/register/google-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refCode: refCode || '' }),
  });

  const result = await res.json();

  if (!res.ok) {
    return { success: false, error: result.error };
  }

  return { success: true, numericId: result.numericId };
}

/**
 * Validate a referral code (public, no auth required).
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  try {
    const res = await fetch('/api/validate-referral', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const result = await res.json();
    return result.valid === true;
  } catch {
    return false;
  }
}
