import { describe, expect, it, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { rateLimit } from '../src/server/rate-limit';

interface MockRes {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  status(code: number): MockRes;
  json(payload: unknown): MockRes;
  setHeader(name: string, value: string): void;
}

function buildRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
  };
  return res;
}

function run(
  middleware: ReturnType<typeof rateLimit>,
  key: string,
): { res: MockRes; nextCalled: boolean } {
  const req = {
    ip: key,
    headers: {},
    socket: { remoteAddress: key },
  } as unknown as Request;
  const res = buildRes();
  const next = vi.fn() as unknown as NextFunction;
  middleware(req, res as unknown as Response, next);
  return { res, nextCalled: (next as unknown as { mock: { calls: unknown[] } }).mock.calls.length > 0 };
}

describe('rateLimit', () => {
  it('allows requests up to the limit and blocks the next one', () => {
    const limiter = rateLimit({ name: 'test', windowMs: 60_000, max: 3 });
    const key = '198.51.100.1';

    for (let i = 0; i < 3; i++) {
      const { res, nextCalled } = run(limiter, key);
      expect(nextCalled).toBe(true);
      expect(res.statusCode).toBe(200);
      expect(res.headers['x-ratelimit-limit']).toBe('3');
    }

    const { res, nextCalled } = run(limiter, key);
    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBeDefined();
    expect((res.body as { error: string }).error).toMatch(/too many/i);
  });

  it('isolates counters per key', () => {
    const limiter = rateLimit({ name: 'test', windowMs: 60_000, max: 2 });

    run(limiter, '10.0.0.1');
    run(limiter, '10.0.0.1');
    const blocked = run(limiter, '10.0.0.1');
    expect(blocked.res.statusCode).toBe(429);

    const otherKey = run(limiter, '10.0.0.2');
    expect(otherKey.nextCalled).toBe(true);
    expect(otherKey.res.statusCode).toBe(200);
  });

  it('resets the counter after the window expires', () => {
    vi.useFakeTimers();
    try {
      const limiter = rateLimit({ name: 'test', windowMs: 1_000, max: 1 });
      const key = '203.0.113.5';

      expect(run(limiter, key).nextCalled).toBe(true);
      expect(run(limiter, key).nextCalled).toBe(false);

      vi.setSystemTime(Date.now() + 2_000);
      expect(run(limiter, key).nextCalled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
