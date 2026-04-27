/**
 * Admin API client module.
 *
 * Routes all admin write operations through the Express server,
 * which uses the supabaseAdmin (service-role) client to bypass RLS.
 *
 * This replaces direct calls to insertRow/updateRow/deleteRow/upsertRow
 * from database.ts for admin operations, fixing the RLS mismatch
 * caused by the Better Auth migration.
 *
 * All requests include credentials (cookies) so the server can verify
 * the admin session via Better Auth before executing the operation.
 *
 * See: src/server/routes.ts for the corresponding server-side handlers.
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

/**
 * Best-effort deletion of an upload's binary from Supabase Storage.
 *
 * Called before `adminDelete('uploads', id)` so admins clicking "Remove"
 * also clean up the underlying object when the URL points at our own
 * Supabase bucket. URLs hosted on third-party providers (ImgBB) cannot
 * be deleted from the client and resolve to `{ skipped: true }` -- the
 * admin sees this in the toast and can fall back to the host's UI.
 *
 * Errors are swallowed by the caller so a failed storage delete never
 * blocks the metadata row delete.
 */
export async function adminDeleteUploadStorage(url: string): Promise<{
  success?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
}> {
  return adminFetch('/storage/delete', { url });
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
