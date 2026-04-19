/**
 * Minimal HTML + plain-text templates for transactional emails.
 *
 * These are deliberately simple inline-styled snippets so they render
 * correctly in every major mail client without pulling in an MJML /
 * react-email pipeline. Bangla users get a bilingual footer; headings
 * stay in English for universal fallback.
 */

import type { EmailMessage } from './email.js';

const APP_NAME = 'Soruv Task';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell(bodyHtml: string): string {
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#0f172a;">
    <h1 style="font-size:20px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#4338ca;margin:0 0 24px;">${APP_NAME}</h1>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0 16px;" />
    <p style="font-size:12px;color:#64748b;margin:0;">
      If you did not request this email, you can safely ignore it.<br/>
      আপনি যদি এই ইমেইলের অনুরোধ না করে থাকেন, তাহলে এটি উপেক্ষা করতে পারেন।
    </p>
  </div>`;
}

export function verificationEmail(to: string, url: string): EmailMessage {
  const safeUrl = escapeHtml(url);
  const html = shell(`
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">Please confirm your email address to activate your ${APP_NAME} account.</p>
    <p style="margin:24px 0;">
      <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background:#4338ca;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;">Verify email</a>
    </p>
    <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">Or copy this link into your browser:<br/><span style="word-break:break-all;color:#4338ca;">${safeUrl}</span></p>
  `);
  const text = [
    `Please confirm your email address to activate your ${APP_NAME} account.`,
    '',
    `Verify: ${url}`,
    '',
    'If you did not request this, you can ignore this email.',
  ].join('\n');
  return {
    to,
    subject: `${APP_NAME}: verify your email`,
    html,
    text,
  };
}

export function passwordResetEmail(to: string, url: string): EmailMessage {
  const safeUrl = escapeHtml(url);
  const html = shell(`
    <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">We received a request to reset the password for your ${APP_NAME} account.</p>
    <p style="margin:24px 0;">
      <a href="${safeUrl}" style="display:inline-block;padding:12px 24px;background:#4338ca;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;">Reset password</a>
    </p>
    <p style="font-size:13px;color:#475569;line-height:1.6;margin:0;">This link expires in 1 hour. Or copy it into your browser:<br/><span style="word-break:break-all;color:#4338ca;">${safeUrl}</span></p>
  `);
  const text = [
    `We received a request to reset the password for your ${APP_NAME} account.`,
    '',
    `Reset: ${url}`,
    '',
    'This link expires in 1 hour. If you did not request this, you can ignore this email.',
  ].join('\n');
  return {
    to,
    subject: `${APP_NAME}: reset your password`,
    html,
    text,
  };
}
