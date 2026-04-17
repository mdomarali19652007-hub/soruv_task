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
    const userNumericId = Math.floor(100000 + Math.random() * 900000).toString();

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

    const userNumericId = Math.floor(100000 + Math.random() * 900000).toString();

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
