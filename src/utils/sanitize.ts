/**
 * Sanitize user input to prevent XSS attacks.
 * Escapes HTML entities in user-provided strings before storing in the database.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize and trim a string, enforcing a max length.
 */
export function sanitizeAndTrim(input: string, maxLength: number = 500): string {
  return sanitizeInput(input.trim()).substring(0, maxLength);
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
