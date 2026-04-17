import { supabase } from './supabase';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ============================================================
// CRUD Operations - Firebase-compatible wrappers for Supabase
// ============================================================

/** Insert a row into a table (equivalent to Firestore addDoc) */
export async function insertRow(table: string, data: Record<string, any>) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** Upsert a row by ID (equivalent to Firestore setDoc) */
export async function upsertRow(table: string, data: Record<string, any>) {
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data)
    .select()
    .single();
  if (error) throw error;
  return result;
}

/** Update a row by ID (equivalent to Firestore updateDoc) */
export async function updateRow(table: string, id: string, data: Record<string, unknown>) {
  const { error } = await supabase
    .from(table)
    .update(data)
    .eq('id', id);
  if (error) throw error;
}

/** Get a single row by ID (equivalent to Firestore getDoc) */
export async function getRow(table: string, id: string) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Get all rows from a table (equivalent to Firestore getDocs on collection) */
export async function getRows(table: string, filters?: { column: string; value: unknown }[]) {
  let query = supabase.from(table).select('*');
  if (filters) {
    for (const f of filters) {
      query = query.eq(f.column, f.value);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/** Delete a row by ID (equivalent to Firestore deleteDoc) */
export async function deleteRow(table: string, id: string) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  if (error) throw error;
}

/** Atomic increment of a numeric column (equivalent to Firestore increment()) */
export async function incrementField(table: string, id: string, column: string, amount: number) {
  const { error } = await supabase.rpc('increment_field', {
    p_table: table,
    p_id: id,
    p_column: column,
    p_amount: amount
  });
  if (error) {
    // Do NOT fall back to read-modify-write -- that pattern is vulnerable to race conditions.
    // If the RPC function is not available, surface the error so it can be fixed at the DB level.
    throw new Error(`incrementField failed for ${table}.${column}: ${error.message}`);
  }
}

/** Increment multiple fields atomically */
export async function incrementFields(table: string, id: string, increments: Record<string, number>) {
  for (const [column, amount] of Object.entries(increments)) {
    await incrementField(table, id, column, amount);
  }
}

// ============================================================
// Secure Server-Side Financial Operations (RPC wrappers)
// ============================================================

/** Submit a withdrawal via server-side validation and atomic balance deduction */
export async function submitWithdrawal(
  userId: string,
  amount: number,
  method: string,
  accountNumber: string
): Promise<string> {
  const { data, error } = await supabase.rpc('submit_withdrawal', {
    p_user_id: userId,
    p_amount: amount,
    p_method: method,
    p_account_number: accountNumber
  });
  if (error) throw new Error(error.message);
  return data as string;
}

/** Admin: approve or reject a withdrawal */
export async function processWithdrawal(
  withdrawalId: string,
  action: 'approved' | 'rejected',
  reason: string = ''
): Promise<void> {
  const { error } = await supabase.rpc('process_withdrawal', {
    p_withdrawal_id: withdrawalId,
    p_action: action,
    p_reason: reason
  });
  if (error) throw new Error(error.message);
}

/** Admin: approve or reject a deposit/recharge request */
export async function processDeposit(
  requestId: string,
  action: 'approved' | 'rejected',
  reason: string = ''
): Promise<void> {
  const { error } = await supabase.rpc('process_deposit', {
    p_request_id: requestId,
    p_action: action,
    p_reason: reason
  });
  if (error) throw new Error(error.message);
}

/** Activate account via server-side fee deduction and referral bonus */
export async function activateAccount(userId: string): Promise<void> {
  const { error } = await supabase.rpc('activate_account', {
    p_user_id: userId
  });
  if (error) throw new Error(error.message);
}

/** Claim daily reward via server-side validation */
export async function claimDailyReward(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('claim_daily_reward', {
    p_user_id: userId
  });
  if (error) throw new Error(error.message);
  return data as number;
}

/** Process spin via server-side validation and random prize */
export async function processSpin(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('process_spin', {
    p_user_id: userId
  });
  if (error) throw new Error(error.message);
  return data as number;
}

// ============================================================
// Real-time Subscriptions - Firebase onSnapshot equivalent
// ============================================================

type RowCallback<T> = (rows: T[]) => void;
type SingleRowCallback<T> = (row: T | null) => void;

/** Subscribe to all changes on a table (equivalent to onSnapshot on collection) */
export function subscribeToTable<T extends { id: string }>(
  table: string,
  callback: RowCallback<T>,
  options?: {
    orderBy?: { column: string; ascending?: boolean };
    filter?: { column: string; value: string };
  }
): () => void {
  // First, fetch initial data
  let query = supabase.from(table).select('*');
  if (options?.filter) {
    query = query.eq(options.filter.column, options.filter.value);
  }
  if (options?.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
  }

  query.then(({ data, error }) => {
    if (!error && data) {
      callback(data as T[]);
    }
  });

  // Then subscribe for real-time changes
  const channel: RealtimeChannel = supabase
    .channel(`${table}-changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        // On any change, refetch the full list
        let refetchQuery = supabase.from(table).select('*');
        if (options?.filter) {
          refetchQuery = refetchQuery.eq(options.filter.column, options.filter.value);
        }
        if (options?.orderBy) {
          refetchQuery = refetchQuery.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
        }
        refetchQuery.then(({ data, error }) => {
          if (!error && data) {
            callback(data as T[]);
          }
        });
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel);
  };
}

/** Subscribe to a single row by ID (equivalent to onSnapshot on doc) */
export function subscribeToRow<T>(
  table: string,
  id: string,
  callback: SingleRowCallback<T>
): () => void {
  // Fetch initial data - use maybeSingle() to avoid 406 when row doesn't exist
  supabase.from(table).select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
    if (!error) {
      callback(data as T | null);
    } else {
      callback(null);
    }
  });

  // Subscribe for changes
  const channel = supabase
    .channel(`${table}-${id}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter: `id=eq.${id}` },
      (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        supabase.from(table).select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
          if (!error) {
            callback(data as T | null);
          }
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================
// Storage - Firebase Storage equivalent
// ============================================================

const STORAGE_BUCKET = 'uploads';

/** Upload a file to Supabase Storage (equivalent to Firebase uploadBytes + getDownloadURL) */
export async function uploadFile(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return urlData.publicUrl;
}
