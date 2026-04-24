-- 20260504_users_id_to_text.sql
--
-- Fix: Clerk `user.created` webhook fails with
--   invalid input syntax for type uuid: "user_3Cn00zRHMaOh4t3Zf44qFx5Y3Dt"
-- because `public.users.id` is still `UUID` on live databases that were
-- bootstrapped before the Clerk migration.
--
-- `supabase/schema.sql` already declares `users.id TEXT PRIMARY KEY`
-- (see line 40), so new Supabase projects created from the schema file
-- are already fine. This migration fixes in-place any database that
-- started on UUID during the Better Auth era.
--
-- Safe to run repeatedly: the `DO` block is a no-op when the column is
-- already `text`.
--
-- All foreign-key-ish references in this schema use `TEXT` for the
-- `userId` columns already (see withdrawals.userId, messages.userId,
-- uploads.userId, etc.), so no cascading changes are needed.

DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type INTO current_type
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'users'
     AND column_name = 'id';

  IF current_type = 'uuid' THEN
    -- USING clause: cast the existing UUID to text. Any Clerk ids
    -- written AFTER this migration are already text and land as-is.
    EXECUTE 'ALTER TABLE public.users ALTER COLUMN id TYPE text USING id::text';
  END IF;
END $$;
