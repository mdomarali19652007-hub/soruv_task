/**
 * Tests for the pure-function helpers in
 * [`src/lib/admin-host.ts`](src/lib/admin-host.ts:1). The DOM-bound
 * helpers are exercised indirectly via [`hostnameIsAdmin()`](src/lib/admin-host.ts:0).
 */
import { describe, expect, it } from 'vitest';

import { hostnameIsAdmin } from '../src/lib/admin-host';

describe('hostnameIsAdmin', () => {
  describe('with an explicit configured host', () => {
    it('only matches the exact configured hostname', () => {
      expect(hostnameIsAdmin('admin.example.com', 'admin.example.com')).toBe(true);
      expect(hostnameIsAdmin('Admin.Example.COM', 'admin.example.com')).toBe(true);
      expect(hostnameIsAdmin('apex.example.com', 'admin.example.com')).toBe(false);
      expect(hostnameIsAdmin('admin.evil.com', 'admin.example.com')).toBe(false);
    });
  });

  describe('without a configured host', () => {
    it('treats any "admin." prefix as the admin host', () => {
      expect(hostnameIsAdmin('admin.example.com', null)).toBe(true);
      expect(hostnameIsAdmin('admin.preview.foo', null)).toBe(true);
    });

    it('does not misidentify lookalikes', () => {
      // No dot after `admin` -> NOT a subdomain match.
      expect(hostnameIsAdmin('administrator.example.com', null)).toBe(false);
      expect(hostnameIsAdmin('example.com', null)).toBe(false);
      expect(hostnameIsAdmin('', null)).toBe(false);
    });
  });
});
