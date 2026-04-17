-- ============================================================
-- Supabase Schema for Top Earning Platform
-- Run this in the Supabase SQL Editor to set up the database
-- 
-- NOTE: Column names use camelCase (double-quoted) to match
-- the existing app data model and minimize migration changes.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  country TEXT DEFAULT 'Bangladesh',
  age INTEGER DEFAULT 18,
  "referralCode" TEXT DEFAULT '',
  "numericId" TEXT DEFAULT '',
  rank TEXT DEFAULT 'Bronze',
  "mainBalance" NUMERIC(12,2) DEFAULT 0,
  "totalEarned" NUMERIC(12,2) DEFAULT 0,
  "pendingPayout" NUMERIC(12,2) DEFAULT 0,
  "referralLink" TEXT DEFAULT '',
  "gen1Count" INTEGER DEFAULT 0,
  "dailyClaimed" BOOLEAN DEFAULT FALSE,
  notifications JSONB DEFAULT '[]'::jsonb,
  "taskHistory" JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[{"id":"1","title":"First Task","progress":0,"goal":1},{"id":"2","title":"Team Builder","progress":0,"goal":10}]'::jsonb,
  "adWatches" JSONB DEFAULT '[]'::jsonb,
  "isActive" BOOLEAN DEFAULT FALSE,
  "activationDate" TEXT DEFAULT '',
  "activationExpiry" TEXT DEFAULT '',
  "referralActiveCount" INTEGER DEFAULT 0,
  "referredBy" TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  "restrictionReason" TEXT DEFAULT '',
  "suspensionUntil" TEXT DEFAULT '',
  "totalCommission" NUMERIC(12,2) DEFAULT 0,
  "socialSubmissions" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  "globalNotice" TEXT DEFAULT '',
  "isMaintenance" BOOLEAN DEFAULT FALSE,
  "minWithdrawal" NUMERIC DEFAULT 55,
  "withdrawalFee" NUMERIC DEFAULT 20,
  "dollarBuyRate" NUMERIC DEFAULT 125,
  "dollarSellRate" NUMERIC DEFAULT 115,
  "spinCost" NUMERIC DEFAULT 2,
  "dailyReward" NUMERIC DEFAULT 1,
  "activeFolders" JSONB DEFAULT '["folder-a","folder-b","folder-c","folder-d"]'::jsonb,
  "enabledFeatures" JSONB DEFAULT '["spin","daily-claim","leaderboard","support","ads-earn"]'::jsonb,
  "enabledSmmServices" JSONB DEFAULT '["fb-like","fb-star","fb-follow","tg-member","tg-view","tg-star","youtube-premium","meta-verified"]'::jsonb,
  "enabledCards" JSONB DEFAULT '["TOP NEWS","Daily Job","Fb Marketing","Gmail Sell","Ads Earn","Mobile Banking","BUY SELL","Network Marketing","Micro Tasks","Asset Trading","Team Bonus","Premium Jobs","E-commerce","SOCIAL","SMM & BOOSTING","GAMING"]'::jsonb,
  "totalPaid" NUMERIC DEFAULT 550000,
  "activeWorkerCount" INTEGER DEFAULT 12000,
  "gmailPassword" TEXT DEFAULT '',
  "gmailReward" NUMERIC DEFAULT 10,
  "adReward" NUMERIC DEFAULT 0.40,
  "dailyAdLimit" INTEGER DEFAULT 5,
  "deliveryFee" NUMERIC DEFAULT 120,
  "gen1Rate" NUMERIC DEFAULT 20,
  "gen2Rate" NUMERIC DEFAULT 5,
  "gen3Rate" NUMERIC DEFAULT 2,
  "activationFee" NUMERIC DEFAULT 25,
  "rechargeCommissionRate" NUMERIC DEFAULT 20,
  "activationDuration" INTEGER DEFAULT 30,
  "referralCommissionRate" NUMERIC DEFAULT 5,
  "referralActivationBonus" NUMERIC DEFAULT 20,
  "telegramLink" TEXT DEFAULT 'https://t.me/BDTKING999',
  "facebookLink" TEXT DEFAULT 'https://facebook.com',
  "whatsappLink" TEXT DEFAULT 'https://wa.me/8801700000000',
  "showWelcomeAnimation" BOOLEAN DEFAULT TRUE,
  "rulesText" TEXT DEFAULT 'Welcome to Top Earning! Please follow our rules.',
  "smmPrices" JSONB DEFAULT '{}'::jsonb
);

INSERT INTO settings (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL,
  "accountNumber" TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  "transactionId" TEXT DEFAULT '',
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "gmailSubmissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  reward NUMERIC(12,2) DEFAULT 0,
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "microjobSubmissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "microjobId" TEXT DEFAULT '',
  "userName" TEXT DEFAULT '',
  link TEXT DEFAULT '',
  screenshot TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  reward NUMERIC(12,2) DEFAULT 0,
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "taskSubmissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "taskType" TEXT DEFAULT '',
  "userName" TEXT DEFAULT '',
  link TEXT DEFAULT '',
  screenshot TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  reward NUMERIC(12,2) DEFAULT 0,
  "taskId" TEXT DEFAULT '',
  reason TEXT DEFAULT '',
  category TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "userName" TEXT DEFAULT '',
  text TEXT DEFAULT '',
  sender TEXT DEFAULT 'user',
  date TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT DEFAULT '',
  reward NUMERIC(12,2) DEFAULT 0,
  "desc" TEXT DEFAULT '',
  link TEXT DEFAULT '',
  category TEXT DEFAULT 'micro'
);

CREATE TABLE IF NOT EXISTS "rechargeRequests" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  phone TEXT DEFAULT '',
  operator TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  type TEXT DEFAULT 'Prepaid',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  "transactionId" TEXT DEFAULT '',
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "driveOffers" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT DEFAULT '',
  operator TEXT DEFAULT '',
  price NUMERIC(12,2) DEFAULT 0,
  description TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "driveOfferRequests" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "driveOfferId" TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  "transactionId" TEXT DEFAULT '',
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT DEFAULT '',
  price NUMERIC(12,2) DEFAULT 0,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',
  category TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "productOrders" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "productId" TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  "deliveryFee" NUMERIC(12,2) DEFAULT 0,
  "totalPaid" NUMERIC(12,2) DEFAULT 0,
  "paymentStatus" TEXT DEFAULT 'COD',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  "orderId" TEXT DEFAULT '',
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "smmOrders" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "userName" TEXT DEFAULT '',
  service TEXT DEFAULT '',
  link TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "ludoTournaments" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT DEFAULT '',
  "entryFee" NUMERIC(12,2) DEFAULT 0,
  "prizePool" NUMERIC(12,2) DEFAULT 0,
  type TEXT DEFAULT '1vs1',
  rules TEXT DEFAULT '',
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'open',
  "maxPlayers" INTEGER DEFAULT 4,
  "currentPlayers" INTEGER DEFAULT 0,
  "startTime" TEXT DEFAULT '',
  "roomCode" TEXT DEFAULT '',
  "playerIds" JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS "ludoSubmissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "tournamentId" TEXT DEFAULT '',
  "userName" TEXT DEFAULT '',
  "ludoUsername" TEXT DEFAULT '',
  screenshot TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "socialSubmissions" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "userName" TEXT DEFAULT '',
  type TEXT DEFAULT '',
  "trxId" TEXT DEFAULT '',
  screenshot TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  amount NUMERIC(12,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "subscriptionRequests" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  type TEXT DEFAULT '',
  email TEXT DEFAULT '',
  "telegramId" TEXT DEFAULT '',
  price NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "dollarBuyRequests" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,
  price NUMERIC(12,2) DEFAULT 0,
  method TEXT DEFAULT '',
  wallet TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  timestamp BIGINT DEFAULT 0,
  "orderId" TEXT DEFAULT '',
  reason TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "newsPosts" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "authorName" TEXT DEFAULT '',
  "authorBadge" BOOLEAN DEFAULT FALSE,
  content TEXT DEFAULT '',
  "imageUrl" TEXT DEFAULT '',
  likes JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  timestamp BIGINT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL,
  "userName" TEXT DEFAULT '',
  url TEXT DEFAULT '',
  context TEXT DEFAULT 'general',
  timestamp BIGINT DEFAULT 0,
  date TEXT DEFAULT ''
);

-- ============================================================
-- RPC Function for atomic increment (SECURED with whitelist)
-- ============================================================

CREATE OR REPLACE FUNCTION increment_field(
  p_table TEXT,
  p_id TEXT,
  p_column TEXT,
  p_amount NUMERIC
) RETURNS VOID AS $$
DECLARE
  allowed BOOLEAN := FALSE;
BEGIN
  -- SECURITY: Whitelist of allowed table/column combinations
  -- Only specific financial and counter fields can be incremented
  IF (p_table = 'users' AND p_column IN (
    'mainBalance', 'totalEarned', 'pendingPayout', 'totalCommission',
    'gen1Count', 'referralActiveCount'
  )) THEN
    allowed := TRUE;
  ELSIF (p_table = 'settings' AND p_column IN ('totalPaid', 'activeWorkerCount')) THEN
    allowed := TRUE;
  END IF;

  IF NOT allowed THEN
    RAISE EXCEPTION 'increment_field: disallowed table/column combination: %.%', p_table, p_column;
  END IF;

  EXECUTE format(
    'UPDATE %I SET %I = COALESCE(%I, 0) + $1 WHERE id = $2::uuid',
    p_table, p_column, p_column
  ) USING p_amount, p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CHECK constraint: prevent negative balances
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_main_balance_non_negative'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_main_balance_non_negative CHECK ("mainBalance" >= 0);
  END IF;
END $$;

-- ============================================================
-- Secure server-side financial functions
-- ============================================================

-- Submit a withdrawal request with server-side validation
CREATE OR REPLACE FUNCTION submit_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_method TEXT,
  p_account_number TEXT
) RETURNS UUID AS $$
DECLARE
  v_user RECORD;
  v_settings RECORD;
  v_fee NUMERIC;
  v_withdrawal_id UUID;
  v_txn_id TEXT;
BEGIN
  -- Verify the caller is the user
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller does not match user_id';
  END IF;

  -- Lock the user row to prevent race conditions
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Get settings
  SELECT * INTO v_settings FROM settings WHERE id = 'global';

  -- Server-side validation
  IF NOT v_user."isActive" THEN
    RAISE EXCEPTION 'Account is not active';
  END IF;

  IF p_amount < v_settings."minWithdrawal" THEN
    RAISE EXCEPTION 'Amount below minimum withdrawal of %', v_settings."minWithdrawal";
  END IF;

  IF p_amount > v_user."mainBalance" THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  IF p_method IS NULL OR p_method = '' THEN
    RAISE EXCEPTION 'Withdrawal method is required';
  END IF;

  IF p_account_number IS NULL OR p_account_number = '' THEN
    RAISE EXCEPTION 'Account number is required';
  END IF;

  -- Calculate fee
  v_fee := (p_amount * v_settings."withdrawalFee") / 100;

  -- Generate transaction ID
  v_txn_id := 'TXN-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 9));

  -- Deduct balance atomically
  UPDATE users SET
    "mainBalance" = "mainBalance" - p_amount,
    "pendingPayout" = COALESCE("pendingPayout", 0) + p_amount
  WHERE id = p_user_id;

  -- Insert withdrawal record
  INSERT INTO withdrawals ("userId", amount, method, "accountNumber", status, date, time, timestamp, "transactionId")
  VALUES (
    p_user_id::text, p_amount,
    p_method || ' (' || p_account_number || ')',
    p_account_number, 'pending',
    to_char(now(), 'MM/DD/YYYY'),
    to_char(now(), 'HH12:MI:SS AM'),
    extract(epoch from now())::bigint * 1000,
    v_txn_id
  ) RETURNING id INTO v_withdrawal_id;

  RETURN v_withdrawal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve or reject a withdrawal (admin only)
CREATE OR REPLACE FUNCTION process_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT ''
) RETURNS VOID AS $$
DECLARE
  v_withdrawal RECORD;
  v_user RECORD;
BEGIN
  -- Admin check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action: must be approved or rejected';
  END IF;

  -- Lock the withdrawal row
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF v_withdrawal.status != 'pending' THEN
    RAISE EXCEPTION 'Withdrawal already processed';
  END IF;

  -- Update withdrawal status
  UPDATE withdrawals SET status = p_action, reason = COALESCE(p_reason, '') WHERE id = p_withdrawal_id;

  -- Lock user row
  SELECT * INTO v_user FROM users WHERE id = v_withdrawal."userId"::uuid FOR UPDATE;

  IF p_action = 'approved' THEN
    -- Deduct from pending payout
    UPDATE users SET
      "pendingPayout" = GREATEST(0, COALESCE("pendingPayout", 0) - v_withdrawal.amount)
    WHERE id = v_withdrawal."userId"::uuid;
  ELSE
    -- Rejected: refund to main balance, deduct from pending
    UPDATE users SET
      "mainBalance" = COALESCE("mainBalance", 0) + v_withdrawal.amount,
      "pendingPayout" = GREATEST(0, COALESCE("pendingPayout", 0) - v_withdrawal.amount)
    WHERE id = v_withdrawal."userId"::uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve or reject a deposit/recharge request (admin only)
CREATE OR REPLACE FUNCTION process_deposit(
  p_request_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT ''
) RETURNS VOID AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Admin check
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: admin access required';
  END IF;

  IF p_action NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_request FROM "rechargeRequests" WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  UPDATE "rechargeRequests" SET status = p_action, reason = COALESCE(p_reason, '') WHERE id = p_request_id;

  IF p_action = 'approved' THEN
    -- Atomically add to user balance
    UPDATE users SET
      "mainBalance" = COALESCE("mainBalance", 0) + v_request.amount,
      "totalEarned" = COALESCE("totalEarned", 0) + v_request.amount
    WHERE id = v_request."userId"::uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activate account with server-side fee deduction
CREATE OR REPLACE FUNCTION activate_account(
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  v_user RECORD;
  v_settings RECORD;
  v_expiry TIMESTAMPTZ;
  v_referrer RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_settings FROM settings WHERE id = 'global';
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user."mainBalance" < v_settings."activationFee" THEN
    RAISE EXCEPTION 'Insufficient balance for activation fee of %', v_settings."activationFee";
  END IF;

  v_expiry := now() + (v_settings."activationDuration" || ' days')::interval;

  -- Deduct fee and activate
  UPDATE users SET
    "mainBalance" = "mainBalance" - v_settings."activationFee",
    "isActive" = TRUE,
    "activationDate" = now()::text,
    "activationExpiry" = v_expiry::text
  WHERE id = p_user_id;

  -- Process referral bonus if applicable
  IF v_user."referredBy" IS NOT NULL AND v_user."referredBy" != '' THEN
    SELECT * INTO v_referrer FROM users WHERE id = v_user."referredBy"::uuid FOR UPDATE;
    IF FOUND THEN
      UPDATE users SET
        "mainBalance" = COALESCE("mainBalance", 0) + v_settings."referralActivationBonus",
        "totalEarned" = COALESCE("totalEarned", 0) + v_settings."referralActivationBonus",
        "referralActiveCount" = COALESCE("referralActiveCount", 0) + 1
      WHERE id = v_referrer.id;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Claim daily reward with server-side validation
CREATE OR REPLACE FUNCTION claim_daily_reward(
  p_user_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_user RECORD;
  v_settings RECORD;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_settings FROM settings WHERE id = 'global';
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user."dailyClaimed" THEN
    RAISE EXCEPTION 'Daily reward already claimed';
  END IF;

  UPDATE users SET
    "mainBalance" = COALESCE("mainBalance", 0) + v_settings."dailyReward",
    "totalEarned" = COALESCE("totalEarned", 0) + v_settings."dailyReward",
    "dailyClaimed" = TRUE
  WHERE id = p_user_id;

  RETURN v_settings."dailyReward";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Process spin with server-side validation and randomness
CREATE OR REPLACE FUNCTION process_spin(
  p_user_id UUID
) RETURNS NUMERIC AS $$
DECLARE
  v_user RECORD;
  v_settings RECORD;
  v_prizes NUMERIC[] := ARRAY[0, 0.5, 1, 2, 5, 10, 0, 0.2];
  v_win NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_settings FROM settings WHERE id = 'global';
  SELECT * INTO v_user FROM users WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user."mainBalance" < v_settings."spinCost" THEN
    RAISE EXCEPTION 'Insufficient balance for spin';
  END IF;

  -- Server-side random prize selection
  v_win := v_prizes[1 + floor(random() * array_length(v_prizes, 1))::int];

  -- Deduct cost and add winnings atomically
  UPDATE users SET
    "mainBalance" = "mainBalance" - v_settings."spinCost" + v_win,
    "totalEarned" = COALESCE("totalEarned", 0) + v_win
  WHERE id = p_user_id;

  RETURN v_win;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE "gmailSubmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "microjobSubmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "taskSubmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE "rechargeRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "driveOffers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "driveOfferRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE "productOrders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "smmOrders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ludoTournaments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ludoSubmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "socialSubmissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptionRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "dollarBuyRequests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "newsPosts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Admin check helper (supports multiple admin emails)
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = auth.uid()) IN (
    'soruvislam51@gmail.com',
    'shovonali885@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users
CREATE POLICY "users_select" ON users FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON users FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "users_delete" ON users FOR DELETE USING (is_admin());

-- RPC function for referral code validation (bypasses RLS so unauthenticated users can validate codes)
CREATE OR REPLACE FUNCTION validate_referral_code(code TEXT)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY SELECT id FROM users WHERE "numericId" = code LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Settings: public read (maintenance mode must be visible before login), admin write
CREATE POLICY "settings_select" ON settings FOR SELECT USING (true);
CREATE POLICY "settings_insert" ON settings FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "settings_update" ON settings FOR UPDATE USING (is_admin());
CREATE POLICY "settings_delete" ON settings FOR DELETE USING (is_admin());

-- For each submission/request table: user reads own + admin reads all, user creates own, admin updates/deletes
-- Using a macro-like pattern for all similar tables

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'withdrawals', 'gmailSubmissions', 'microjobSubmissions', 'taskSubmissions',
    'rechargeRequests', 'driveOfferRequests', 'productOrders', 'smmOrders',
    'ludoSubmissions', 'socialSubmissions', 'subscriptionRequests', 'dollarBuyRequests'
  ])
  LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING ("userId" = auth.uid()::text OR is_admin())', tbl || '_sel', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK ("userId" = auth.uid()::text)', tbl || '_ins', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (is_admin())', tbl || '_upd', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (is_admin())', tbl || '_del', tbl);
  END LOOP;
END $$;

-- Messages: all auth read/create, admin update/delete
CREATE POLICY "msg_sel" ON messages FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "msg_ins" ON messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "msg_upd" ON messages FOR UPDATE USING (is_admin());
CREATE POLICY "msg_del" ON messages FOR DELETE USING (is_admin());

-- Read-only for all auth, admin writes
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['tasks', 'driveOffers', 'products', 'ludoTournaments'])
  LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT USING (auth.uid() IS NOT NULL)', tbl || '_sel', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT WITH CHECK (is_admin())', tbl || '_ins', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE USING (is_admin())', tbl || '_upd', tbl);
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE USING (is_admin())', tbl || '_del', tbl);
  END LOOP;
END $$;

-- News: all read, admin create/delete, all update (likes/comments)
CREATE POLICY "news_sel" ON "newsPosts" FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "news_ins" ON "newsPosts" FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "news_upd" ON "newsPosts" FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "news_del" ON "newsPosts" FOR DELETE USING (is_admin());

-- Uploads: admin reads, auth creates
CREATE POLICY "upl_sel" ON uploads FOR SELECT USING (is_admin());
CREATE POLICY "upl_ins" ON uploads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "upl_upd" ON uploads FOR UPDATE USING (is_admin());
CREATE POLICY "upl_del" ON uploads FOR DELETE USING (is_admin());

-- ============================================================
-- Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE users, settings, withdrawals,
  "gmailSubmissions", "microjobSubmissions", "taskSubmissions", messages, tasks,
  "rechargeRequests", "driveOffers", "driveOfferRequests", products, "productOrders",
  "smmOrders", "ludoTournaments", "ludoSubmissions", "socialSubmissions",
  "subscriptionRequests", "dollarBuyRequests", "newsPosts", uploads;
