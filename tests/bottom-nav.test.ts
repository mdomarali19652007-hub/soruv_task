/**
 * Unit tests for the BottomNav `centerFloating` variant added by the
 * competitor-aligned UI restructure.
 *
 * The vitest environment is `node`, so we don't render React. Instead
 * we exercise the exported `bottomNavButtonClassName()` helper which
 * carries the same class-name logic the component uses.
 */
import { describe, it, expect } from 'vitest';
import { bottomNavButtonClassName } from '../src/components/ui/BottomNav';

describe('bottomNavButtonClassName()', () => {
  it('applies the floating elevated styles when isFloating is true', () => {
    const cls = bottomNavButtonClassName({ isActive: false, isFloating: true });
    // Larger pill, lifted above the bar, brand gradient, ring.
    expect(cls).toContain('w-16');
    expect(cls).toContain('h-16');
    expect(cls).toContain('-mt-7');
    expect(cls).toContain('rounded-full');
    expect(cls).toContain('ring-4');
    expect(cls).toContain('from-indigo-500');
  });

  it('uses the standard tab styles when isFloating is false', () => {
    const active = bottomNavButtonClassName({ isActive: true, isFloating: false });
    expect(active).toContain('w-full');
    expect(active).toContain('h-14');
    expect(active).toContain('text-white');
    // Floating-only classes should NOT leak into the standard tab.
    expect(active).not.toContain('-mt-7');
    expect(active).not.toContain('rounded-full');
  });

  it('renders the inactive standard tab with muted slate text', () => {
    const inactive = bottomNavButtonClassName({ isActive: false, isFloating: false });
    expect(inactive).toContain('text-slate-500');
    expect(inactive).not.toContain('-mt-7');
  });

  it('keeps the focus ring across both variants', () => {
    const floating = bottomNavButtonClassName({ isActive: false, isFloating: true });
    const standard = bottomNavButtonClassName({ isActive: false, isFloating: false });
    expect(floating).toContain('focus-visible:ring-2');
    expect(standard).toContain('focus-visible:ring-2');
  });
});
