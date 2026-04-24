-- 20260502_clerk_cutover_delete_legacy_admins.sql
--
-- One-shot cleanup for the Clerk cutover.
--
-- Before Clerk, users.id was a Postgres UUID written by Better Auth.
-- After Clerk, users.id is a Clerk id (e.g. "user_2abc..."). The two
-- legacy admin rows left in public.users from the Better Auth era
-- cannot be re-used with Clerk because their ids will never match.
--
-- We simply drop them here and rely on LEGACY_ADMIN_EMAILS in
-- src/server/admin.ts to keep the admin fallback working until the
-- admins sign up again via Clerk. Once they do, the Clerk webhook
-- inserts a fresh row keyed by their Clerk id; run migration
-- 20260503_reseed_admins_after_clerk.sql to persist the isAdmin flag
-- on the new rows.
--
-- Safe to run even when the rows are already gone (no-op).

DELETE FROM public.users
 WHERE email IN ('soruvislam51@gmail.com', 'shovonali885@gmail.com');
