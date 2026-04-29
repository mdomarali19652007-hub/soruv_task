# Soruv Task

A Bengali earning platform SPA with news, micro-tasks, finance, e-commerce, SMM, and Ludo tournament flows.

Stack:

- Frontend: Vite + React 19 + Tailwind CSS + Motion
- Auth: [Clerk](https://clerk.com) via custom headless flows (see [`src/lib/auth-client.ts`](src/lib/auth-client.ts:1))
- Database / Realtime / Storage: Supabase Postgres
- Server: Express ([`server.ts`](server.ts:1)) for local dev with Socket.io (Ludo multiplayer), plus a Vercel serverless wrapper at [`api/index.ts`](api/index.ts:1)

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- A [Clerk](https://clerk.com) application (publishable + secret keys, and a webhook signing secret)

## 1. Clone and install

```bash
git clone https://github.com/mdomarali19652007-hub/soruv_task.git
cd soruv_task
npm install
cp .env.example .env.local
```

## 2. Configure environment variables

Fill in [`.env.example`](.env.example:1) / `.env.local` with values from your Supabase and Clerk dashboards.

| Variable | Purpose |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (safe to embed in the browser bundle). From Clerk dashboard -> API Keys. |
| `CLERK_SECRET_KEY` | Clerk server-side secret (bans users, reads user details, etc.). MUST stay server-side. |
| `APP_PUBLIC_URL` | Public URL your server is reachable at (e.g. `http://localhost:3000` in dev). Used as the referral link base. |

The Clerk webhook signing secret (`CLERK_WEBHOOK_SECRET`) is NOT set on the Node app. It is a Supabase function secret -- see section 4a.
| `SUPABASE_URL` | Supabase project URL (server-side). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only; bypasses RLS). |
| `VITE_SUPABASE_URL` | Same project URL, exposed to the browser for Realtime. |
| `VITE_SUPABASE_ANON_KEY` | Anon key, exposed to the browser. Only for public reads + realtime. |
| `CORS_ALLOWED_ORIGINS` | (optional) Comma-separated extra origins allowed to call the API. |
| `SITE_URL` | (optional) Public site origin. Added to the CORS allowlist. |

Never commit `.env.local`. The Clerk secret key and Supabase service-role key must stay server-side.

## 3. Provision Supabase

1. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql:1) to create app tables, indexes, and the initial `settings` row.
2. Run [`supabase/migrations/20260419_rls_lockdown.sql`](supabase/migrations/20260419_rls_lockdown.sql:1) to tighten RLS so anon clients can no longer read sensitive tables directly. (This is required -- the initial schema shipped with permissive SELECT USING (true) policies.)
3. Run [`supabase/migrations/20260419_admin_role.sql`](supabase/migrations/20260419_admin_role.sql:1) to add the `users.isAdmin` column and seed the historical admin emails. The server and client both read this column as the source of truth for admin authorization.
3. Create a Storage bucket named `uploads` (public-read is fine for screenshots; access is mediated server-side).
4. Enable Realtime on the publication listed at the bottom of `schema.sql` (the migration leaves public catalog tables in the publication).

## 4. Configure Clerk

1. Create a Clerk application at https://dashboard.clerk.com.
2. Under **User & Authentication**, enable **Email address + Password** and **Google** as the sign-in options. Make `email_address` the only required identifier -- we collect `name`/`phone`/`country`/`age`/`refCode` ourselves and store them on the Clerk user's `unsafeMetadata`.
3. Under **Sessions**, set the session lifetime to 7 days (matches the prior Better Auth config).
4. Copy the publishable key into `VITE_CLERK_PUBLISHABLE_KEY` and the secret key into `CLERK_SECRET_KEY`.
5. Deploy the Clerk webhook as a Supabase Edge Function (see section 4a below) and point the Clerk dashboard webhook at its public URL.

The `user.created` webhook is what creates the app-level `users` row, validates the referral code, and generates the 6-digit `numericId`. The handler lives at [`supabase/functions/clerk-webhook/index.ts`](supabase/functions/clerk-webhook/index.ts:1) and runs on Supabase Edge Functions (Deno). There is intentionally **no** Express route for webhooks.

### 4a. Deploy the Clerk webhook edge function

```bash
# Link the repo to your Supabase project once:
supabase link --project-ref <your-project-ref>

# Set the function's secrets (kept out of the function's bundle):
supabase secrets set \
  CLERK_WEBHOOK_SECRET=whsec_xxx \
  CLERK_SECRET_KEY=sk_test_xxx \
  APP_PUBLIC_URL=https://your-app.example.com

# Deploy. This uploads supabase/functions/clerk-webhook/index.ts.
supabase functions deploy clerk-webhook --no-verify-jwt
```

We pass `--no-verify-jwt` because Clerk is the authenticator here, not Supabase -- the function performs its own Svix signature verification against `CLERK_WEBHOOK_SECRET` before trusting the body.

The deployed URL will be:

```
https://<project-ref>.supabase.co/functions/v1/clerk-webhook
```

Back in the Clerk dashboard, create a webhook endpoint targeting that URL, subscribe to `user.created` and `user.deleted`, and paste its signing secret into the function's `CLERK_WEBHOOK_SECRET` env var.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically into every Supabase Edge Function, so you do not need to set them explicitly.

## 5. Email delivery

Clerk handles verification and password-reset email delivery for you -- no provider setup required. The UI uses the 6-digit code flow (`prepareEmailAddressVerification` + `attemptEmailAddressVerification`, `reset_password_email_code`); see [`src/features/auth/EmailVerificationOverlay.tsx`](src/features/auth/EmailVerificationOverlay.tsx:1) and [`src/features/auth/ResetPasswordView.tsx`](src/features/auth/ResetPasswordView.tsx:1).

## 6. Google OAuth

Enable Google as a social provider inside the Clerk dashboard. By default Clerk hosts the OAuth credentials; to keep the consent screen on your own brand, supply your own Google client id/secret in Clerk's dashboard.

After a Google sign-in we still require a referral code. The user is redirected back to the app, where the existing "referral code prompt" modal (see [`src/App.tsx`](src/App.tsx:316)) POSTs to [`/api/register/google-profile`](src/server/routes.ts:241) to create the `users` row.

## 7. Run locally

```bash
npm run dev
```

This starts the Express app on http://localhost:3000, serving the Vite dev middleware and the application API (`/api/*`). Socket.io Ludo multiplayer is only available in this mode.

Webhooks from Clerk go directly to the Supabase Edge Function, so you do NOT need to expose `localhost` with ngrok to receive them. For fast local iteration on the function itself, run `supabase functions serve clerk-webhook` and point a dev Clerk webhook at the tunnel Supabase prints.

## 8. Type-check, lint, and test

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint .
npm run format      # prettier --write .
npm test            # vitest run (unit tests under tests/)
```

The `lint:strict` script (`eslint . --max-warnings 0`) is the target for CI once the legacy warnings in [`src/App.tsx`](src/App.tsx:1) are cleaned up.

## Deployment

The repository ships a Vercel config (`vercel.json`) that builds the static frontend and mounts [`api/index.ts`](api/index.ts:1) as a serverless function.

Important serverless caveats:

- Socket.io / Ludo multiplayer does NOT run on Vercel (no persistent WebSocket). Deploy [`server.ts`](server.ts:1) to a long-running host (Railway, Fly, Render) if you need real-time Ludo.
- The serverless rate limiter is per-instance memory. For production scale, back it with Redis/Upstash.

Minimum Vercel env vars: every variable listed above except `VITE_*` (those are build-time).

## Multi-host deployments (admin / public split)

Some deployments serve the admin UI from a dedicated subdomain (for
example `admin.example.com`) while the public earning app is served
from the apex (`example.com`). When that's the case, **both
deployments MUST point at the same Supabase project**, otherwise
admin writes (which use the server's `SUPABASE_SERVICE_ROLE_KEY`) and
public reads (which use the SPA's `VITE_SUPABASE_ANON_KEY`) operate
on different databases and admin-created rows -- including microjob
tasks -- never appear on the public side.

Concretely, all four of these env vars must resolve to the same
Supabase project ref (the `<ref>.supabase.co` subdomain) on every
deployment:

| Env var | Where it's read |
| --- | --- |
| `SUPABASE_URL` | server, [`src/server/supabase-admin.ts`](src/server/supabase-admin.ts:1) |
| `SUPABASE_SERVICE_ROLE_KEY` | server, [`src/server/supabase-admin.ts`](src/server/supabase-admin.ts:1) |
| `VITE_SUPABASE_URL` | browser, [`src/lib/supabase.ts`](src/lib/supabase.ts:1) |
| `VITE_SUPABASE_ANON_KEY` | browser, [`src/lib/supabase.ts`](src/lib/supabase.ts:1) |

The deployed server exposes a diagnostic at `GET /api/health/supabase`
that returns the configured project ref. Fetch it from each host and
compare:

```bash
curl https://admin.example.com/api/health/supabase
curl https://example.com/api/health/supabase
# Both should print the same { "projectRef": "...", "configured": true }.
```

Also confirm the project ref baked into the SPA bundle by viewing
source on each host -- the anon URL is inlined into the JS, so a
quick page-source search for `.supabase.co` will surface it.

If the two refs ever drift, align the env on the public deployment
to match the admin deployment (or vice versa), redeploy, and re-run
the curl above.

## Security notes

- All mutating client traffic MUST go through `/api/*` endpoints, which authenticate via Clerk (session cookies / Bearer token) and use the Supabase service role key. Direct writes from the browser are blocked by RLS.
- `/api/validate-referral` returns only `{ valid: boolean }`; it does NOT leak user ids.
- Rate limits are applied to `/api/validate-referral` and `/api/admin/*`. Signup throttling is handled by Clerk.
- CORS is an explicit allowlist (see [`src/server/cors-config.ts`](src/server/cors-config.ts:1)). Add your production origin via `SITE_URL` or `CORS_ALLOWED_ORIGINS`.

## Repository layout

```
src/App.tsx                # SPA entry (monolithic -- slated for split)
src/lib/                   # client helpers (auth-client, database, admin-api)
src/server/                # Express router, Clerk webhook, service-role client
src/utils/sanitize.ts      # input sanitization helpers
supabase/schema.sql        # initial schema + seed
supabase/migrations/*.sql  # follow-up migrations (run after schema.sql)
server.ts                  # long-running dev/prod server with Socket.io
api/index.ts               # Vercel serverless entry
```
