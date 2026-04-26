/**
 * Unit tests for the admin-subdomain host helpers shared between the
 * client ([`src/lib/admin-host.ts`](src/lib/admin-host.ts:1)) and the
 * server middleware ([`src/server/admin-host.ts`](src/server/admin-host.ts:1)).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

import {
  getConfiguredAdminHostname,
  hostMatchesAdmin,
  isLoopbackHost,
  requireAdminHost,
} from '../src/server/admin-host';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.ADMIN_HOSTNAME;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe('hostMatchesAdmin', () => {
  it('allows everything when no admin host is configured', () => {
    expect(hostMatchesAdmin('example.com', null)).toBe(true);
    expect(hostMatchesAdmin(undefined, null)).toBe(true);
  });

  it('matches case-insensitively and ignores port suffixes', () => {
    expect(hostMatchesAdmin('Admin.Example.com', 'admin.example.com')).toBe(true);
    expect(hostMatchesAdmin('admin.example.com:443', 'admin.example.com')).toBe(true);
    expect(hostMatchesAdmin('admin.example.com', 'ADMIN.example.com')).toBe(true);
  });

  it('rejects mismatched hosts', () => {
    expect(hostMatchesAdmin('example.com', 'admin.example.com')).toBe(false);
    expect(hostMatchesAdmin('admin.evil.com', 'admin.example.com')).toBe(false);
    expect(hostMatchesAdmin(undefined, 'admin.example.com')).toBe(false);
  });
});

describe('isLoopbackHost', () => {
  it('recognises common loopback hostnames with or without ports', () => {
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('localhost:3000')).toBe(true);
    expect(isLoopbackHost('127.0.0.1')).toBe(true);
    expect(isLoopbackHost('127.0.0.1:5173')).toBe(true);
    expect(isLoopbackHost('::1')).toBe(true);
  });

  it('rejects non-loopback hostnames', () => {
    expect(isLoopbackHost('example.com')).toBe(false);
    expect(isLoopbackHost('admin.example.com')).toBe(false);
    expect(isLoopbackHost(undefined)).toBe(false);
  });
});

describe('getConfiguredAdminHostname', () => {
  it('returns null when ADMIN_HOSTNAME is unset', () => {
    expect(getConfiguredAdminHostname()).toBeNull();
  });

  it('lower-cases and trims whitespace', () => {
    process.env.ADMIN_HOSTNAME = '  Admin.Example.COM  ';
    expect(getConfiguredAdminHostname()).toBe('admin.example.com');
  });
});

function makeReq(host: string | undefined): Request {
  return {
    get(name: string) {
      if (name.toLowerCase() === 'host') return host;
      return undefined;
    },
  } as unknown as Request;
}

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockImplementation(() => ({ json }));
  return { status, json } as unknown as Response & { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
}

describe('requireAdminHost middleware', () => {
  it('is a no-op when ADMIN_HOSTNAME is not configured', () => {
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();
    requireAdminHost(makeReq('example.com'), res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect((res as unknown as { status: ReturnType<typeof vi.fn> }).status).not.toHaveBeenCalled();
  });

  it('allows matching hosts', () => {
    process.env.ADMIN_HOSTNAME = 'admin.example.com';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();
    requireAdminHost(makeReq('admin.example.com'), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('allows loopback hosts even when ADMIN_HOSTNAME is set', () => {
    process.env.ADMIN_HOSTNAME = 'admin.example.com';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();
    requireAdminHost(makeReq('localhost:3000'), res, next);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects mismatched hosts with 403', () => {
    process.env.ADMIN_HOSTNAME = 'admin.example.com';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();
    requireAdminHost(makeReq('example.com'), res, next);
    expect(next).not.toHaveBeenCalled();
    const statusMock = (res as unknown as { status: ReturnType<typeof vi.fn> }).status;
    expect(statusMock).toHaveBeenCalledWith(403);
  });

  it('rejects requests with a missing Host header', () => {
    process.env.ADMIN_HOSTNAME = 'admin.example.com';
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();
    requireAdminHost(makeReq(undefined), res, next);
    expect(next).not.toHaveBeenCalled();
    const statusMock = (res as unknown as { status: ReturnType<typeof vi.fn> }).status;
    expect(statusMock).toHaveBeenCalledWith(403);
  });
});
