-- ============================================================
-- Migration: DB-backed admin role.
--
-- Context:
--   Admin authorization was previously hard-coded in two places:
--     - src/server/routes.ts  (requireAdmin middleware)
--     - src/App.tsx            (client-side `isAdmin` flag)
--   Both used the same ADMIN_EMAILS list, making rotation awkward
--   and diverging easily. This migration introduces a boolean
--   `users.isAdmin` column so both the server and the client can
--   agree by reading a single source of truth.
--
-- Strategy:
--   1. Add the column (defaults to false).
--   2. Seed it true for the historical admin emails.
--   3. The server /api/me endpoint returns the full users row,
--      which already includes this new column, so the client can
--      read `user.isAdmin` directly.
--
-- Safe to re-run: every statement is idempotent.
-- ============================================================

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT FALSE;

-- Historical admin seed. Remove or edit before deploying to a new
-- environment where the emails below do not exist.
UPDATE users
SET "isAdmin" = TRUE
WHERE LOWER(email) IN ('soruvislam51@gmail.com', 'shovonali885@gmail.com');

-- Expose the flag on the narrow public profile view so the client
-- can tell whether the currently signed-in user is an admin without
-- hitting /api/me for the full record. (Admin flag is not sensitive;
-- exposing it does not leak PII.)
DROP VIEW IF EXISTS public_user_profiles;
CREATE VIEW public_user_profiles AS
SELECT
  id,
  name,
  "numericId",
  rank,
  "totalEarned",
  "referralActiveCount",
  "isAdmin"
FROM users;

ALTER VIEW public_user_profiles SET (security_invoker = on);
GRANT SELECT ON public_user_profiles TO anon, authenticated;

COMMIT;
