# Soruv Task

A Bengali earning platform SPA with news, micro-tasks, finance, e-commerce, SMM, and Ludo tournament flows.

Stack:

- Frontend: Vite + React 19 + Tailwind CSS + Motion
- Auth: [Better Auth](https://better-auth.com) (cookie sessions) backed by Postgres
- Database / Realtime / Storage: Supabase Postgres
- Server: Express ([`server.ts`](server.ts:1)) for local dev with Socket.io (Ludo multiplayer), plus a Vercel serverless wrapper at [`api/index.ts`](api/index.ts:1)

## Prerequisites

- Node.js 20+
- A Supabase project (free tier is fine)
- A Better Auth secret and, optionally, a Google OAuth client

## 1. Clone and install

```bash
git clone https://github.com/mdomarali19652007-hub/soruv_task.git
cd soruv_task
npm install
cp .env.example .env.local
```

## 2. Configure environment variables

Fill in [`.env.example`](.env.example:1) / `.env.local` with values from your Supabase dashboard and a freshly generated Better Auth secret (`openssl rand -hex 32`).

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by Better Auth for its auth tables. Use the Supabase "Connection Pooling" URL (port 6543). |
| `BETTER_AUTH_SECRET` | 32-byte hex secret signing session cookies. |
| `BETTER_AUTH_URL` | Public URL your server is reachable at (e.g. `http://localhost:3000` in dev). Must match your deployed domain in production. |
| `SUPABASE_URL` | Supabase project URL (server-side). |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only; bypasses RLS). |
| `VITE_SUPABASE_URL` | Same project URL, exposed to the browser for Realtime. |
| `VITE_SUPABASE_ANON_KEY` | Anon key, exposed to the browser. Only for public reads + realtime. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | (optional) Google OAuth credentials. |
| `CORS_ALLOWED_ORIGINS` | (optional) Comma-separated extra origins allowed to call the API. |
| `SITE_URL` | (optional) Public site origin. Added to the CORS allowlist. |

Never commit `.env.local`. Service role key and Better Auth secret must stay server-side.

## 3. Provision Supabase

1. In the Supabase SQL editor, run [`supabase/schema.sql`](supabase/schema.sql:1) to create app tables, indexes, and the initial `settings` row.
2. Run [`supabase/migrations/20260419_rls_lockdown.sql`](supabase/migrations/20260419_rls_lockdown.sql:1) to tighten RLS so anon clients can no longer read sensitive tables directly. (This is required -- the initial schema shipped with permissive SELECT USING (true) policies.)
3. Create a Storage bucket named `uploads` (public-read is fine for screenshots; access is mediated server-side).
4. Enable Realtime on the publication listed at the bottom of `schema.sql` (the migration leaves public catalog tables in the publication).

## 4. Provision Better Auth tables

Better Auth maintains its own `user`, `account`, `session`, and `verification` tables. Generate + apply its schema:

```bash
npx @better-auth/cli@latest migrate
```

This reads `DATABASE_URL` and applies the migrations against Postgres.

## 5. Google OAuth (optional)

If you want Sign in with Google:

1. Create credentials at https://console.cloud.google.com/apis/credentials
2. Add authorized redirect URIs for every environment, for example:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-vercel-app.vercel.app/api/auth/callback/google`
3. Fill `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` and your deployment env.

## 6. Run locally

```bash
npm run dev
```

This starts the Express app on http://localhost:3000, serving the Vite dev middleware, Better Auth (`/api/auth/*`), and the application API (`/api/*`). Socket.io Ludo multiplayer is only available in this mode.

## 7. Type-check

```bash
npm run lint   # tsc --noEmit
```

## Deployment

The repository ships a Vercel config (`vercel.json`) that builds the static frontend and mounts [`api/index.ts`](api/index.ts:1) as a serverless function.

Important serverless caveats:

- Socket.io / Ludo multiplayer does NOT run on Vercel (no persistent WebSocket). Deploy [`server.ts`](server.ts:1) to a long-running host (Railway, Fly, Render) if you need real-time Ludo.
- The serverless rate limiter is per-instance memory. For production scale, back it with Redis/Upstash.

Minimum Vercel env vars: every variable listed above except `VITE_*` (those are build-time).

## Security notes

- All mutating client traffic MUST go through `/api/*` endpoints, which authenticate via Better Auth cookies and use the Supabase service role key. Direct writes from the browser are blocked by RLS.
- `/api/validate-referral` returns only `{ valid: boolean }`; it does NOT leak user ids.
- Rate limits are applied to `/api/register`, `/api/validate-referral`, `/api/auth/*`, and `/api/admin/*`.
- CORS is an explicit allowlist (see [`src/server/cors-config.ts`](src/server/cors-config.ts:1)). Add your production origin via `SITE_URL` or `CORS_ALLOWED_ORIGINS`.

## Repository layout

```
src/App.tsx                # SPA entry (monolithic -- slated for split)
src/lib/                   # client helpers (auth-client, database, admin-api)
src/server/                # Express router, Better Auth config, service-role client
src/utils/sanitize.ts      # input sanitization helpers
supabase/schema.sql        # initial schema + seed
supabase/migrations/*.sql  # follow-up migrations (run after schema.sql)
server.ts                  # long-running dev/prod server with Socket.io
api/index.ts               # Vercel serverless entry
```
