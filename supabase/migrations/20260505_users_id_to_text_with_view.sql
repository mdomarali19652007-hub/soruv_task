-- 20260505_users_id_to_text_with_view.sql
--
-- Follow-up to 20260504_users_id_to_text.sql.
--
-- The previous migration tried to run
--   ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text
-- unconditionally, but on live databases the column is referenced by:
--   (a) the `public_user_profiles` VIEW (added in 20260419_admin_role.sql), and
--   (b) any RLS policy still attached to `users` (e.g. the original
--       `users_select` policy from schema.sql, if 20260419_rls_lockdown.sql
--       was never applied).
-- PostgreSQL refuses `ALTER COLUMN ... TYPE` while either kind of
-- dependency exists, so the ALTER aborted with one of:
--   ERROR: cannot alter type of a column used by a view or rule
--   ERROR: cannot alter type of a column used in a policy definition
-- and `users.id` stayed UUID.
--
-- Symptom: the Clerk webhook tries to upsert rows keyed by Clerk ids
-- like `user_3Cn00zRHMaOh4t3Zf44qFx5Y3Dt`, Postgres rejects them with
--   invalid input syntax for type uuid: "user_..."
-- the edge function then cascade-deletes the Clerk user, Clerk fires
-- `user.deleted`, which also fails (same UUID cast error) and -- by
-- the time we retry the DELETE against Clerk -- the user has been
-- purged on the other side, so the Clerk REST call returns 404. In
-- short: admin Dashboard shows "user not found" after every signup
-- because the profile row never got written and the Clerk user got
-- rolled back.
--
-- Fix:
--   1. Drop every RLS policy currently attached to public.users.
--   2. Drop the public_user_profiles view.
--   3. Strip any leftover UUID default from users.id.
--   4. Cast users.id to text.
--   5. Recreate the view from the canonical 20260419_admin_role.sql
--      definition (with grants and security_invoker).
--
-- We deliberately do NOT recreate the old `users_select USING (true)`
-- policy: 20260419_rls_lockdown.sql intentionally removed it because
-- it leaked every user's email / balance / phone to the anon key.
-- All user reads now go through the Express server using the service
-- role key. If you want realtime on `users` back, add a narrower
-- policy in a later migration.
--
-- Idempotent: each step short-circuits when the column is already
-- `text` and/or the view already matches.

BEGIN;

DO $$
DECLARE
  v_current_type text;
  v_policy       record;
BEGIN
  SELECT data_type INTO v_current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'users'
     AND column_name  = 'id';

  IF v_current_type = 'uuid' THEN
    -- (1) Drop every policy attached to public.users so ALTER TYPE
    -- is not blocked by policy expressions referencing `id`.
    FOR v_policy IN
      SELECT policyname
        FROM pg_policies
       WHERE schemaname = 'public'
         AND tablename  = 'users'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', v_policy.policyname);
    END LOOP;

    -- (2) Drop the dependent view.
    DROP VIEW IF EXISTS public.public_user_profiles;

    -- (3) Strip the UUID default (uuid_generate_v4()) if present -- it
    -- returns uuid and would be invalid on a text column. Clerk ids
    -- are supplied explicitly by the webhook, so no default is needed.
    ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

    -- (4) Cast existing UUID values to text. The primary key / index
    -- is rebuilt automatically by PostgreSQL.
    ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;

-- (5) Recreate the admin-facing view. Mirrors the definition in
-- 20260419_admin_role.sql so that reapplying this file is a no-op on
-- databases that never needed the type change.
DROP VIEW IF EXISTS public.public_user_profiles;
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
