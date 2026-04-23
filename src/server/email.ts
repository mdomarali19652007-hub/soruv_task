/**
 * Outbound email transport.
 *
 * Strategy
 * --------
 * Better Auth exposes two callbacks where we need to send email:
 *   - `emailVerification.sendVerificationEmail`
 *   - `emailAndPassword.sendResetPassword`
 *
 * This module gives us a single `sendEmail` helper that picks a transport
 * based on environment variables. Providers are added as plain fetch calls
 * so we do not have to pull in nodemailer / provider SDKs.
 *
 * Supported providers (in priority order):
 *   1. Resend         -- set `RESEND_API_KEY`
 *   2. Console logger -- used automatically in dev when no provider is set.
 *                        Writes the full message to stdout so the app still
 *                        boots without email credentials.
 *
 * All providers read the "from" address from `EMAIL_FROM`
 * (default: `no-reply@localhost`).
 *
 * The helper NEVER throws when the dev logger is active; in production
 * (`NODE_ENV === 'production'`) it throws if no provider is configured so
 * you notice a misconfigured deploy immediately.
 *
 * Kill switch
 * -----------
 * The whole email system is gated behind the `EMAIL_ENABLED` env var.
 * It defaults to OFF. When disabled:
 *   - `isEmailConfigured()` returns false regardless of `RESEND_API_KEY`
 *   - `sendEmail()` is a no-op (logs once at startup so it is discoverable)
 *   - `pickTransport()` never throws in production
 *
 * Flip `EMAIL_ENABLED=true` in the environment to re-enable delivery
 * (and set `RESEND_API_KEY` / `EMAIL_FROM` for production).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export type EmailTransport = (msg: EmailMessage) => Promise<void>;

const DEFAULT_FROM = 'no-reply@localhost';

function getFrom(): string {
  return process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;
}

/**
 * Master kill switch for the email system.
 * Must be set to the literal string `"true"` to enable any email behavior.
 * Defaults to disabled so deployments without email provider credentials
 * cannot accidentally crash on boot or block user flows.
 */
function isEmailEnabled(): boolean {
  return process.env.EMAIL_ENABLED?.trim().toLowerCase() === 'true';
}

function disabledTransport(): EmailTransport {
  let warned = false;
  return async () => {
    if (!warned) {
      warned = true;
      console.info(
        '[email] EMAIL_ENABLED is not set to "true" -- email system is a no-op. ' +
          'Set EMAIL_ENABLED=true (and RESEND_API_KEY in production) to enable delivery.',
      );
    }
  };
}

/**
 * Resend (https://resend.com) REST transport.
 * Docs: https://resend.com/docs/api-reference/emails/send-email
 */
function resendTransport(apiKey: string): EmailTransport {
  return async ({ to, subject, html, text }) => {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFrom(),
        to: [to],
        subject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '');
      throw new Error(`[email] Resend request failed (${res.status}): ${bodyText.slice(0, 500)}`);
    }
  };
}

/**
 * Development-only transport. Logs the email payload to stdout so local
 * developers can copy reset / verification links without configuring a
 * real provider. Intentionally LOUD so it is obvious when email is not
 * really being sent.
 */
function consoleTransport(): EmailTransport {
  return async ({ to, subject, html, text }) => {
    console.warn(
      '\n[email][dev-log] ================================================\n' +
        `  TO:      ${to}\n` +
        `  FROM:    ${getFrom()}\n` +
        `  SUBJECT: ${subject}\n` +
        '  ---- TEXT ----\n' +
        (text || '(none)') +
        '\n  ---- HTML ----\n' +
        html +
        '\n================================================\n' +
        '  No real email provider is configured. Set RESEND_API_KEY to enable delivery.\n',
    );
  };
}

function pickTransport(): EmailTransport {
  // Kill switch: when EMAIL_ENABLED is not explicitly "true", the system
  // is a no-op. This is the default so missing RESEND_API_KEY does not
  // crash production boot and missing verification does not block users.
  if (!isEmailEnabled()) return disabledTransport();

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) return resendTransport(resendKey);

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[email] EMAIL_ENABLED=true but no email provider configured. ' +
        'Set RESEND_API_KEY (or another supported provider) before deploying to production.',
    );
  }

  return consoleTransport();
}

// Lazy so tests / modules that import this file without sending email
// do not need env vars set.
let cached: EmailTransport | null = null;
export function getTransport(): EmailTransport {
  if (!cached) cached = pickTransport();
  return cached;
}

/** Clear the cached transport. Intended for tests. */
export function resetTransportForTests(): void {
  cached = null;
}

/** Send an email via the currently configured provider. */
export async function sendEmail(msg: EmailMessage): Promise<void> {
  return getTransport()(msg);
}

/**
 * True when a real (non-dev) transport is available AND the master kill
 * switch is on. Better Auth uses this to decide whether to enforce email
 * verification and whether to send messages at signup.
 */
export function isEmailConfigured(): boolean {
  return isEmailEnabled() && Boolean(process.env.RESEND_API_KEY?.trim());
}
