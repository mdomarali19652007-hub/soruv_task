/**
 * Unit tests for the `cn()` helper that backs every UI primitive in
 * `src/components/ui/`. The vitest config runs in a `node`
 * environment, so this is a pure-function test — DOM-rendering tests
 * for the components will arrive once a `jsdom` environment is added.
 */
import { describe, it, expect } from 'vitest';
import { cn } from '../src/components/ui/cn';

describe('cn()', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });

  it('supports conditional objects (clsx semantics)', () => {
    expect(cn('a', { b: true, c: false }, 'd')).toBe('a b d');
  });

  it('merges conflicting tailwind utilities — last wins', () => {
    // tailwind-merge should drop the earlier `p-2` in favour of `p-6`
    expect(cn('p-2', 'p-6')).toBe('p-6');
  });

  it('keeps non-conflicting tailwind utilities side by side', () => {
    expect(cn('px-4', 'py-2', 'rounded-xl')).toBe('px-4 py-2 rounded-xl');
  });

  it('lets caller-supplied classes override defaults', () => {
    // Models how primitives merge a default class string with a
    // user-supplied `className` prop.
    const defaults = 'bg-blue-600 text-white px-4';
    const override = 'bg-red-600 px-6';
    expect(cn(defaults, override)).toBe('text-white bg-red-600 px-6');
  });
});
