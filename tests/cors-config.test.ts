import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CorsOptions } from 'cors';

const ORIGINAL_ENV = { ...process.env };

// The cors-config module caches `allowedOrigins` at import time, so we
// call vi.resetModules() before each import so env-var changes are picked
// up by a fresh evaluation of the module.
async function loadCorsModule() {
  vi.resetModules();
  return (await import(
    '../src/server/cors-config'
  )) as typeof import('../src/server/cors-config');
}

function checkOrigin(
  opts: CorsOptions,
  origin: string | undefined,
): Promise<{ allowed: boolean; error: string | null }> {
  return new Promise((resolve) => {
    (opts.origin as (
      o: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void,
    ) => void)(origin, (err, allow) => {
      resolve({ allowed: Boolean(allow), error: err ? err.message : null });
    });
  });
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.BETTER_AUTH_URL;
  delete process.env.SITE_URL;
  delete process.env.CORS_ALLOWED_ORIGINS;
  delete process.env.VERCEL_URL;
  delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  delete process.env.VERCEL_BRANCH_URL;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('cors-config allowlist', () => {
  it('always allows the localhost defaults', async () => {
    const { corsOptions } = await loadCorsModule();
    const { allowed } = await checkOrigin(corsOptions, 'http://localhost:3000');
    expect(allowed).toBe(true);
  });

  it('blocks origins that are not in the allowlist', async () => {
    const { corsOptions } = await loadCorsModule();
    const { error } = await checkOrigin(corsOptions, 'https://evil.example.com');
    expect(error).toMatch(/not allowed by CORS/);
  });

  it('auto-allows the exact Vercel deployment URL from VERCEL_URL', async () => {
    process.env.VERCEL_URL = 'soruv-task.vercel.app';
    const { corsOptions } = await loadCorsModule();
    const { allowed } = await checkOrigin(corsOptions, 'https://soruv-task.vercel.app');
    expect(allowed).toBe(true);
  });

  it('auto-allows the production alias via VERCEL_PROJECT_PRODUCTION_URL', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'soruv-task.vercel.app';
    const { corsOptions } = await loadCorsModule();
    const { allowed } = await checkOrigin(corsOptions, 'https://soruv-task.vercel.app');
    expect(allowed).toBe(true);
  });

  it('allows Vercel preview URLs that match the project prefix', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'soruv-task.vercel.app';
    const { corsOptions } = await loadCorsModule();
    const { allowed } = await checkOrigin(
      corsOptions,
      'https://soruv-task-git-feature-branch-acme.vercel.app',
    );
    expect(allowed).toBe(true);
  });

  it('does not allow unrelated *.vercel.app origins', async () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'soruv-task.vercel.app';
    const { corsOptions } = await loadCorsModule();
    const { error } = await checkOrigin(
      corsOptions,
      'https://malicious-project.vercel.app',
    );
    expect(error).toMatch(/not allowed by CORS/);
  });

  it('honours comma-separated CORS_ALLOWED_ORIGINS extras', async () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://a.example, https://b.example';
    const { corsOptions } = await loadCorsModule();
    for (const origin of ['https://a.example', 'https://b.example']) {
      const { allowed } = await checkOrigin(corsOptions, origin);
      expect(allowed).toBe(true);
    }
  });

  it('allows requests with no Origin header (non-browser callers)', async () => {
    const { corsOptions } = await loadCorsModule();
    const { allowed, error } = await checkOrigin(corsOptions, undefined);
    expect(allowed).toBe(true);
    expect(error).toBeNull();
  });
});
