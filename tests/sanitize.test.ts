import { describe, expect, it } from 'vitest';
import {
  sanitizeInput,
  sanitizeAndTrim,
  isValidBDPhoneNumber,
  isValidMobileWallet,
  sanitizeAccountNumber,
  generateTransactionId,
} from '../src/utils/sanitize';

describe('sanitizeInput', () => {
  it('returns the string unchanged for plain ASCII', () => {
    expect(sanitizeInput('hello world')).toBe('hello world');
  });

  it('does NOT HTML-escape angle brackets (React handles that at render)', () => {
    // This is the regression guard from the security hardening PR: the
    // old helper double-escaped user input, producing literal `&lt;` in
    // chat. The new helper must NOT touch these characters.
    expect(sanitizeInput('<script>')).toBe('<script>');
    expect(sanitizeInput('a & b')).toBe('a & b');
    expect(sanitizeInput(`O'Brien`)).toBe(`O'Brien`);
  });

  it('strips zero-width and bidi control characters', () => {
    const input = 'hello\u200Bworld\u202E';
    expect(sanitizeInput(input)).toBe('helloworld');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeInput(undefined as unknown as string)).toBe('');
    expect(sanitizeInput(null as unknown as string)).toBe('');
  });

  it('normalizes to NFC', () => {
    const decomposed = 'cafe\u0301'; // "café" (e + combining acute)
    const composed = 'caf\u00e9';
    expect(sanitizeInput(decomposed)).toBe(composed);
  });
});

describe('sanitizeAndTrim', () => {
  it('trims whitespace', () => {
    expect(sanitizeAndTrim('  hi  ')).toBe('hi');
  });

  it('enforces the max length', () => {
    const long = 'x'.repeat(600);
    expect(sanitizeAndTrim(long, 100)).toHaveLength(100);
  });

  it('preserves unicode text under the limit', () => {
    expect(sanitizeAndTrim('বাংলা টেক্সট')).toBe('বাংলা টেক্সট');
  });
});

describe('phone / wallet validation', () => {
  it.each([
    ['01712345678', true],
    ['+8801812345678', true],
    ['8801912345678', true],
    ['01212345678', false], // operator prefix 2 is invalid
    ['0171234567', false], // too short
    ['017123456789', false], // too long
    ['abcdefghijk', false],
  ])('isValidBDPhoneNumber(%s) -> %s', (input, expected) => {
    expect(isValidBDPhoneNumber(input)).toBe(expected);
    expect(isValidMobileWallet(input)).toBe(expected);
  });

  it('accepts common separators', () => {
    expect(isValidBDPhoneNumber('01712-345678')).toBe(true);
    expect(isValidBDPhoneNumber('(017) 1234 5678')).toBe(true);
  });
});

describe('sanitizeAccountNumber', () => {
  it('strips disallowed characters and enforces length', () => {
    expect(sanitizeAccountNumber('  01712-345678  ')).toBe('01712-345678');
    expect(sanitizeAccountNumber('!!abc123$$')).toBe('abc123');
    expect(sanitizeAccountNumber('x'.repeat(50), 10)).toHaveLength(10);
  });
});

describe('generateTransactionId', () => {
  it('uses the provided prefix', () => {
    expect(generateTransactionId('WD')).toMatch(/^WD-[A-Z0-9]{12}$/);
  });

  it('defaults to TXN prefix', () => {
    expect(generateTransactionId()).toMatch(/^TXN-[A-Z0-9]{12}$/);
  });

  it('produces unique IDs across calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) ids.add(generateTransactionId());
    expect(ids.size).toBe(50);
  });
});
