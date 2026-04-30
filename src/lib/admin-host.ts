/**
 * Client-side helpers for admin-subdomain routing.
 *
 * The admin panel is reachable in two ways:
 *
 *   1. Apex / www domain at `/admin` (legacy, kept so existing
 *      bookmarks and the `/admin` URL keep working).
 *   2. A dedicated subdomain such as `admin.example.com`, where the
 *      ROOT (`/`) and every other path serve the admin shell.
 *
 * We do not use a router, so the SPA decides which view to render at
 * boot from the current URL. This module is the single source of truth
 * for that decision so [`src/App.tsx`](src/App.tsx:1) can stay focused
 * on state.
 *
 * Configure the admin host by setting `VITE_ADMIN_HOSTNAME` in the
 * build env, e.g. `VITE_ADMIN_HOSTNAME=admin.example.com`. When unset,
 * the client falls back to detecting any hostname starting with
 * `admin.` (works for staging/preview admin subdomains too).
 */

/**
 * Lower-cased configured admin hostname, or `null` if `VITE_ADMIN_HOSTNAME`
 * is not set. Reads from `import.meta.env` so the value is fixed at build
 * time and tree-shakable.
 */
export function getConfiguredAdminHostname(): string | null {
  // `import.meta.env` is replaced inline by Vite, so this is safe in
  // the browser and produces a static string in the bundle.
  const env =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;
  const fromEnv = env?.VITE_ADMIN_HOSTNAME;
  return fromEnv ? fromEnv.trim().toLowerCase() : null;
}

/**
 * Pure predicate. Exposed for tests; production callers should use
 * [`isOnAdminHost()`](src/lib/admin-host.ts:0) which reads from
 * `window.location`.
 *
 * The check is intentionally generous on the apex side: we treat
 * `admin.<anything>` as an admin host whenever `VITE_ADMIN_HOSTNAME`
 * is unset, so preview deployments like `admin-preview.example.com`
 * are NOT misidentified as admin (they do not start with `admin.`).
 */
export function hostnameIsAdmin(
  hostname: string,
  configured: string | null = null,
): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  if (configured) {
    return host === configured;
  }
  // No explicit hostname configured -> fall back to a `admin.*` prefix.
  // We require a dot after `admin` so `administrator.example.com` does
  // NOT match.
  return host.startsWith('admin.');
}

/**
 * Returns `true` when the page is currently being served from the
 * configured admin host. SSR-safe (returns `false` on the server).
 */
export function isOnAdminHost(): boolean {
  if (typeof window === 'undefined') return false;
  return hostnameIsAdmin(window.location.hostname, getConfiguredAdminHostname());
}

/**
 * Build the absolute URL that should be used to redirect a user from
 * the apex domain to the admin subdomain. Returns `null` when no admin
 * host has been configured (apex `/admin` keeps working as a fallback).
 */
export function getAdminRedirectUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const adminHost = getConfiguredAdminHostname();
  if (!adminHost) return null;
  return `${window.location.protocol}//${adminHost}/`;
}

/**
 * Build the absolute URL of the public site used to "exit" out of the
 * admin shell. When we are on a dedicated admin subdomain we strip the
 * leading `admin.` (or use `VITE_PUBLIC_HOSTNAME` when set) so the
 * operator lands on the consumer app. Returns `null` outside the
 * browser or when not on an admin host.
 */
export function getPublicSiteUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const env =
    typeof import.meta !== 'undefined'
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;
  const explicit = env?.VITE_PUBLIC_HOSTNAME;
  if (explicit) {
    return `${window.location.protocol}//${explicit.trim().toLowerCase()}/`;
  }
  // Not on an admin host -> nothing to derive.
  if (!isOnAdminHost()) return null;
  const host = window.location.hostname;
  // Strip the leading admin label (`admin.example.com` -> `example.com`).
  const stripped = host.replace(/^admin\./i, '');
  // Refuse to send the user to the same host (config edge case where
  // VITE_ADMIN_HOSTNAME does not start with `admin.`).
  if (!stripped || stripped === host) return null;
  return `${window.location.protocol}//${stripped}/`;
}
