import { Router, Request, Response } from 'express';
import { auth } from './auth.js';
import { supabaseAdmin } from './supabase-admin.js';
import { fromNodeHeaders } from 'better-auth/node';

const router = Router();

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
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.userId = session.user.id;
    req.userEmail = session.user.email;
    req.userRole = (session.user as any).role || 'user';
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: () => void) {
  const ADMIN_EMAILS = ['soruvislam51@gmail.com', 'shovonali885@gmail.com'];
  if (!req.userEmail || !ADMIN_EMAILS.includes(req.userEmail)) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

// ============================================================
// POST /api/register -- Custom registration with referral code
// ============================================================

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, country, age, refCode } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Validate referral code server-side
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
      // Allow registration without referral code only if no users exist (bootstrap)
      const { count } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true });
      if (count && count > 0) {
        res.status(400).json({ error: 'Referral code is required' });
        return;
      }
    }

    // Create user via Better Auth
    const signUpResult = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    if (!signUpResult?.user) {
      res.status(400).json({ error: 'Registration failed' });
      return;
    }

    const userId = signUpResult.user.id;

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
      // Extremely unlikely -- 10 consecutive collisions
      res.status(500).json({ error: 'Failed to generate unique ID. Please try again.' });
      return;
    }

    // Create app user profile in the users table
    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: userId,
      name,
      email,
      phone: phone || '',
      country: country || 'Bangladesh',
      age: parseInt(age) || 18,
      numericId: userNumericId,
      referralCode: userNumericId,
      referralLink: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}?ref=${userNumericId}`,
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

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      res.status(500).json({ error: 'Failed to create user profile' });
      return;
    }

    // Increment gen1 count for referrer
    if (referrerId) {
      await supabaseAdmin.rpc('increment_field', {
        p_table: 'users',
        p_id: referrerId,
        p_column: 'gen1Count',
        p_amount: 1,
      }).then(({ error: rpcErr }) => { if (rpcErr) console.warn('Failed to increment gen1Count:', rpcErr); });
    }

    res.json({
      success: true,
      user: {
        id: userId,
        email,
        name,
        numericId: userNumericId,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);

    if (error?.message?.includes('already') || error?.code === 'USER_ALREADY_EXISTS') {
      res.status(409).json({ error: 'This email is already registered' });
      return;
    }
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

// ============================================================
// POST /api/register/google-profile -- Create profile after Google OAuth
// ============================================================

router.post('/register/google-profile', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userEmail = req.userEmail!;
    const { refCode } = req.body;

    // Check if profile already exists with current Better Auth ID
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existing) {
      res.json({ success: true, message: 'Profile already exists' });
      return;
    }

    // Check if an old profile exists by email (Supabase Auth migration case)
    const { data: oldByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (oldByEmail) {
      // Migrate the old profile instead of creating a new one
      // This preserves balance, referral code, referral history, etc.
      const { data: fullOld } = await supabaseAdmin.from('users').select('*').eq('id', oldByEmail.id).single();
      if (fullOld) {
        const oldId = fullOld.id;
        await supabaseAdmin.from('users').upsert({ ...fullOld, id: userId, email: userEmail });
        await supabaseAdmin.from('users').delete().eq('id', oldId);
        await supabaseAdmin.from('users').update({ referredBy: userId }).eq('referredBy', oldId);
        console.log(`[Auth Migration] Google profile migrated: ${oldId} -> ${userId} (${userEmail})`);
        res.json({ success: true, migrated: true, numericId: fullOld.numericId });
        return;
      }
    }

    // Validate referral code
    let referrerId = '';
    if (refCode) {
      const { data: refResult } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('numericId', refCode)
        .limit(1);

      if (refResult && refResult.length > 0) {
        referrerId = refResult[0].id;
      }
    }

    // Get user name from Better Auth user record
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    const userName = session?.user?.name || 'User';

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

    const { error: profileError } = await supabaseAdmin.from('users').upsert({
      id: userId,
      name: userName,
      email: userEmail,
      phone: '',
      country: 'Bangladesh',
      age: 18,
      numericId: userNumericId,
      referralCode: userNumericId,
      referralLink: `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}?ref=${userNumericId}`,
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

router.post('/validate-referral', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ valid: false });
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

    res.json({ valid: true, userId: data[0].id });
  } catch {
    res.json({ valid: false });
  }
});

// ============================================================
// POST /api/migrate-profile -- Migrate old Supabase Auth profile to Better Auth user ID
// ============================================================
// When a user originally created via Supabase Auth logs in via Better Auth,
// their session has a new user ID. This endpoint finds their old profile by
// email and updates its `id` to the new Better Auth user ID, preserving all
// data (balance, referral code, referral history, etc.).

router.post('/migrate-profile', requireAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const newUserId = req.userId!;
    const userEmail = req.userEmail!;

    // Check if a profile already exists with the new Better Auth ID
    const { data: existingNew } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', newUserId)
      .maybeSingle();

    if (existingNew) {
      // Profile already migrated or newly created
      res.json({ success: true, migrated: false, message: 'Profile already exists with current ID' });
      return;
    }

    // Look for an old profile by email (from Supabase Auth era)
    const { data: oldProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .maybeSingle();

    if (!oldProfile) {
      // No old profile found -- user needs to create a new profile
      res.json({ success: false, migrated: false, message: 'No existing profile found' });
      return;
    }

    const oldUserId = oldProfile.id;

    // Migrate: update the profile's id to the new Better Auth user ID
    // We need to insert a new row with the new ID and delete the old one
    // because Postgres doesn't allow updating primary keys easily.

    // 1. Get the full old profile
    const { data: fullOldProfile, error: fetchErr } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', oldUserId)
      .single();

    if (fetchErr || !fullOldProfile) {
      res.status(500).json({ error: 'Failed to read old profile' });
      return;
    }

    // 2. Insert new row with updated ID (upsert to handle race conditions)
    const migratedProfile = { ...fullOldProfile, id: newUserId, email: userEmail };
    const { error: upsertErr } = await supabaseAdmin
      .from('users')
      .upsert(migratedProfile);

    if (upsertErr) {
      console.error('Profile migration upsert failed:', upsertErr);
      res.status(500).json({ error: 'Migration failed' });
      return;
    }

    // 3. Delete the old row
    await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', oldUserId);

    // 4. Update referredBy references in other users (they point to old ID)
    await supabaseAdmin
      .from('users')
      .update({ referredBy: newUserId })
      .eq('referredBy', oldUserId);

    // 5. Update userId references in submissions/transactions tables
    const tablesToMigrate = [
      'withdrawals', 'gmailSubmissions', 'microjobSubmissions', 'taskSubmissions',
      'rechargeRequests', 'driveOfferRequests', 'dollarBuyRequests', 'deposits',
      'subscriptionRequests', 'productOrders', 'socialSubmissions', 'ludoSubmissions',
      'smmOrders', 'uploads'
    ];
    for (const table of tablesToMigrate) {
      await supabaseAdmin
        .from(table)
        .update({ userId: newUserId })
        .eq('userId', oldUserId)
        .then(({ error }) => {
          if (error) console.warn(`Migration: failed to update ${table}:`, error.message);
        });
    }

    console.log(`[Auth Migration] Profile migrated: ${oldUserId} -> ${newUserId} (${userEmail})`);
    res.json({ success: true, migrated: true, oldId: oldUserId, newId: newUserId });
  } catch (error: any) {
    console.error('Profile migration error:', error);
    res.status(500).json({ error: error.message || 'Migration failed' });
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

    // Use Better Auth admin API to revoke sessions
    await auth.api.revokeUserSessions({
      body: { userId: targetUserId },
      headers: fromNodeHeaders(req.headers),
    });

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

    // Ban via Better Auth admin plugin
    await auth.api.banUser({
      body: { userId: targetUserId },
      headers: fromNodeHeaders(req.headers),
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
