/**
 * Clerk webhook handler.
 *
 * Subscribes to `user.created` and `user.deleted` from the Clerk
 * dashboard and mirrors those events into our Supabase `users` table.
 * This replaces the old POST /api/register endpoint -- by the time
 * Clerk fires `user.created` the auth account is already real, so we
 * do the DB insert atomically here instead of relying on a client
 * round-trip after signup.
 *
 * Security: the Clerk dashboard signs the webhook with a secret
 * (CLERK_WEBHOOK_SECRET) using Svix. We MUST verify the signature
 * against the raw request body before trusting anything in the
 * payload, because the endpoint is public.
 */

import { Router, type Request, type Response } from 'express';
import { Webhook } from 'svix';
import { supabaseAdmin } from './supabase-admin.js';
import { createClerkClient } from '@clerk/express';

const router: Router = Router();

// We reuse a single clerkClient instance so we can delete the Clerk
// auth account if we decide the DB row cannot be created (e.g. the
// submitted referral code turns out to be invalid).
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// ------------------------------------------------------------
// Referral link base
// ------------------------------------------------------------

function referralLinkBase(): string {
  return process.env.APP_PUBLIC_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000';
}

// ------------------------------------------------------------
// Profile insert helpers
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

async function generateUniqueNumericId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = Math.floor(100000 + Math.random() * 900000).toString();
    const { data: existing } = await supabaseAdmin
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
    const { data, error } = await supabaseAdmin
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
  const { count } = await supabaseAdmin
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
    const { error } = await supabaseAdmin.from('users').upsert({
      id: params.userId,
      name: params.name,
      email: params.email,
      phone: params.phone,
      country: params.country,
      age: params.age,
      numericId,
      referralCode: numericId,
      referralLink: `${referralLinkBase()}?ref=${numericId}`,
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

    return { ok: false, numericId, error: (error as { message?: string }).message || 'insert failed' };
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

  // Google OAuth users land here without a refCode -- they will be
  // prompted for one by the client, which then calls
  // /api/register/google-profile. We only proactively create the DB
  // row when the metadata already has a valid refCode (email/password
  // signup path).
  const refCode = (meta.refCode || '').trim();
  if (!refCode) {
    console.log(`[clerk-webhook] user.created ${data.id} -- no refCode in metadata, deferring to google-profile flow`);
    return;
  }

  const { ok: refOk, referrerId } = await resolveReferrerId(refCode);
  if (!refOk) {
    console.warn(`[clerk-webhook] Invalid referral code for new user ${data.id}; deleting Clerk account to stay consistent`);
    try {
      await clerkClient.users.deleteUser(data.id);
    } catch (err) {
      console.error('[clerk-webhook] Failed to delete Clerk user after bad refCode:', err);
    }
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
    try {
      await clerkClient.users.deleteUser(data.id);
    } catch (err) {
      console.error('[clerk-webhook] Failed to cascade-delete Clerk user:', err);
    }
    return;
  }

  if (referrerId) {
    await supabaseAdmin
      .rpc('increment_field', {
        p_table: 'users',
        p_id: referrerId,
        p_column: 'gen1Count',
        p_amount: 1,
      })
      .then(({ error }) => {
        if (error) console.warn('[clerk-webhook] gen1Count rpc failed:', error);
      });
  }

  console.log(`[clerk-webhook] Created profile ${data.id} numericId=${insert.numericId} ref=${refCode}`);
}

async function handleUserDeleted(data: ClerkWebhookUser): Promise<void> {
  const { error } = await supabaseAdmin.from('users').delete().eq('id', data.id);
  if (error) console.warn(`[clerk-webhook] Failed to delete users row for ${data.id}:`, error);
}

// ------------------------------------------------------------
// Express route
// ------------------------------------------------------------

/**
 * IMPORTANT: mount this router with `express.raw({ type: 'application/json' })`
 * so Svix can verify the signature against the untouched body. Any prior
 * `express.json()` middleware would break verification.
 */
router.post('/webhooks/clerk', async (req: Request, res: Response) => {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[clerk-webhook] CLERK_WEBHOOK_SECRET is not set');
    res.status(500).json({ error: 'Webhook not configured' });
    return;
  }

  const svixId = req.header('svix-id') || '';
  const svixTimestamp = req.header('svix-timestamp') || '';
  const svixSignature = req.header('svix-signature') || '';
  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: 'Missing Svix headers' });
    return;
  }

  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);

  let evt: ClerkWebhookEnvelope;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkWebhookEnvelope;
  } catch (err) {
    console.warn('[clerk-webhook] Signature verification failed:', err);
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      default:
        // Not an event we subscribe to; acknowledge so Clerk does not retry.
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[clerk-webhook] Handler threw:', err);
    // Return 200 so Clerk does not retry forever. The error is logged.
    res.json({ received: true, error: 'handler-failure' });
  }
});

export default router;
