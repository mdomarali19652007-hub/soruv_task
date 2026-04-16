/**
 * Sanitize user input to prevent XSS attacks.
 * Escapes HTML entities in user-provided strings before storing in Firestore.
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
