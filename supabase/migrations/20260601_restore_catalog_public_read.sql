-- Re-assert the public-read contract for catalog tables.
--
-- Background: admin-created microjobs were not appearing on the public
-- Micro Freelancing page because RLS / GRANT state in production had
-- drifted from the repo (anon SELECT was effectively returning zero
-- rows). The schema (`supabase/schema.sql`) declared `tasks_sel ON tasks
-- FOR SELECT USING (true)` but a manual change in the dashboard could
-- have dropped it. This migration restores the intended state for every
-- read-only public catalog table and is safe to re-run.
--
-- Also defensively re-grants SELECT to `anon` and `authenticated`. The
-- realtime publication is asserted in a sibling migration so the two
-- concerns can be applied independently.

BEGIN;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['tasks', 'driveOffers', 'products', 'ludoTournaments'])
  LOOP
    -- Make sure RLS is on (otherwise CREATE POLICY is a no-op).
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Re-create the canonical "anyone can read" policy. Using
    -- DROP IF EXISTS + CREATE keeps the migration idempotent without
    -- relying on `CREATE POLICY IF NOT EXISTS` (Postgres 15+ only).
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_sel', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT USING (true)', tbl || '_sel', tbl);

    -- Privileges: SELECT for anon + authenticated. The service-role key
    -- used by the admin server bypasses RLS, so we don't need to grant
    -- anything to it explicitly.
    EXECUTE format('GRANT SELECT ON public.%I TO anon, authenticated', tbl);
  END LOOP;
END $$;

COMMIT;
