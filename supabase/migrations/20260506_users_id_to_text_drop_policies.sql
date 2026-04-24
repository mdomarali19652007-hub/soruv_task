-- 20260506_users_id_to_text_drop_policies.sql
--
-- Second follow-up to the `users.id UUID -> TEXT` cutover.
--
-- Previous attempts:
--   * 20260504_users_id_to_text.sql          -- bare ALTER, no dependency handling.
--   * 20260505_users_id_to_text_with_view.sql -- drops public_user_profiles
--                                              view, but NOT RLS policies.
--
-- Databases where 20260419_rls_lockdown.sql was never applied still
-- carry the original permissive policy from schema.sql:
--   CREATE POLICY "users_select" ON users FOR SELECT USING (true);
-- so 20260505 fails with:
--   ERROR: 0A000: cannot alter type of a column used in a policy definition
--   DETAIL:  policy users_select on table users depends on column "id"
--
-- This migration is the robust, forward-only cutover. It:
--   1. Drops every RLS policy currently attached to public.users.
--   2. Drops public_user_profiles (safe even if 20260505 already ran).
--   3. Strips any leftover `uuid_generate_v4()` default on users.id.
--   4. Casts users.id to text if it is still uuid.
--   5. Recreates public_user_profiles from the canonical definition
--      in 20260419_admin_role.sql, with grants and security_invoker.
--
-- We deliberately do NOT recreate the old `users_select USING (true)`
-- policy: 20260419_rls_lockdown.sql intentionally removed it because
-- it leaked every user's email / balance / phone to the anon key.
-- All user reads now go through the Express server using the service
-- role key. If a narrower realtime policy is needed later, add it in
-- a dedicated migration.
--
-- Idempotent: every step short-circuits cleanly on a database where
-- users.id is already text and/or the view already matches.

BEGIN;

DO $$
DECLARE
  v_current_type text;
  v_policy       record;
BEGIN
  -- (1) Drop every policy on public.users unconditionally so this
  -- migration succeeds whether or not 20260419_rls_lockdown.sql ran.
  -- Dropping is safe even when there is nothing to drop.
  FOR v_policy IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'users'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', v_policy.policyname);
  END LOOP;

  -- (2) Drop dependent view so ALTER TYPE (below) can proceed. This
  -- also fixes the case where 20260505 ran partially on some envs.
  DROP VIEW IF EXISTS public.public_user_profiles;

  SELECT data_type INTO v_current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'users'
     AND column_name  = 'id';

  IF v_current_type = 'uuid' THEN
    -- (3) The UUID default returns uuid and would be invalid on a
    -- text column. Clerk ids are supplied explicitly by the webhook.
    ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

    -- (4) Cast existing UUID values to text. The primary key / index
    -- is rebuilt automatically by PostgreSQL.
    ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;

-- (5) Recreate the admin-facing view. Mirrors the definition in
-- 20260419_admin_role.sql so that reapplying this file is a no-op on
-- databases that never needed the type change.
CREATE VIEW public.public_user_profiles AS
SELECT
  id,
  name,
  "numericId",
  rank,
  "totalEarned",
  "referralActiveCount",
  "isAdmin"
FROM public.users;

ALTER VIEW public.public_user_profiles SET (security_invoker = on);
GRANT SELECT ON public.public_user_profiles TO anon, authenticated;

COMMIT;
