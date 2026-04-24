-- 20260505_users_id_to_text_with_view.sql
--
-- Follow-up to 20260504_users_id_to_text.sql.
--
-- The previous migration tried to run
--   ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text
-- unconditionally, but on live databases that applied
-- 20260419_admin_role.sql the column is referenced by the
-- `public_user_profiles` VIEW. PostgreSQL refuses to alter the type
-- of a column that a view depends on, so the ALTER aborted with
--   ERROR: cannot alter type of a column used by a view or rule
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
-- Fix: drop the view, convert the column (stripping any UUID default
-- left over from the Better Auth era), and recreate the view from
-- the canonical definition in 20260419_admin_role.sql.
--
-- Idempotent: all steps short-circuit when the column is already
-- `text` and/or the view already matches.

BEGIN;

DO $$
DECLARE
  v_current_type text;
BEGIN
  SELECT data_type INTO v_current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'users'
     AND column_name  = 'id';

  IF v_current_type = 'uuid' THEN
    -- Drop dependent view so ALTER TYPE can proceed. We recreate it
    -- below with the same definition/grants.
    DROP VIEW IF EXISTS public.public_user_profiles;

    -- Strip the UUID default (uuid_generate_v4()) if present -- it
    -- returns uuid and would be invalid on a text column. Clerk ids
    -- are supplied explicitly by the webhook, so no default is needed.
    ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;

    -- Cast existing UUID values to text. The primary key / index is
    -- rebuilt automatically by PostgreSQL.
    ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text;
  END IF;
END $$;

-- Recreate the admin-facing view. Mirrors the definition in
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
