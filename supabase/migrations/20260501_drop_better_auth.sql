-- 20260501_drop_better_auth.sql
--
-- Remove Better Auth's schema after the Clerk migration. All
-- session/authentication state now lives inside Clerk; our app
-- `users` table still owns the profile (balances, referrals, etc.)
-- and its `id` column now stores Clerk user ids (e.g. `user_2abc...`).
--
-- The Better Auth adapter originally created four tables via
-- `npx @better-auth/cli migrate` (`user`, `session`, `account`,
-- `verification`). We drop all four with CASCADE to remove any FKs
-- that were pointed at them.

DROP TABLE IF EXISTS "verification" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;
