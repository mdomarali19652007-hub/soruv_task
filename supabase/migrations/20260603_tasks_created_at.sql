-- Add a `createdAt` column to `tasks` so the client can order the
-- public listings by recency. Without this, the order of dynamic tasks
-- on the Micro Freelancing / Social / Gmail / Premium pages depends on
-- whatever order Supabase happens to return rows in, which is not
-- guaranteed and made it confusing for admins to verify a brand-new
-- task had actually shipped.
--
-- Default to `now()` so existing rows get a sensible value (they will
-- all sort together at the bottom, which is fine -- they predate this
-- migration).

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS tasks_created_at_desc_idx
  ON public.tasks ("createdAt" DESC);
