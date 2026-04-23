/**
 * Shared CORS configuration for both the long-running Express server
 * (`server.ts`) and the Vercel serverless entry (`api/index.ts`).
 *
 * We keep a strict allowlist because the API relies on cookie-based
 * sessions (Better Auth). Wildcard origins + credentials is a standard
 * CSRF footgun.
 *
 * Extra origins can be supplied via the `CORS_ALLOWED_ORIGINS` env var
 * as a comma-separated list.
 */

import type { CorsOptions } from 'cors';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Build the list of origins that are ALWAYS allowed (exact-match).
 *
 * Sources (merged, de-duplicated):
 *   - `DEFAULT_ALLOWED_ORIGINS`        -- local dev
 *   - `BETTER_AUTH_URL` env            -- public server URL
 *   - `SITE_URL` env                   -- public site URL
 *   - `CORS_ALLOWED_ORIGINS` env       -- comma-separated extras
 *   - Vercel deployment URLs:
 *       `VERCEL_URL`                       (per-deployment, e.g. my-app-abc123.vercel.app)
 *       `VERCEL_PROJECT_PRODUCTION_URL`    (the stable prod URL)
 *       `VERCEL_BRANCH_URL`                (the branch alias)
 *     Vercel exposes these without a scheme; we prepend `https://`.
 */
function buildAllowlist(): string[] {
  const extras = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const authUrl = process.env.BETTER_AUTH_URL?.trim();
  const siteUrl = process.env.SITE_URL?.trim();

  const vercelUrls = [
    process.env.VERCEL_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_BRANCH_URL,
  ]
    .map((v) => v?.trim())
    .filter((v): v is string => Boolean(v))
    .map((v) => (v.startsWith('http://') || v.startsWith('https://') ? v : `https://${v}`));

  return Array.from(
    new Set([
      ...DEFAULT_ALLOWED_ORIGINS,
      ...(authUrl ? [authUrl] : []),
      ...(siteUrl ? [siteUrl] : []),
      ...vercelUrls,
      ...extras,
    ]),
  );
}

export const allowedOrigins = buildAllowlist();

/**
 * Regex patterns that match allowed origins. Currently supports Vercel
 * preview deployments for the CURRENT project (via `VERCEL_PROJECT_ID`
 * or by matching the known production hostname's leading token).
 *
 * We keep this permissive enough for preview URLs like
 * `my-project-git-feature-branch-acme.vercel.app` without opening
 * the door to every `*.vercel.app` origin.
 */
function buildAllowedOriginPatterns(): RegExp[] {
  const patterns: RegExp[] = [];

  const prod =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (prod) {
    // e.g. "soruv-task.vercel.app" -> "soruv-task"
    const host = prod.replace(/^https?:\/\//, '').split('.')[0];
    if (host) {
      // Matches "https://soruv-task.vercel.app" AND
      // "https://soruv-task-<anything>.vercel.app" preview URLs.
      const escaped = host.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(new RegExp(`^https://${escaped}(?:-[a-z0-9-]+)?\\.vercel\\.app$`, 'i'));
    }
  }

  return patterns;
}

export const allowedOriginPatterns = buildAllowedOriginPatterns();

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  return allowedOriginPatterns.some((re) => re.test(origin));
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser callers (curl, same-origin) that send no Origin header.
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};
