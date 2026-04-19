import { defineConfig } from 'vitest/config';

/**
 * Vitest setup.
 *
 * Scope is deliberately narrow: we only run tests under `tests/` to
 * keep them out of the Vite production bundle.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globals: false,
    passWithNoTests: false,
  },
});
