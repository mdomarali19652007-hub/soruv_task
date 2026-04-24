-- 20260507_users_id_drop_fks_before_alter.sql
--
-- Third follow-up to the `users.id UUID -> TEXT` cutover.
--
-- Previous attempts:
--   * 20260504_users_id_to_text.sql          -- bare ALTER; failed on view.
--   * 20260505_users_id_to_text_with_view.sql -- drops view; failed on policy.
--   * 20260506_users_id_to_text_drop_policies.sql
--       -- drops view + policies, but fails on databases where
--          `public.users.id` still has a FOREIGN KEY constraint
--          (typically `users_id_fkey` pointing at auth.users(id) from
--          the pre-Clerk Better Auth / Supabase Auth era).
--
-- The failure looks like:
--   ERROR: 42804: foreign key constraint "users_id_fkey" cannot be
--   implemented
--   DETAIL:  Key columns "id" and "id" are of incompatible types:
--            text and uuid.
--   CONTEXT: SQL statement
--     "ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text"
--
-- PostgreSQL re-validates every FK touching the column when its type
-- changes, and there is no in-place way to mutate a FK's target type.
-- Clerk issues ids that are NOT uuids (e.g. `user_2abcDEF...`), so the
-- FK to `auth.users(id)` can never be satisfied again. We drop it for
-- good and do NOT recreate it; the Clerk webhook in
-- `supabase/functions/clerk-webhook/index.ts` is now the authoritative
-- source of truth for `public.users` rows.
--
-- This migration is fully idempotent and forward-only. It:
--   1. Drops every RLS policy on public.users (repeat of 20260506
--      so the migration self-heals on any starting state).
--   2. Drops the `public_user_profiles` view (depends on users.id).
--   3. Drops every FOREIGN KEY constraint defined ON public.users
--      (in practice just `users_id_fkey`, but we enumerate to be
--      robust).
--   4. Strips the old `uuid_generate_v4()` default on users.id.
--   5. Casts users.id to text if it is still uuid.
--   6. Recreates `public_user_profiles` with security_invoker + grants.
--
-- We intentionally do NOT recreate:
--   * the old `users_select USING (true)` policy  (leaked PII; see
--     20260419_rls_lockdown.sql),
--   * any FK from public.users.id to auth.users(id)  (Clerk ids are
--     not uuids and Supabase Auth is no longer the identity provider).

BEGIN;

DO $$
DECLARE
  v_current_type text;
  v_policy       record;
  v_fk           record;
BEGIN
  -- (1) Drop every policy on public.users. Safe on a freshly-locked-
  -- down DB (nothing to drop) and on a DB that still carries the
  -- original permissive `users_select` policy from schema.sql.
  FOR v_policy IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'users'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.users',
      v_policy.policyname
    );
  END LOOP;

  -- (2) Drop the dependent view so ALTER TYPE can proceed. Recreated
  -- at the bottom of this file.
  DROP VIEW IF EXISTS public.public_user_profiles;

  -- (3) Drop every FK constraint attached to public.users. This is
  -- the step that 20260506 was missing. In the Supabase/Better Auth
  -- era, `public.users.id` was `uuid REFERENCES auth.users(id)`, so
  -- PostgreSQL refuses to change its type while that FK exists.
  -- Clerk owns identity now, so the FK is obsolete and is not
  -- recreated.
  FOR v_fk IN
    SELECT conname
      FROM pg_constraint
     WHERE contype = 'f'
       AND conrelid = 'public.users'::regclass
  LOOP
    EXECUTE format(
      'ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I',
      v_fk.conname
    );
  END LOOP;

  SELECT data_type INTO v_current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'users'
     AND column_name  = 'id';

  IF v_current_type = 'uuid' THEN
    -- (4) uuid_generate_v4() returns uuid and is invalid on a text
    -- column. Clerk ids are supplied explicitly by the webhook, so
    -- no replacement default is installed.
    ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

    -- (5) Cast existing UUID values to text. PostgreSQL rebuilds the
    -- primary-key index automatically.
    ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;

-- (6) Recreate the admin-facing view. Mirrors the canonical definition
-- in 20260419_admin_role.sql so reapplying this file is a no-op on
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
