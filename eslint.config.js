// Flat config (ESLint 9). Intentionally minimal: the codebase still has
// a large amount of legacy client state in src/App.tsx that would flood
// the diff if we turned on strict rules. We keep this as a focused
// safety net (unused imports, promises, console discipline) and plan to
// tighten incrementally.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      'package-lock.json',
      'bun.lock',
      'supabase/**/*.sql',
      'supabase/functions/**', // Deno runtime, typed separately via deno.json
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'off',
      // Noisy on a codebase this size; re-enable once the big App.tsx
      // component is fully split.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    // Node entry points and SQL-adjacent helpers use process / console more freely.
    files: ['server.ts', 'api/**/*.ts', 'src/server/**/*.ts', 'vite.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
