-- Make sure the catalog tables that the SPA subscribes to are part of
-- the `supabase_realtime` publication. Without this, the initial
-- `select(*)` will succeed but realtime INSERT/UPDATE/DELETE events
-- will never fire, so newly admin-created rows would only appear after
-- a manual page reload.
--
-- `pg_publication_tables` is checked first so this is a no-op when the
-- table is already in the publication.

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['tasks', 'driveOffers', 'products', 'ludoTournaments', 'newsPosts'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
