import { Router, Request, Response } from 'express';
import { getAuth, createClerkClient } from '@clerk/express';
import { supabaseAdmin } from './supabase-admin.js';
import { referralLimiter, adminLimiter } from './rate-limit.js';
import { isUserAdmin } from './admin.js';
import { requireAdminHost } from './admin-host.js';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const router = Router();

// Blanket limiter for all admin endpoints. Per-endpoint limiters are
// added above for higher-value targets (register, validate-referral).
router.use('/admin', adminLimiter);

// Defence-in-depth: when the deployment runs on a dedicated admin
// subdomain (`ADMIN_HOSTNAME` set), `/api/admin/*` is reachable ONLY
// from that host. This is a no-op for single-domain deployments. See
// [`src/server/admin-host.ts`](src/server/admin-host.ts:1).
router.use('/admin', requireAdminHost);

// ============================================================
// Middleware: Extract authenticated user from Better Auth session
// ============================================================

interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: () => void) {
  try {
    const { userId, sessionClaims } = getAuth(req as Request);
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.userId = userId;
    // Clerk may include the email in `sessionClaims` when the JWT
    // template is configured; fall back to the User API otherwise.
    const claimEmail = (sessionClaims as { email?: string } | null | undefined)?.email;
    if (claimEmail) {
      req.userEmail = claimEmail;
    } else {
      try {
        const user = await clerkClient.users.getUser(userId);
        req.userEmail = user.emailAddresses?.[0]?.emailAddress;
      } catch {
        // best-effort; admin fallback uses userId below
      }
    }
    const claimRole = (sessionClaims as { metadata?: { role?: string } } | null | undefined)?.metadata?.role;
    req.userRole = claimRole || 'user';
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

async function requireAdmin(req: AuthenticatedRequest, res: Response, next: () => void) {
  // DB-backed: reads `users.isAdmin` (seeded by the admin-role migration).
  // Falls back to a short legacy email allowlist for unmigrated deployments.
  const allowed = await isUserAdmin({ userId: req.userId, userEmail: req.userEmail });
  if (!allowed) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// ============================================================
// POST /api/register -- REMOVED.
//
// Registration now goes through Clerk (`signUp.create` on the client,
// see src/lib/auth-client.ts#registerWithReferral). The app-level
// `users` row is created by the Clerk webhook in src/server/webhooks.ts
// when Clerk fires `user.created`, which also validates the referral
// code and generates the 6-digit numericId.
// ============================================================


// ============================================================
// POST /api/register/google-profile -- Create profile after Google OAuth
// ============================================================

router.post('/register/google-profile', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userEmail = req.userEmail!;
    const {
      refCode,
      // Optional profile fields collected by the post-OAuth completion
      // modal (or recovered from `pendingSignUpMetadata` localStorage)
      // -- Google does not give us phone/country/age, so the client
      // forwards them here. All four are sanitised below.
      name: nameFromBody,
      phone: phoneFromBody,
      country: countryFromBody,
      age: ageFromBody,
    } = req.body || {};

    // Check if profile already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      res.json({ success: true, message: 'Profile already exists' });
      return;
    }

    // Validate referral code. Mirrors /api/register semantics:
    // required in normal operation, optional only during the very
    // first bootstrap signup (when the users table is empty).
    let referrerId = '';
    if (refCode) {
      const { data: refResult, error: refError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('numericId', refCode)
        .limit(1);

      if (refError || !refResult || refResult.length === 0) {
        res.status(400).json({ error: 'Invalid referral code' });
        return;
      }
      referrerId = refResult[0].id;
    } else {
      // Allow missing refCode only if no users exist yet (bootstrap).
      const { count } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true });
      if (count && count > 0) {
        res.status(400).json({ error: 'Referral code is required', needsReferralCode: true });
        return;
      }
    }

    // Resolve the display name with this priority:
    //   1. Caller-supplied `name` from the post-OAuth completion modal
    //   2. Clerk unsafeMetadata.name (set by signUp.social)
    //   3. Clerk firstName + lastName / fullName
    //   4. Email
    //   5. Literal 'User'
    let userName = 'User';
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      userName =
        (typeof nameFromBody === 'string' && nameFromBody.trim()) ||
        (clerkUser.unsafeMetadata as { name?: string } | undefined)?.name ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        clerkUser.fullName ||
        userEmail ||
        'User';
    } catch {
      userName =
        (typeof nameFromBody === 'string' && nameFromBody.trim()) ||
        userEmail ||
        'User';
    }

    // Sanitise the optional caller-supplied profile fields. We trim
    // strings, cap their length, and clamp `age` to a sane range so
    // a malformed body cannot poison the row.
    const safePhone =
      typeof phoneFromBody === 'string' ? phoneFromBody.trim().slice(0, 32) : '';
    const allowedCountries = new Set(['Bangladesh', 'India', 'Pakistan']);
    const requestedCountry =
      typeof countryFromBody === 'string' ? countryFromBody.trim() : '';
    const safeCountry = allowedCountries.has(requestedCountry)
      ? requestedCountry
      : 'Bangladesh';
    let safeAge = 18;
    const parsedAge = parseInt(typeof ageFromBody === 'string' ? ageFromBody : '', 10);
    if (Number.isFinite(parsedAge) && parsedAge >= 13 && parsedAge <= 120) {
      safeAge = parsedAge;
    }

    // Generate a unique 6-digit numericId with collision retry
    let userNumericId = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = Math.floor(100000 + Math.random() * 900000).toString();
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('numericId', candidate)
        .limit(1);
      if (!existing || existing.length === 0) {
        userNumericId = candidate;
        break;
      }
    }
    if (!userNumericId) {
      res.status(500).json({ error: 'Failed to generate unique ID. Please try again.' });
      return;
    }

    // Retry on 23505 unique_violation in case of numericId race with
    // another signup. The unique index is added by migration
    // 20260424_numericid_unique.sql.
    let profileError: any = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = await supabaseAdmin.from('users').upsert({
        id: userId,
        name: userName,
        email: userEmail,
        phone: safePhone,
        country: safeCountry,
        age: safeAge,
        numericId: userNumericId,
        referralCode: userNumericId,
        referralLink: `${process.env.APP_PUBLIC_URL || process.env.BETTER_AUTH_URL || 'http://localhost:3000'}?ref=${userNumericId}`,
        referredBy: referrerId,
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

      if (!result.error) {
        profileError = null;
        break;
      }

      if ((result.error as any).code === '23505') {
        userNumericId = Math.floor(100000 + Math.random() * 900000).toString();
        profileError = result.error;
        continue;
      }

      profileError = result.error;
      break;
    }

    if (profileError) {
      res.status(500).json({ error: 'Failed to create profile' });
      return;
    }

    // Increment referrer gen1Count
    if (referrerId) {
      await supabaseAdmin.rpc('increment_field', {
        p_table: 'users',
        p_id: referrerId,
        p_column: 'gen1Count',
        p_amount: 1,
      }).then(({ error: rpcErr }) => { if (rpcErr) console.warn('rpc error:', rpcErr); });
    }

    res.json({ success: true, numericId: userNumericId });
  } catch (error: any) {
    console.error('Google profile creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create profile' });
  }
});

// ============================================================
// POST /api/validate-referral -- Validate referral code (public)
// ============================================================

// ============================================================
// GET /api/referral-required -- Public: is a refCode required?
//
// Returns `{ required: false }` only during bootstrap (the `users`
// table is empty) and `{ required: true }` afterwards. The client
// uses this to decide whether to allow an empty refCode on the very
// first signup.
//
// This cannot be decided client-side: the RLS lockdown
// (20260419_rls_lockdown.sql) revokes anon SELECT on `users`, so a
// direct count from the browser always returns 0 and would let every
// signup through as "bootstrap".
// ============================================================

router.get('/referral-required', referralLimiter, async (_req: Request, res: Response) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true });
    if (error) {
      // Fail closed: if we cannot confirm emptiness, demand a refCode.
      res.json({ required: true });
      return;
    }
    res.json({ required: (count || 0) > 0 });
  } catch {
    res.json({ required: true });
  }
});

router.post('/validate-referral', referralLimiter, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ valid: false });
      return;
    }

    // Only allow the expected format (6-digit numeric) to cut down on
    // enumeration noise and DB load from arbitrary probes.
    if (!/^\d{4,10}$/.test(code)) {
      res.json({ valid: false });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('numericId', code)
      .limit(1);

    if (error || !data || data.length === 0) {
      res.json({ valid: false });
      return;
    }

    // SECURITY: do NOT leak the referrer's user id to anonymous callers.
    // Returning only a boolean prevents brute-force enumeration of user ids.
    res.json({ valid: true });
  } catch {
    res.json({ valid: false });
  }
});

// ============================================================
// GET /api/me -- Get current user's app profile
// ============================================================

router.get('/me', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .maybeSingle();

    if (error || !data) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/admin/users/:id/revoke-sessions -- Revoke all sessions for a user
// ============================================================

router.post('/admin/users/:id/revoke-sessions', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;

    // Revoke every active Clerk session for the target user. Clerk
    // propagates this to all devices -- refresh tokens are invalidated
    // on the next request.
    const sessions = await clerkClient.sessions.getSessionList({ userId: targetUserId });
    const list = Array.isArray(sessions) ? sessions : (sessions as { data?: Array<{ id: string }> }).data || [];
    await Promise.all(
      list.map((s: { id: string }) => clerkClient.sessions.revokeSession(s.id).catch((err) => {
        console.warn('[admin] revokeSession failed:', s.id, err);
      })),
    );

    res.json({ success: true, message: 'All sessions revoked' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// POST /api/admin/users/:id/ban -- Ban a user and revoke sessions
// ============================================================

router.post('/admin/users/:id/ban', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const targetUserId = req.params.id;
    const { reason } = req.body;

    // Update user status in app table
    await supabaseAdmin
      .from('users')
      .update({ status: 'banned', restrictionReason: reason || 'Policy violation' })
      .eq('id', targetUserId);

    // Ban via Clerk. Banned users lose the ability to create new
    // sessions; we also revoke any live ones below so the effect is
    // immediate instead of next-token-refresh.
    await clerkClient.users.banUser(targetUserId);
    try {
      const sessions = await clerkClient.sessions.getSessionList({ userId: targetUserId });
      const list = Array.isArray(sessions) ? sessions : (sessions as { data?: Array<{ id: string }> }).data || [];
      await Promise.all(
        list.map((s: { id: string }) => clerkClient.sessions.revokeSession(s.id).catch(() => undefined)),
      );
    } catch (err) {
      console.warn('[admin] Failed to revoke sessions after ban:', err);
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// Generic Admin CRUD Routes
//
// These routes use the supabaseAdmin (service-role) client to
// bypass RLS.  All routes require authentication + admin role.
// A whitelist restricts which tables can be written to.
// ============================================================

const ADMIN_WRITABLE_TABLES = new Set([
  'settings',
  'tasks',
  'products',
  'driveOffers',
  'newsPosts',
  'ludoTournaments',
  'gmailSubmissions',
  'microjobSubmissions',
  'taskSubmissions',
  'driveOfferRequests',
  'smmOrders',
  'dollarBuyRequests',
  'productOrders',
  'subscriptionRequests',
  'socialSubmissions',
  'uploads',
  'users',
  'ludoSubmissions',
]);

function validateTable(table: string, res: Response): boolean {
  if (!table || !ADMIN_WRITABLE_TABLES.has(table)) {
    res.status(400).json({ error: `Table '${table}' is not allowed` });
    return false;
  }
  return true;
}

// POST /api/admin/insert -- Insert a row into a whitelisted table
router.post('/admin/insert', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, data } = req.body;
    if (!validateTable(table, res)) return;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'data is required' });
      return;
    }

    const { data: result, error } = await supabaseAdmin
      .from(table)
      .insert(data)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/update -- Update a row by ID in a whitelisted table
router.post('/admin/update', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, id, data } = req.body;
    if (!validateTable(table, res)) return;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'data is required' });
      return;
    }

    const { error } = await supabaseAdmin
      .from(table)
      .update(data)
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/delete -- Delete a row by ID from a whitelisted table
router.post('/admin/delete', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, id } = req.body;
    if (!validateTable(table, res)) return;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/upsert -- Upsert a row in a whitelisted table
router.post('/admin/upsert', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, data } = req.body;
    if (!validateTable(table, res)) return;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ error: 'data is required' });
      return;
    }

    const { data: result, error } = await supabaseAdmin
      .from(table)
      .upsert(data)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/increment -- Atomically increment a numeric field
router.post('/admin/increment', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, id, column, amount } = req.body;
    if (!validateTable(table, res)) return;
    if (!id || !column || typeof amount !== 'number') {
      res.status(400).json({ error: 'id, column, and amount (number) are required' });
      return;
    }

    const { error } = await supabaseAdmin.rpc('increment_field', {
      p_table: table,
      p_id: id,
      p_column: column,
      p_amount: amount,
    });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/increment-fields -- Atomically increment multiple fields
router.post('/admin/increment-fields', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { table, id, increments } = req.body;
    if (!validateTable(table, res)) return;
    if (!id || !increments || typeof increments !== 'object') {
      res.status(400).json({ error: 'id and increments are required' });
      return;
    }

    for (const [column, amount] of Object.entries(increments)) {
      if (typeof amount !== 'number') continue;
      const { error } = await supabaseAdmin.rpc('increment_field', {
        p_table: table,
        p_id: id,
        p_column: column,
        p_amount: amount,
      });
      if (error) {
        res.status(500).json({ error: `Failed to increment ${column}: ${error.message}` });
        return;
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/row -- Get a single row by ID from a whitelisted table
router.get('/admin/row', requireAuth as any, requireAdmin as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const table = req.query.table as string;
    const id = req.query.id as string;
    if (!validateTable(table, res)) return;
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
