/**
 * Server-side admin resolution.
 *
 * Reads the `users.isAdmin` boolean flag as the single source of truth
 * (seeded by `supabase/migrations/20260419_admin_role.sql`). We retain
 * a fallback list of hard-coded admin emails so the initial bootstrap
 * keeps working on existing installs that have not yet applied the
 * migration. Remove `LEGACY_ADMIN_EMAILS` once every deployment has
 * been upgraded.
 */

import { supabaseAdmin } from './supabase-admin.js';

const LEGACY_ADMIN_EMAILS = new Set<string>([
  'soruvislam51@gmail.com',
  'shovonali885@gmail.com',
]);

export interface AdminCheckInput {
  userId?: string;
  userEmail?: string;
}

/**
 * Resolve whether the given authenticated user should be treated as an admin.
 *
 * Preference order:
 *   1. `users.isAdmin = true` in Postgres (DB-backed role -- preferred)
 *   2. Legacy hard-coded email list (fallback for unmigrated deployments)
 */
export async function isUserAdmin({ userId, userEmail }: AdminCheckInput): Promise<boolean> {
  if (userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('isAdmin')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data && (data as { isAdmin?: boolean }).isAdmin === true) {
      return true;
    }
  }

  if (userEmail && LEGACY_ADMIN_EMAILS.has(userEmail.toLowerCase())) {
    return true;
  }

  return false;
}
