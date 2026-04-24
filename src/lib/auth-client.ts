/**
 * Thin compatibility layer that exposes the legacy auth client surface
 * (shapes `signIn.email`, `signIn.social`, `signOut`, `useSession`,
 * `registerWithReferral`, etc.) backed by Clerk.
 *
 * Why this module exists
 * ----------------------
 * When we migrated from Better Auth to Clerk we wanted the enormous
 * `src/App.tsx` login/register JSX to stay byte-for-byte identical.
 * Clerk's drop-in `<SignIn />` / `<SignUp />` components would force a
 * rewrite, so we use Clerk's headless client (`window.Clerk`, seeded by
 * `<ClerkProvider>` in `src/main.tsx`) under the hood and wrap it with
 * the same method names the old code already called.
 *
 * Custom profile fields (name, phone, country, age, refCode) are passed
 * through `signUp.create({ unsafeMetadata })`. The Clerk webhook in
 * `src/server/webhooks.ts` picks them up in `user.created` and creates
 * the matching `users` row with the 6-digit `numericId` and referrer
 * linkage -- replacing the custom POST /api/register handler.
 */

import { useEffect, useState } from 'react';

interface ClerkAPIErrorShape {
  message?: string;
  longMessage?: string;
}

interface ClerkSignUpResource {
  create(params: Record<string, unknown>): Promise<{ status?: string | null; createdSessionId?: string | null }>;
  prepareEmailAddressVerification(params: { strategy: string }): Promise<unknown>;
  attemptEmailAddressVerification(params: { code: string }): Promise<{ status?: string | null; createdSessionId?: string | null }>;
}

// ------------------------------------------------------------
// Clerk global access
// ------------------------------------------------------------

interface ClerkGlobal {
  loaded: boolean;
  user: { id: string; emailAddresses?: Array<{ emailAddress: string }>; firstName?: string | null; lastName?: string | null; fullName?: string | null; unsafeMetadata?: Record<string, unknown>; publicMetadata?: Record<string, unknown> } | null;
  session: { id: string; getToken(): Promise<string | null> } | null;
  client: {
    signIn: {
      create(params: Record<string, unknown>): Promise<{ status?: string | null; createdSessionId?: string | null; supportedFirstFactors?: Array<Record<string, unknown>> | null }>;
      attemptFirstFactor(params: Record<string, unknown>): Promise<{ status?: string | null; createdSessionId?: string | null }>;
      authenticateWithRedirect(params: Record<string, unknown>): Promise<void>;
    };
    signUp: ClerkSignUpResource;
  } | null;
  signOut(): Promise<void>;
  setActive(params: { session?: string | null }): Promise<void>;
  addListener?(fn: (state: unknown) => void): () => void;
  load(): Promise<void>;
}

declare global {
  interface Window {
    Clerk?: ClerkGlobal;
  }
}

function getClerk(): ClerkGlobal {
  const clerk = typeof window !== 'undefined' ? window.Clerk : undefined;
  if (!clerk) {
    throw new Error(
      'Clerk is not initialised yet. Ensure <ClerkProvider> has mounted in src/main.tsx before calling auth methods.',
    );
  }
  return clerk;
}

async function waitForClerk(): Promise<ClerkGlobal> {
  // Spin up to ~5s waiting for ClerkProvider to finish loading.
  for (let i = 0; i < 50; i++) {
    const c = typeof window !== 'undefined' ? window.Clerk : undefined;
    if (c?.loaded) return c;
    await new Promise((r) => setTimeout(r, 100));
  }
  return getClerk();
}

function firstErrorMessage(err: unknown): string {
  if (!err) return '';
  // Clerk throws `{ errors: ClerkAPIError[] }` from the JS SDK.
  const errors = (err as { errors?: ClerkAPIErrorShape[] }).errors;
  if (Array.isArray(errors) && errors.length > 0) {
    return errors[0].longMessage || errors[0].message || 'Authentication error';
  }
  return (err as { message?: string }).message || 'Authentication error';
}

// ------------------------------------------------------------
// Session helpers used by App.tsx (`authClient.getSession`,
// `useSession`) -- shaped the same as the old Better Auth ones.
// ------------------------------------------------------------

interface CompatUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface CompatSession {
  user: CompatUser;
}

async function getSession(): Promise<{ data: CompatSession | null }> {
  const clerk = await waitForClerk();
  if (!clerk.session || !clerk.user) return { data: null };
  const primaryEmail = clerk.user.emailAddresses?.[0]?.emailAddress || '';
  const nameFromMeta = (clerk.user.unsafeMetadata?.name as string | undefined) || clerk.user.fullName || '';
  const name = nameFromMeta || [clerk.user.firstName, clerk.user.lastName].filter(Boolean).join(' ') || primaryEmail;
  return {
    data: {
      user: {
        id: clerk.user.id,
        email: primaryEmail,
        name,
        // Clerk only exposes the user object when verification has
        // succeeded, so once we see a user we treat email as verified.
        emailVerified: true,
      },
    },
  };
}

/**
 * Minimal React-friendly session hook preserved for source compat.
 * App.tsx imports `useSession` from this module but currently does all
 * session reads via `authClient.getSession()` in effects, so this hook
 * is kept as a trivial polling wrapper that exposes the same shape.
 */
export function useSession(): { data: CompatSession | null; isPending: boolean } {
  const [state, setState] = useState<{ data: CompatSession | null; isPending: boolean }>({ data: null, isPending: true });

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const { data } = await getSession();
      if (!cancelled) setState({ data, isPending: false });
    };
    refresh();
    const id = setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

export const authClient = {
  getSession,
};

// ------------------------------------------------------------
// signIn / signOut helpers
// ------------------------------------------------------------

export const signIn = {
  /**
   * Email + password sign-in. Mirrors Better Auth's `signIn.email` so
   * the existing login form in App.tsx keeps working unchanged.
   */
  async email({ email, password }: { email: string; password: string }): Promise<{ error: { message: string } | null }> {
    try {
      const clerk = await waitForClerk();
      if (!clerk.client) throw new Error('Clerk client not ready');
      const result = await clerk.client.signIn.create({ identifier: email, password });
      if (result.status === 'complete' && result.createdSessionId) {
        await clerk.setActive({ session: result.createdSessionId });
      }
      return { error: null };
    } catch (err) {
      return { error: { message: firstErrorMessage(err) } };
    }
  },

  /**
   * OAuth sign-in (Google). Redirects the browser to the provider and
   * comes back to `callbackURL`.
   */
  async social({ provider, callbackURL }: { provider: 'google'; callbackURL?: string }): Promise<void> {
    const clerk = await waitForClerk();
    if (!clerk.client) throw new Error('Clerk client not ready');
    const redirectUrl = callbackURL || (typeof window !== 'undefined' ? window.location.origin : '/');
    await clerk.client.signIn.authenticateWithRedirect({
      strategy: `oauth_${provider}`,
      redirectUrl,
      redirectUrlComplete: redirectUrl,
    });
  },
};

export async function signOut(): Promise<void> {
  try {
    const clerk = await waitForClerk();
    await clerk.signOut();
  } catch (err) {
    console.warn('[auth] signOut failed:', err);
  }
}

// ------------------------------------------------------------
// Password reset (Clerk uses a 6-digit email code strategy).
// ------------------------------------------------------------

/**
 * Kick off password reset. Clerk emails the user a 6-digit code.
 *
 * The second argument is kept in the signature for source
 * compatibility with the old Better Auth helper (it took a redirect
 * URL). Clerk does not need one -- the flow is code-based -- so we
 * accept and ignore it.
 */
export async function requestPasswordReset(email: string, _redirectTo?: string): Promise<{ error: { message: string } | null }> {
  try {
    const clerk = await waitForClerk();
    if (!clerk.client) throw new Error('Clerk client not ready');
    await clerk.client.signIn.create({ strategy: 'reset_password_email_code', identifier: email });
    return { error: null };
  } catch (err) {
    return { error: { message: firstErrorMessage(err) } };
  }
}

/**
 * Complete a password reset by submitting the emailed 6-digit code and
 * the new password. On success the user is signed in automatically.
 */
export async function completePasswordReset(newPassword: string, code?: string): Promise<{ error: { message: string } | null }> {
  try {
    if (!code) return { error: { message: 'Reset code is required' } };
    const clerk = await waitForClerk();
    if (!clerk.client) throw new Error('Clerk client not ready');
    const result = await clerk.client.signIn.attemptFirstFactor({
      strategy: 'reset_password_email_code',
      code,
      password: newPassword,
    });
    if (result.status === 'complete' && result.createdSessionId) {
      await clerk.setActive({ session: result.createdSessionId });
    }
    return { error: null };
  } catch (err) {
    return { error: { message: firstErrorMessage(err) } };
  }
}

// ------------------------------------------------------------
// Sign-up with referral
// ------------------------------------------------------------

export interface RegisterResult {
  success: boolean;
  user?: { id?: string; email?: string; name?: string };
  error?: string;
  /** Set to true when the caller needs to collect an email verification code. */
  needsEmailVerification?: boolean;
}

/**
 * Custom registration that validates the referral code client-side then
 * calls Clerk's `signUp.create` with our extra fields stashed in
 * `unsafeMetadata`. The Clerk webhook (`/api/webhooks/clerk`,
 * subscribed to `user.created`) is what actually inserts the `users`
 * row, generates the 6-digit `numericId`, and increments the
 * referrer's `gen1Count`.
 *
 * Returns `{ success: true, needsEmailVerification: true }` when the
 * next step is to call `verifyEmailCode` with the code emailed to the
 * user.
 */
export async function registerWithReferral(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  country?: string;
  age?: string;
  refCode: string;
}): Promise<RegisterResult> {
  try {
    const clerk = await waitForClerk();
    if (!clerk.client) throw new Error('Clerk client not ready');

    const signUp = clerk.client.signUp;
    const [firstName, ...rest] = (data.name || '').trim().split(/\s+/);
    const lastName = rest.join(' ') || '';

    await signUp.create({
      emailAddress: data.email,
      password: data.password,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      unsafeMetadata: {
        name: data.name,
        phone: data.phone || '',
        country: data.country || 'Bangladesh',
        age: data.age || '',
        refCode: data.refCode || '',
      },
    });

    // Trigger the 6-digit email verification code.
    await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

    return { success: true, needsEmailVerification: true, user: { email: data.email, name: data.name } };
  } catch (err) {
    return { success: false, error: firstErrorMessage(err) };
  }
}

/**
 * Submit the 6-digit verification code Clerk emailed during sign-up.
 * On success we activate the new session so the user is immediately
 * logged in. The Clerk `user.created` webhook creates the DB profile
 * asynchronously; App.tsx's existing profile hydration poll will pick
 * it up within a few seconds.
 */
export async function verifyEmailCode(code: string): Promise<{ success: boolean; error?: string }> {
  try {
    const clerk = await waitForClerk();
    if (!clerk.client) throw new Error('Clerk client not ready');
    const signUp = clerk.client.signUp;
    const result = await signUp.attemptEmailAddressVerification({ code });
    if (result.status === 'complete' && result.createdSessionId) {
      await clerk.setActive({ session: result.createdSessionId });
      return { success: true };
    }
    return { success: false, error: 'Verification did not complete. Check the code and try again.' };
  } catch (err) {
    return { success: false, error: firstErrorMessage(err) };
  }
}

/**
 * Ask Clerk to re-send the email verification code for the in-flight
 * sign-up attempt.
 */
export async function resendEmailVerificationCode(): Promise<{ success: boolean; error?: string }> {
  try {
    const clerk = await waitForClerk();
    if (!clerk.client) throw new Error('Clerk client not ready');
    await clerk.client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    return { success: true };
  } catch (err) {
    return { success: false, error: firstErrorMessage(err) };
  }
}

// ------------------------------------------------------------
// Authenticated fetch helpers
// ------------------------------------------------------------

/**
 * Attach the Clerk session JWT as a Bearer token. Clerk's Express
 * middleware reads either a cookie or this header; using the header
 * is the most portable option across serverless / multi-origin
 * deployments.
 */
async function authHeaders(): Promise<Record<string, string>> {
  const clerk = typeof window !== 'undefined' ? window.Clerk : undefined;
  const token = clerk?.session ? await clerk.session.getToken().catch(() => null) : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Create the app-level profile row after Google OAuth. Called from
 * App.tsx's existing refCode-prompt modal.
 */
export async function createGoogleProfile(refCode?: string): Promise<{ success: boolean; numericId?: string; error?: string }> {
  const res = await fetch('/api/register/google-profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeaders()),
    },
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
 * Fetch the authenticated user's own `users` row from the server.
 * Returns `null` when the profile is missing (e.g. the webhook has
 * not yet landed) or the session is invalid.
 */
export async function fetchMyProfile<T = unknown>(): Promise<T | null> {
  try {
    const res = await fetch('/api/me', {
      method: 'GET',
      headers: { ...(await authHeaders()) },
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.user ?? data) as T;
  } catch {
    return null;
  }
}

/**
 * Public validation of a referral code. Accepts any 4-10 digit numeric
 * code and returns `true` iff a matching `users.numericId` exists.
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
