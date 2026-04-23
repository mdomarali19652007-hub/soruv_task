-- Enforce uniqueness of users.numericId.
--
-- Context: /api/register and /api/register/google-profile generate a 6-digit
-- numericId with a pre-check SELECT + 10-attempt retry loop. That loop is
-- racy under concurrent signups: two processes can both see "no existing
-- row" for the same candidate and then both insert it. A unique index makes
-- the second insert fail with SQLSTATE 23505, which the application now
-- handles by picking a new candidate and retrying.
--
-- Safety: use a partial index that ignores empty/NULL numericIds so any
-- legacy rows (or transiently-empty rows during profile creation) do not
-- block the migration. Before running this in production, verify there are
-- no real duplicates:
--
--   SELECT "numericId", count(*)
--   FROM users
--   WHERE "numericId" IS NOT NULL AND "numericId" <> ''
--   GROUP BY 1
--   HAVING count(*) > 1;
--
-- and fix any rows returned.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS users_numericid_unique
  ON users ("numericId")
  WHERE "numericId" IS NOT NULL AND "numericId" <> '';

COMMIT;
