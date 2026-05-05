-- Notices marquee for the Home screen.
--
-- Provides a multi-row store for the rotating-notice ticker that sits
-- on top of the welcome banner. Replaces the single `settings.globalNotice`
-- text field by lifting it into a proper table — the legacy field is
-- left in place for backward compatibility, but the SPA prefers
-- `notices` when any active row exists.
--
-- Columns:
--   id          UUID primary key.
--   text        Notice body (Bangla or English; rendered as-is).
--   language    'bn' | 'en' (free-form text but the UI accepts those two).
--   is_active   When false the row is hidden from the public marquee.
--   created_at  Used for ordering: the SPA shows newest-first.

CREATE TABLE IF NOT EXISTS public.notices (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text        TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'bn',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mirror SPA naming (camelCase id -> snake-case columns are queried by
-- their actual names; the front-end maps them when reading).
CREATE INDEX IF NOT EXISTS notices_active_created_idx
  ON public.notices (is_active, created_at DESC);

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notices_sel_public" ON public.notices;
DROP POLICY IF EXISTS "notices_admin_all"  ON public.notices;

-- Anyone (anon + authed) can read the active marquee.
CREATE POLICY "notices_sel_public"
  ON public.notices
  FOR SELECT
  USING (true);

-- Server-side admin (service-role) does all writes through the existing
-- adminInsert/Update/Delete helpers, which bypass RLS. We deliberately
-- do NOT expose write policies to authenticated callers — only the
-- admin API can mutate notices.

-- Realtime: add to the publication so newly-added notices appear on
-- connected clients without a page reload.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notices'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.notices';
  END IF;
END $$;
