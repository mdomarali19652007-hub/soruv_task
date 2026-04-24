-- 20260503_reseed_admins_after_clerk.sql
--
-- Re-apply the isAdmin flag to the historical admin emails after they
-- sign up again via Clerk. Run this AFTER both admins have signed in
-- through the new Clerk flow so the rows exist (the Clerk user.created
-- webhook inserts them -- see src/server/webhooks.ts).
--
-- Until you run this, the admins still work because the server falls
-- back to LEGACY_ADMIN_EMAILS in src/server/admin.ts, but the
-- client-side `user.isAdmin` flag in App.tsx will be false and the
-- admin-only UI routes will be hidden. Running this lights those up.
--
-- No-op if the rows are not present yet; re-run after signup.

UPDATE public.users
   SET "isAdmin" = true
 WHERE email IN ('soruvislam51@gmail.com', 'shovonali885@gmail.com');
