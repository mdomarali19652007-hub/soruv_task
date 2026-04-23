import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resetTransportForTests, sendEmail, isEmailConfigured } from '../src/server/email';
import { verificationEmail, passwordResetEmail } from '../src/server/email-templates';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.NODE_ENV;
  // All active-delivery tests below flip EMAIL_ENABLED on explicitly.
  // The kill-switch default (EMAIL_ENABLED unset) is exercised in the
  // "master kill switch" block.
  process.env.EMAIL_ENABLED = 'true';
  resetTransportForTests();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetTransportForTests();
  vi.restoreAllMocks();
});

describe('email transport', () => {
  it('falls back to the dev console logger when no provider is configured', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await sendEmail({ to: 'dev@example.com', subject: 'hi', html: '<p>hi</p>' });
    expect(warn).toHaveBeenCalled();
    const rendered = warn.mock.calls[0][0] as string;
    expect(rendered).toContain('dev@example.com');
    expect(rendered).toContain('<p>hi</p>');
  });

  it('reports configured=false without a Resend key', () => {
    expect(isEmailConfigured()).toBe(false);
  });

  it('reports configured=true with a Resend key', () => {
    process.env.RESEND_API_KEY = 'test-key';
    expect(isEmailConfigured()).toBe(true);
  });

  it('uses the Resend REST API when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 'resend-key';
    process.env.EMAIL_FROM = 'noreply@example.com';

    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ id: 'abc' }), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await sendEmail({ to: 'user@example.com', subject: 'Subj', html: '<b>hi</b>', text: 'hi' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    const url = call[0];
    const init = call[1]!;
    expect(url).toBe('https://api.resend.com/emails');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer resend-key');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      from: 'noreply@example.com',
      to: ['user@example.com'],
      subject: 'Subj',
      html: '<b>hi</b>',
      text: 'hi',
    });
  });

  it('throws a helpful error when Resend responds non-2xx', async () => {
    process.env.RESEND_API_KEY = 'resend-key';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('bad token', { status: 401 })),
    );
    await expect(
      sendEmail({ to: 'user@example.com', subject: 'x', html: 'x' }),
    ).rejects.toThrow(/Resend request failed \(401\)/);
  });

  it('throws in production when no provider is configured', async () => {
    process.env.NODE_ENV = 'production';
    await expect(
      sendEmail({ to: 'a@b.com', subject: 'x', html: 'x' }),
    ).rejects.toThrow(/no email provider configured/i);
  });
});

describe('master kill switch (EMAIL_ENABLED)', () => {
  it('isEmailConfigured is false when EMAIL_ENABLED is unset even with an API key', () => {
    delete process.env.EMAIL_ENABLED;
    process.env.RESEND_API_KEY = 'real-key';
    expect(isEmailConfigured()).toBe(false);
  });

  it('isEmailConfigured is false when EMAIL_ENABLED is "false" with an API key', () => {
    process.env.EMAIL_ENABLED = 'false';
    process.env.RESEND_API_KEY = 'real-key';
    expect(isEmailConfigured()).toBe(false);
  });

  it('sendEmail is a no-op and does not throw in production when EMAIL_ENABLED is off', async () => {
    delete process.env.EMAIL_ENABLED;
    process.env.NODE_ENV = 'production';
    // No fetch mock installed -- if the transport tried to call Resend
    // the test would fail with a network error. The no-op transport
    // should swallow the call entirely.
    await expect(
      sendEmail({ to: 'u@e.com', subject: 'x', html: 'x' }),
    ).resolves.toBeUndefined();
  });

  it('sendEmail still uses Resend when EMAIL_ENABLED=true and RESEND_API_KEY is set', async () => {
    process.env.EMAIL_ENABLED = 'true';
    process.env.RESEND_API_KEY = 'real-key';
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response('{}', { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await sendEmail({ to: 'u@e.com', subject: 'x', html: 'x' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('email templates', () => {
  it('builds a verification email with the given URL', () => {
    const msg = verificationEmail('user@example.com', 'https://app/verify?token=abc');
    expect(msg.to).toBe('user@example.com');
    expect(msg.subject.toLowerCase()).toContain('verify');
    expect(msg.html).toContain('https://app/verify?token=abc');
    expect(msg.text).toContain('https://app/verify?token=abc');
  });

  it('escapes HTML-hostile characters in the reset URL', () => {
    const msg = passwordResetEmail('u@e.com', 'https://app/reset?token=<script>');
    expect(msg.html).not.toContain('<script>');
    expect(msg.html).toContain('&lt;script&gt;');
  });
});
