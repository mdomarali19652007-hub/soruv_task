/**
 * Per-table input validation for the admin CRUD endpoints.
 *
 * The `/api/admin/insert` and `/api/admin/update` handlers used to
 * pass-through whatever JSON the admin posted, which (a) made it
 * trivial for a typo'd category to land in production and end up
 * filtered out everywhere on the public side, and (b) gave us no
 * ability to audit row shape from the server side.
 *
 * Validation is gated by table name so we can roll it out one table at
 * a time without regressing existing admin flows that relied on lax
 * inputs. Only `tasks` is enforced today; everything else falls through
 * to a permissive "ok" result.
 */
export interface ValidationOk {
  ok: true;
  data: Record<string, unknown>;
}
export interface ValidationFail {
  ok: false;
  error: string;
}
export type ValidationResult = ValidationOk | ValidationFail;

const TASK_CATEGORIES = new Set(['micro', 'social', 'gmail', 'premium']);

/**
 * Validate a tasks row payload for INSERT.
 *
 * Required: title (non-empty string), reward (>= 0 number), category
 * (member of {micro, social, gmail, premium}), link (parses as URL).
 * Optional: desc (string).
 *
 * Returns a sanitized `data` object suitable for `supabaseAdmin.insert`.
 */
export function validateTaskInsert(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'data is required and must be an object' };
  }
  const raw = input as Record<string, unknown>;

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return { ok: false, error: 'title is required' };
  if (title.length > 200) return { ok: false, error: 'title is too long (max 200 chars)' };

  const reward = typeof raw.reward === 'number' ? raw.reward : Number(raw.reward);
  if (!Number.isFinite(reward) || reward < 0) {
    return { ok: false, error: 'reward must be a non-negative number' };
  }

  const category = typeof raw.category === 'string' ? raw.category : '';
  if (!TASK_CATEGORIES.has(category)) {
    return { ok: false, error: `category must be one of ${[...TASK_CATEGORIES].join(', ')}` };
  }

  const link = typeof raw.link === 'string' ? raw.link.trim() : '';
  if (!link) return { ok: false, error: 'link is required' };
  try {
    new URL(link);
  } catch {
    return { ok: false, error: 'link must be a valid URL (including protocol)' };
  }

  const desc = typeof raw.desc === 'string' ? raw.desc : '';
  if (desc.length > 2000) return { ok: false, error: 'desc is too long (max 2000 chars)' };

  // Pass through `id` if the caller supplied one (so existing client
  // code that pre-generates UUIDs keeps working). Strip everything else
  // we don't recognise to avoid letting random fields through.
  const data: Record<string, unknown> = {
    title,
    reward,
    desc,
    link,
    category,
  };
  if (typeof raw.id === 'string' && raw.id) data.id = raw.id;

  return { ok: true, data };
}

/**
 * Validate a tasks row payload for UPDATE.
 *
 * Same field-level rules as insert, but every field is optional. Empty
 * payloads are rejected since they would be a no-op.
 */
export function validateTaskUpdate(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'data is required and must be an object' };
  }
  const raw = input as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  if (raw.title !== undefined) {
    if (typeof raw.title !== 'string' || !raw.title.trim()) {
      return { ok: false, error: 'title must be a non-empty string' };
    }
    if (raw.title.trim().length > 200) {
      return { ok: false, error: 'title is too long (max 200 chars)' };
    }
    data.title = raw.title.trim();
  }

  if (raw.reward !== undefined) {
    const reward = typeof raw.reward === 'number' ? raw.reward : Number(raw.reward);
    if (!Number.isFinite(reward) || reward < 0) {
      return { ok: false, error: 'reward must be a non-negative number' };
    }
    data.reward = reward;
  }

  if (raw.category !== undefined) {
    if (typeof raw.category !== 'string' || !TASK_CATEGORIES.has(raw.category)) {
      return { ok: false, error: `category must be one of ${[...TASK_CATEGORIES].join(', ')}` };
    }
    data.category = raw.category;
  }

  if (raw.link !== undefined) {
    if (typeof raw.link !== 'string' || !raw.link.trim()) {
      return { ok: false, error: 'link must be a non-empty string' };
    }
    try {
      new URL(raw.link.trim());
    } catch {
      return { ok: false, error: 'link must be a valid URL (including protocol)' };
    }
    data.link = raw.link.trim();
  }

  if (raw.desc !== undefined) {
    if (typeof raw.desc !== 'string') {
      return { ok: false, error: 'desc must be a string' };
    }
    if (raw.desc.length > 2000) {
      return { ok: false, error: 'desc is too long (max 2000 chars)' };
    }
    data.desc = raw.desc;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: 'data must include at least one field to update' };
  }

  return { ok: true, data };
}

/**
 * Dispatch by table name. Returns `{ ok: true, data }` for tables that
 * don't (yet) have a validator -- so existing flows keep working.
 */
export function validateAdminInsert(table: string, data: unknown): ValidationResult {
  switch (table) {
    case 'tasks':
      return validateTaskInsert(data);
    default:
      if (!data || typeof data !== 'object') {
        return { ok: false, error: 'data is required and must be an object' };
      }
      return { ok: true, data: data as Record<string, unknown> };
  }
}

export function validateAdminUpdate(table: string, data: unknown): ValidationResult {
  switch (table) {
    case 'tasks':
      return validateTaskUpdate(data);
    default:
      if (!data || typeof data !== 'object') {
        return { ok: false, error: 'data is required and must be an object' };
      }
      return { ok: true, data: data as Record<string, unknown> };
  }
}
