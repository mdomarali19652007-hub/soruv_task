import { describe, expect, it } from 'vitest';
import {
  validateTaskInsert,
  validateTaskUpdate,
  validateAdminInsert,
  validateAdminUpdate,
} from '../src/server/admin-validators';

/**
 * These tests guard the contract between the admin's "Add Task" form
 * and the public Micro Freelancing / Social / Gmail / Premium pages.
 *
 * Background: a typo'd category (e.g. "mciro") used to land in the
 * `tasks` table because the server was a passthrough. The row showed
 * up in the admin's Live Task Inventory but every public folder filters
 * by `category === '<expected>'` so it would silently disappear from
 * end users. The validator below makes that an explicit 400 instead.
 */
describe('validateTaskInsert', () => {
  const valid = {
    title: 'Watch & subscribe',
    reward: 5,
    desc: 'Watch the video and subscribe to the channel.',
    link: 'https://example.com/video',
    category: 'micro',
  };

  it('accepts a well-formed payload and trims strings', () => {
    const result = validateTaskInsert({ ...valid, title: '  Hi  ', link: ' https://a.example.com ' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.title).toBe('Hi');
      expect(result.data.link).toBe('https://a.example.com');
      expect(result.data.category).toBe('micro');
    }
  });

  it('accepts every supported category', () => {
    for (const category of ['micro', 'social', 'gmail', 'premium'] as const) {
      const result = validateTaskInsert({ ...valid, category });
      expect(result.ok).toBe(true);
    }
  });

  it('rejects a typo category', () => {
    const result = validateTaskInsert({ ...valid, category: 'mciro' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/category/);
  });

  it('rejects an empty title', () => {
    const result = validateTaskInsert({ ...valid, title: '   ' });
    expect(result.ok).toBe(false);
  });

  it('rejects a negative reward', () => {
    const result = validateTaskInsert({ ...valid, reward: -1 });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-numeric reward', () => {
    const result = validateTaskInsert({ ...valid, reward: 'free' });
    expect(result.ok).toBe(false);
  });

  it('rejects a missing link', () => {
    const result = validateTaskInsert({ ...valid, link: '' });
    expect(result.ok).toBe(false);
  });

  it('rejects a malformed link', () => {
    const result = validateTaskInsert({ ...valid, link: 'not a url' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/url/i);
  });

  it('rejects null / non-object input', () => {
    expect(validateTaskInsert(null).ok).toBe(false);
    expect(validateTaskInsert('hi').ok).toBe(false);
  });

  it('preserves a client-supplied id when present', () => {
    const result = validateTaskInsert({ ...valid, id: 'task-1' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.id).toBe('task-1');
  });

  it('strips unknown extra fields', () => {
    const result = validateTaskInsert({ ...valid, isAdmin: true, drop_table: ';--' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.isAdmin).toBeUndefined();
      expect(result.data.drop_table).toBeUndefined();
    }
  });
});

describe('validateTaskUpdate', () => {
  it('accepts a partial update', () => {
    const result = validateTaskUpdate({ reward: 10 });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ reward: 10 });
  });

  it('rejects an empty update', () => {
    const result = validateTaskUpdate({});
    expect(result.ok).toBe(false);
  });

  it('rejects a typo category on update', () => {
    const result = validateTaskUpdate({ category: 'mciro' });
    expect(result.ok).toBe(false);
  });

  it('validates link when present', () => {
    const result = validateTaskUpdate({ link: 'oops' });
    expect(result.ok).toBe(false);
  });
});

describe('validateAdminInsert dispatch', () => {
  it('routes tasks through the strict validator', () => {
    const result = validateAdminInsert('tasks', { title: '', reward: 1, link: 'https://a', category: 'micro' });
    expect(result.ok).toBe(false);
  });

  it('passes through unknown tables (lax)', () => {
    const result = validateAdminInsert('settings', { foo: 'bar' });
    expect(result.ok).toBe(true);
  });

  it('still rejects non-object input on lax tables', () => {
    const result = validateAdminInsert('settings', null);
    expect(result.ok).toBe(false);
  });
});

describe('validateAdminUpdate dispatch', () => {
  it('routes tasks through the strict validator', () => {
    const result = validateAdminUpdate('tasks', { reward: -5 });
    expect(result.ok).toBe(false);
  });

  it('passes through unknown tables (lax)', () => {
    const result = validateAdminUpdate('settings', { foo: 'bar' });
    expect(result.ok).toBe(true);
  });
});
