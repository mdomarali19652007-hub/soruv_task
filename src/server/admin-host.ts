/**
 * Server-side guard for the admin-subdomain rollout.
 *
 * When `ADMIN_HOSTNAME` is set, the dedicated admin endpoints under
 * `/api/admin/*` are accepted ONLY from requests whose `Host` header
 * matches the configured admin hostname. Requests from the apex
 * domain or any other origin are rejected with `403`.
 *
 * This is defence-in-depth: the client-side guards in
 * [`src/App.tsx`](src/App.tsx:1) and the host-aware redirect in
 * [`src/lib/admin-host.ts`](src/lib/admin-host.ts:1) already keep the
 * UI off the apex domain, but a determined caller could still POST
 * directly to `/api/admin/*` over the apex hostname. This middleware
 * stops that.
 *
 * The check is intentionally a no-op when `ADMIN_HOSTNAME` is unset
 * so existing single-domain deployments keep working without any env
 * changes. Local development (loopback hosts) is also always allowed
 * to avoid breaking `vite dev` against `http://localhost:3000`.
 */

import type { NextFunction, Request, Response } from 'express';

/**
 * Pure host-matching helper. Exposed for unit tests.
 *
 * Both inputs are lower-cased and stripped of an optional `:port`
 * suffix before comparison so `Host: admin.example.com:443` still
 * matches `ADMIN_HOSTNAME=admin.example.com`.
 */
export function hostMatchesAdmin(
  requestHost: string | undefined,
  adminHostname: string | null,
): boolean {
  if (!adminHostname) return true; // not configured -> allow everything
  if (!requestHost) return false;
  const normalize = (h: string) => h.toLowerCase().split(':')[0]?.trim() ?? '';
  return normalize(requestHost) === normalize(adminHostname);
}

/**
 * Returns true for hostnames we always trust (loopback / explicit dev
 * setups) so `npm run dev` is not broken when `ADMIN_HOSTNAME` is set.
 */
export function isLoopbackHost(requestHost: string | undefined): boolean {
  if (!requestHost) return false;
  const raw = requestHost.toLowerCase().trim();
  // IPv6 literals are wrapped in brackets in Host headers (e.g. `[::1]:3000`).
  // Strip the brackets and trailing port to get the bare address.
  const bracketed = raw.match(/^\[([^\]]+)\](?::\d+)?$/);
  if (bracketed) {
    const inner = bracketed[1];
    return inner === '::1';
  }
  // Bare IPv6 (no brackets, no port) such as `::1`.
  if (raw === '::1') return true;
  // IPv4 / DNS host: split off the port suffix.
  const host = raw.split(':')[0]?.trim() ?? '';
  return host === 'localhost' || host === '127.0.0.1';
}

/**
 * Read the configured admin hostname from the process environment.
 * Returns `null` when not set so callers can no-op.
 */
export function getConfiguredAdminHostname(): string | null {
  const raw = process.env.ADMIN_HOSTNAME?.trim();
  return raw ? raw.toLowerCase() : null;
}

/**
 * Express middleware. Attach to the admin sub-router so it runs for
 * every `/api/admin/*` request before any business logic.
 */
export function requireAdminHost(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const configured = getConfiguredAdminHostname();
  // No admin host configured -> nothing to enforce.
  if (!configured) {
    next();
    return;
  }

  // Allow loopback so local dev keeps working when ADMIN_HOSTNAME is
  // exported globally (e.g. from a project-wide `.env`).
  const incoming = req.get('host') ?? undefined;
  if (isLoopbackHost(incoming)) {
    next();
    return;
  }

  if (hostMatchesAdmin(incoming, configured)) {
    next();
    return;
  }

  // Reject. We deliberately do NOT echo the configured host back to the
  // caller in the error body to avoid leaking infra hints.
  res.status(403).json({
    error: 'Forbidden',
    detail: 'Admin endpoints are only reachable from the admin host.',
  });
}
