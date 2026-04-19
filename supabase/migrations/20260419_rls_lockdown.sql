-- ============================================================
-- Migration: Tighten RLS so anonymous clients can no longer read
-- every user's profile, financial history, and private chat.
--
-- Context:
--   The initial schema (supabase/schema.sql) declared
--     CREATE POLICY "..." FOR SELECT USING (true)
--   on users, withdrawals, messages, and every submission/request
--   table. Since VITE_SUPABASE_ANON_KEY ships in the browser bundle,
--   anyone could read every user's email, phone, balance, transactions
--   and screenshots via the Supabase REST endpoint.
--
-- Strategy:
--   All authenticated reads for per-user data must go through the
--   Express server (service role key, which bypasses RLS) with a
--   Better Auth session. The anon key is retained ONLY for reading
--   genuinely public catalogs and a narrow public users view for
--   leaderboard / referral-display purposes.
--
-- Apply order:
--   Run this AFTER supabase/schema.sql. Safe to re-run: every DROP
--   POLICY is IF EXISTS.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Drop the permissive "SELECT USING (true)" policies.
-- ------------------------------------------------------------

DROP POLICY IF EXISTS "users_select" ON users;
DROP POLICY IF EXISTS "msg_sel" ON messages;
DROP POLICY IF EXISTS "news_sel" ON "newsPosts";
DROP POLICY IF EXISTS "upl_sel" ON uploads;

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
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', tbl || '_sel', tbl);
  END LOOP;
END $$;

-- ------------------------------------------------------------
-- 2. Narrow public users view for leaderboard / referral badge.
--    Only exposes non-sensitive columns. Client code that needs
--    the full profile must call the server /api/me endpoint.
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW public_user_profiles AS
SELECT
  id,
  name,
  "numericId",
  rank,
  "totalEarned",
  "referralActiveCount"
FROM users;

-- `security_invoker=on` ensures the view respects the caller's RLS,
-- not the view owner's -- but since we are not exposing the underlying
-- table anymore, the view itself is the public surface.
ALTER VIEW public_user_profiles SET (security_invoker = on);

GRANT SELECT ON public_user_profiles TO anon, authenticated;

-- ------------------------------------------------------------
-- 3. Keep truly public catalogs readable.
--    tasks / driveOffers / products / ludoTournaments / settings / newsPosts
--    are already public-read via earlier policies; nothing to do.
--    (News posts remain public so the feed works for logged-out visitors.)
-- ------------------------------------------------------------

-- Re-add a public read policy for newsPosts (the feed is public content).
CREATE POLICY "news_sel_public" ON "newsPosts" FOR SELECT USING (true);

-- ------------------------------------------------------------
-- 4. Revoke direct anon access to the now-sensitive tables.
--    Even without SELECT policies, some deployments grant table-level
--    privileges to anon by default; strip them to be safe.
-- ------------------------------------------------------------

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'users', 'messages', 'uploads', 'withdrawals',
    'gmailSubmissions', 'microjobSubmissions', 'taskSubmissions',
    'rechargeRequests', 'driveOfferRequests', 'productOrders', 'smmOrders',
    'ludoSubmissions', 'socialSubmissions', 'subscriptionRequests', 'dollarBuyRequests'
  ])
  LOOP
    EXECUTE format('REVOKE ALL ON %I FROM anon', tbl);
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- Follow-up work required in the application layer:
--   1. Route all per-user reads (chat messages, own submissions,
--      withdrawals, orders, uploads) through new /api/user/* or
--      /api/admin/* endpoints that authenticate via Better Auth and
--      query with the service role key.
--   2. Replace any client-side `supabase.from('users').select('*')`
--      with either /api/me (own record) or `public_user_profiles`
--      (leaderboard-safe columns).
--   3. Remove anon Realtime subscriptions on sensitive tables; prefer
--      server-authored broadcast events or per-user channels.
-- ============================================================
