/**
 * Tiny `cn()` helper.
 *
 * Wraps `clsx` and `tailwind-merge` so primitives in this folder can
 * accept caller-supplied `className` overrides without producing
 * duplicated/conflicting Tailwind utilities (e.g. `p-4` + `p-6`).
 *
 * Both libraries are already direct dependencies of the project — see
 * `package.json` — so this file adds no new dependencies.
 */
import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
