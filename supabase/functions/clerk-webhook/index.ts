// deno-lint-ignore-file no-explicit-any
/**
 * Supabase Edge Function: clerk-webhook
 *
 * Receives Clerk webhooks (`user.created`, `user.deleted`) and mirrors
 * those events into the app `users` table. Replaces the old
 * `POST /api/register` flow: by the time Clerk fires `user.created`
 * the auth account is real, so we create the profile row atomically
 * here instead of relying on a client round-trip after sign-up.
 *
 * Endpoint (after `supabase functions deploy clerk-webhook`):
 *   https://<project-ref>.supabase.co/functions/v1/clerk-webhook
 *
 * Point the Clerk dashboard webhook at that URL, subscribe to
 * `user.created` and `user.deleted`, copy the signing secret and set
 * it as a function secret:
 *
 *   supabase secrets set \
 *     CLERK_WEBHOOK_SECRET=whsec_xxx \
 *     CLERK_SECRET_KEY=sk_test_xxx \
 *     SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *     SUPABASE_URL=https://<ref>.supabase.co \
 *     APP_PUBLIC_URL=https://your-app.example.com
 *
 * Deno runtime -- NO `@clerk/express` here. We talk to Clerk's REST
 * API directly (only needed for the "delete Clerk user after bad
 * refCode" cascade path) and to Supabase via `supabase-js`.
 */

// Supabase edge functions run on Deno. `npm:` specifiers are supported;
// we keep them pinned to exact versions for reproducibility.
import { Webhook, WebhookVerificationError } from 'npm:svix@1.42.0';
import { createClient } from 'npm:@supabase/supabase-js@2.103.3';

// ------------------------------------------------------------
// Types (mirror the fields we read from the Clerk payload)
// ------------------------------------------------------------

interface ClerkWebhookUser {
  id: string;
  email_addresses?: Array<{ email_address?: string }>;
  first_name?: string | null;
  last_name?: string | null;
  unsafe_metadata?: Record<string, unknown>;
  public_metadata?: Record<string, unknown>;
}

interface ClerkWebhookEnvelope {
  type: string;
  data: ClerkWebhookUser;
}

// ------------------------------------------------------------
// Env
// ------------------------------------------------------------

function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const WEBHOOK_SECRET = requireEnv('CLERK_WEBHOOK_SECRET');
const CLERK_SECRET_KEY = Deno.env.get('CLERK_SECRET_KEY') ?? '';
const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
const APP_PUBLIC_URL = Deno.env.get('APP_PUBLIC_URL') ?? 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ------------------------------------------------------------
// Clerk helpers (just the REST calls we need)
// ------------------------------------------------------------

async function deleteClerkUser(userId: string): Promise<void> {
  if (!CLERK_SECRET_KEY) {
    console.warn('[clerk-webhook] CLERK_SECRET_KEY missing -- cannot cascade-delete', userId);
    return;
  }
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    console.error('[clerk-webhook] Failed to delete Clerk user', userId, res.status, await res.text());
  }
}

// ------------------------------------------------------------
// Profile helpers
// ------------------------------------------------------------

async function generateUniqueNumericId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString();
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('numericId', candidate)
      .limit(1);
    if (!existing || existing.length === 0) return candidate;
  }
  return '';
}

async function resolveReferrerId(refCode: string): Promise<{ ok: boolean; referrerId: string }> {
  if (refCode) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('numericId', refCode)
      .limit(1);
    if (error || !data || data.length === 0) {
      return { ok: false, referrerId: '' };
    }
    return { ok: true, referrerId: data[0].id };
  }

  // Bootstrap: allow a missing refCode only if the users table is empty.
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });
  if (count && count > 0) {
    return { ok: false, referrerId: '' };
  }
  return { ok: true, referrerId: '' };
}

async function insertProfile(params: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  age: number;
  referrerId: string;
}): Promise<{ ok: boolean; numericId: string; error?: string }> {
  let numericId = await generateUniqueNumericId();
  if (!numericId) return { ok: false, numericId: '', error: 'Failed to generate unique ID' };

  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('users').upsert({
      id: params.userId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      country: params.country,
      age: params.age,
      numericId,
      referralCode: numericId,
      referralLink: `${APP_PUBLIC_URL}?ref=${numericId}`,
      referredBy: params.referrerId,
      mainBalance: 0,
      totalEarned: 0,
      pendingPayout: 0,
      isActive: false,
      rank: 'Bronze',
      dailyClaimed: false,
      notifications: [],
      taskHistory: [],
      achievements: [
        { id: '1', title: 'First Task', progress: 0, goal: 1 },
        { id: '2', title: 'Team Builder', progress: 0, goal: 10 },
      ],
      adWatches: [],
      referralActiveCount: 0,
      gen1Count: 0,
      totalCommission: 0,
      socialSubmissions: [],
      status: 'active',
      activationDate: '',
      activationExpiry: '',
      restrictionReason: '',
      suspensionUntil: '',
    });

    if (!error) return { ok: true, numericId };

    // 23505 = unique_violation on numericId -- regenerate and retry.
    if ((error as { code?: string }).code === '23505') {
      numericId = Math.floor(100000 + Math.random() * 900000).toString();
      continue;
    }
    return { ok: false, numericId, error: (error as any).message || 'insert failed' };
  }

  return { ok: false, numericId, error: 'numericId retry exhausted' };
}

// ------------------------------------------------------------
// Event handlers
// ------------------------------------------------------------

async function handleUserCreated(data: ClerkWebhookUser): Promise<void> {
  const meta = (data.unsafe_metadata || {}) as {
    name?: string;
    phone?: string;
    country?: string;
    age?: string;
    refCode?: string;
  };
  const email = data.email_addresses?.[0]?.email_address || '';
  const composedName =
    meta.name ||
    [data.first_name, data.last_name].filter(Boolean).join(' ') ||
    email ||
    'User';

  // Google OAuth users land here without a refCode -- they are
  // prompted for one by the client, which then calls
  // /api/register/google-profile. Only proactively create the DB row
  // when we have a refCode already (email/password signup path).
  const refCode = (meta.refCode || '').trim();
  if (!refCode) {
    console.log(`[clerk-webhook] user.created ${data.id} -- no refCode, deferring to google-profile`);
    return;
  }

  const { ok: refOk, referrerId } = await resolveReferrerId(refCode);
  if (!refOk) {
    console.warn(`[clerk-webhook] Invalid refCode for ${data.id}; deleting Clerk account`);
    await deleteClerkUser(data.id);
    return;
  }

  const insert = await insertProfile({
    userId: data.id,
    name: composedName,
    email,
    phone: meta.phone || '',
    country: meta.country || 'Bangladesh',
    age: parseInt(meta.age || '18', 10) || 18,
    referrerId,
  });

  if (!insert.ok) {
    console.error(`[clerk-webhook] Failed to create profile for ${data.id}: ${insert.error}`);
    await deleteClerkUser(data.id);
    return;
  }

  if (referrerId) {
    const { error: rpcErr } = await supabase.rpc('increment_field', {
      p_table: 'users',
      p_id: referrerId,
      p_column: 'gen1Count',
      p_amount: 1,
    });
    if (rpcErr) console.warn('[clerk-webhook] gen1Count rpc failed:', rpcErr);
  }

  console.log(`[clerk-webhook] Created profile ${data.id} numericId=${insert.numericId} ref=${refCode}`);
}

async function handleUserUpdated(data: ClerkWebhookUser): Promise<void> {
  // We only sync the handful of fields that Clerk owns authoritatively
  // (email, display name). Everything else -- balances, referrals,
  // status flags -- is app-owned and must not be overwritten here.
  const email = data.email_addresses?.[0]?.email_address;
  const meta = (data.unsafe_metadata || {}) as { name?: string };
  const composedName =
    meta.name ||
    [data.first_name, data.last_name].filter(Boolean).join(' ') ||
    undefined;

  const patch: Record<string, unknown> = {};
  if (email) patch.email = email;
  if (composedName) patch.name = composedName;

  if (Object.keys(patch).length === 0) {
    return;
  }

  const { error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', data.id);

  if (error) {
    console.warn(`[clerk-webhook] Failed to sync user.updated for ${data.id}:`, error);
    return;
  }

  console.log(`[clerk-webhook] Synced user.updated for ${data.id} (${Object.keys(patch).join(', ')})`);
}

async function handleUserDeleted(data: ClerkWebhookUser): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', data.id);
  if (error) console.warn(`[clerk-webhook] Failed to delete users row for ${data.id}:`, error);
}

// ------------------------------------------------------------
// HTTP entrypoint
// ------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const svixId = req.headers.get('svix-id') || '';
  const svixTimestamp = req.headers.get('svix-timestamp') || '';
  const svixSignature = req.headers.get('svix-signature') || '';
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response(JSON.stringify({ error: 'Missing Svix headers' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  // CRITICAL: verify against the raw body, not the parsed JSON.
  const rawBody = await req.text();

  let evt: ClerkWebhookEnvelope;
  try {
    const wh = new Webhook(WEBHOOK_SECRET);
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEnvelope;
  } catch (err) {
    const detail = err instanceof WebhookVerificationError ? err.message : String(err);
    console.warn('[clerk-webhook] Signature verification failed:', detail);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        // Not subscribed to this event -- acknowledge.
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    console.error('[clerk-webhook] Handler threw:', err);
    // Return 200 so Clerk does not retry forever; the error is logged.
    return new Response(JSON.stringify({ received: true, error: 'handler-failure' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
});
