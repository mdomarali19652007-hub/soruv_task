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

function buildAllowlist(): string[] {
  const extras = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const authUrl = process.env.BETTER_AUTH_URL?.trim();
  const siteUrl = process.env.SITE_URL?.trim();

  return Array.from(
    new Set([
      ...DEFAULT_ALLOWED_ORIGINS,
      ...(authUrl ? [authUrl] : []),
      ...(siteUrl ? [siteUrl] : []),
      ...extras,
    ]),
  );
}

export const allowedOrigins = buildAllowlist();

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser callers (curl, same-origin) that send no Origin header.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
};
