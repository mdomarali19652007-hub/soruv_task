/**
 * Input sanitization helpers.
 *
 * NOTE: We intentionally do NOT HTML-escape user text before storage.
 * React auto-escapes interpolated strings at render time, so escaping
 * again at write time would double-encode ampersands/quotes and show
 * literal `&amp;`, `&#x27;`, `&#x2F;` in chat and comments.
 *
 * DOMPurify (or similar) should only be used where we legitimately need
 * `dangerouslySetInnerHTML` -- which is currently nowhere in this app.
 */

// Zero-width / bidi control characters that can be abused for spoofing.
// eslint-disable-next-line no-control-regex
const INVISIBLE_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

/**
 * Light-weight sanitization for free-text user input.
 * - Normalizes to NFC
 * - Strips invisible/control characters
 * - Does NOT HTML-escape (React handles that at render)
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.normalize('NFC').replace(INVISIBLE_CHARS, '');
}

/**
 * Sanitize, trim, and enforce a max length.
 * Intended for all user-authored text (chat, comments, profile fields).
 */
export function sanitizeAndTrim(input: string, maxLength: number = 500): string {
  return sanitizeInput(input).trim().slice(0, maxLength);
}

/**
 * Validate a Bangladeshi phone number (11 digits, starting with 01).
 * Accepts optional +88 prefix.
 */
export function isValidBDPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return /^(\+?88)?01[3-9]\d{8}$/.test(cleaned);
}

/**
 * Validate a bKash/Nagad account number (Bangladeshi mobile number format).
 */
export function isValidMobileWallet(accountNumber: string): boolean {
  return isValidBDPhoneNumber(accountNumber);
}

/**
 * Sanitize a financial account number -- strip non-alphanumeric characters
 * except common separators, enforce max length.
 */
export function sanitizeAccountNumber(input: string, maxLength: number = 30): string {
  return input.trim().replace(/[^a-zA-Z0-9\-+]/g, '').substring(0, maxLength);
}

/**
 * Generate a cryptographically secure transaction ID.
 */
export function generateTransactionId(prefix: string = 'TXN'): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').substring(0, 12).toUpperCase()}`;
}
