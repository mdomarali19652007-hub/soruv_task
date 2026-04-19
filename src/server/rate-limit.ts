/**
 * Simple in-memory fixed-window rate limiter for Express.
 *
 * Intentionally dependency-free so it works in both the long-running
 * Express server and the Vercel serverless wrapper. Note: in a horizontally
 * scaled or serverless-per-invocation environment this only protects
 * per-instance; for production traffic this should be backed by Redis
 * or Upstash. It still adds real friction against casual brute-force
 * and credential-stuffing attempts.
 */

import type { Request, Response, NextFunction } from 'express';

interface Bucket {
  count: number;
  resetAt: number;
}

interface Options {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max requests allowed in the window, per key. */
  max: number;
  /** Optional label used in logs / headers. */
  name?: string;
  /** Custom key extractor. Defaults to client IP. */
  keyGenerator?: (req: Request) => string;
}

function defaultKey(req: Request): string {
  const xff = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return xff || req.ip || req.socket?.remoteAddress || 'unknown';
}

export function rateLimit({ windowMs, max, name = 'rate-limit', keyGenerator = defaultKey }: Options) {
  const buckets = new Map<string, Bucket>();

  // Periodic cleanup to cap memory use.
  const cleanup: unknown = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }, Math.min(windowMs, 60_000));
  // Do not keep the event loop alive just for the cleanup timer (Node only).
  const timer = cleanup as { unref?: () => void };
  if (typeof timer?.unref === 'function') timer.unref();

  return function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const key = `${name}:${keyGenerator(req)}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }

    next();
  };
}

// Shared limiters used across auth- and registration-related routes.
export const registerLimiter = rateLimit({
  name: 'register',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
});

export const referralLimiter = rateLimit({
  name: 'validate-referral',
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
});

export const authLimiter = rateLimit({
  name: 'auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60,
});

export const adminLimiter = rateLimit({
  name: 'admin',
  windowMs: 60 * 1000, // 1 minute
  max: 120,
});
