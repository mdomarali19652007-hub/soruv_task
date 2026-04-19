/**
 * Database error plumbing.
 *
 * Extracted verbatim from src/App.tsx. The original implementation
 * was a Firebase/Firestore leftover; the behaviour is database-agnostic
 * so both the legacy names (`handleFirestoreError`, `buildFirestoreErrorInfo`)
 * and the new ones (`handleDbError`, `buildDbErrorInfo`) are exported.
 * Existing call-sites continue to use the legacy names; new code should
 * prefer the Db-prefixed versions.
 */

import { OperationType, type FirestoreErrorInfo } from '../types';

export function buildDbErrorInfo(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): FirestoreErrorInfo {
  return {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: undefined,
      email: undefined,
      emailVerified: undefined,
      isAnonymous: undefined,
      tenantId: undefined,
      providerInfo: [],
    },
    operationType,
    path,
  };
}

/**
 * Use for direct operations (create/update/delete) where failure
 * should propagate to the caller as a thrown error.
 */
export function handleDbError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo = buildDbErrorInfo(error, operationType, path);
  console.error('DB Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Use for realtime listener error callbacks -- logs only, does not throw.
 * Listeners fire before auth is fully initialized, so permission errors
 * are expected during the initial render and get downgraded to warnings.
 */
export function handleListenerDbError(error: unknown, operationType: OperationType, path: string | null): void {
  const errInfo = buildDbErrorInfo(error, operationType, path);
  const msg = errInfo.error;
  if (msg.includes('permission') || msg.includes('Permission')) {
    console.warn('DB listener permission denied (user may not be authenticated yet):', path);
  } else {
    console.error('DB Listener Error:', JSON.stringify(errInfo));
  }
}

// ------------------------------------------------------------
// Legacy aliases -- keep existing call-sites in src/App.tsx
// building while the incremental rename rolls out.
// ------------------------------------------------------------
export const buildFirestoreErrorInfo = buildDbErrorInfo;
export const handleFirestoreError = handleDbError;
export const handleListenerError = handleListenerDbError;
