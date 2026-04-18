/**
 * Admin API client module.
 *
 * Routes all admin write operations through the Express server,
 * which uses the supabaseAdmin (service-role) client to bypass RLS.
 *
 * This replaces direct calls to insertRow/updateRow/deleteRow/upsertRow
 * from database.ts for admin operations, fixing the RLS mismatch
 * caused by the Better Auth migration.
 */

async function adminFetch<T = any>(endpoint: string, body: Record<string, any>): Promise<T> {
  const res = await fetch(`/api/admin${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Admin API error: ${res.status}`);
  }

  return res.json();
}

/** Insert a row into a table via the admin API (bypasses RLS) */
export async function adminInsert(table: string, data: Record<string, any>) {
  return adminFetch('/insert', { table, data });
}

/** Update a row by ID via the admin API (bypasses RLS) */
export async function adminUpdate(table: string, id: string, data: Record<string, any>) {
  return adminFetch('/update', { table, id, data });
}

/** Delete a row by ID via the admin API (bypasses RLS) */
export async function adminDelete(table: string, id: string) {
  return adminFetch('/delete', { table, id });
}

/** Upsert a row via the admin API (bypasses RLS) */
export async function adminUpsert(table: string, data: Record<string, any>) {
  return adminFetch('/upsert', { table, data });
}

/** Atomically increment a numeric field via the admin API (bypasses RLS) */
export async function adminIncrement(table: string, id: string, column: string, amount: number) {
  return adminFetch('/increment', { table, id, column, amount });
}

/** Atomically increment multiple fields via the admin API (bypasses RLS) */
export async function adminIncrementFields(table: string, id: string, increments: Record<string, number>) {
  return adminFetch('/increment-fields', { table, id, increments });
}

/** Get a single row by ID via the admin API (bypasses RLS) */
export async function adminGetRow(table: string, id: string) {
  const res = await fetch(`/api/admin/row?table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Admin API error: ${res.status}`);
  }
  return res.json();
}
