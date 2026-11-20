import 'server-only';
import { Resend } from 'resend';
import { env, storeName } from './env';

let client: Resend | null = null;

type Mail = { to: string; subject: string; text: string; replyTo?: string };

/**
 * Sends an email through Resend. Without RESEND_API_KEY / EMAIL_FROM it logs and
 * skips, so the rest of a request (saving an order or message) still succeeds.
 */
export async function sendEmail({ to, subject, text, replyTo }: Mail) {
  const apiKey = env('RESEND_API_KEY');
  const from = env('EMAIL_FROM');
  if (!apiKey || !from) {
    console.warn(`[email] Not configured; skipped "${subject}" to ${to}.`);
    return false;
  }
  client ??= new Resend(apiKey);
  const { error } = await client.emails.send({ from: `${storeName()} <${from}>`, to, subject, text, replyTo });
  if (error) {
    console.error('[email] Send failed:', error);
    return false;
  }
  return true;
}

/** The shop's own inbox, for contact messages and new-order alerts. */
export const shopInbox = () => env('SHOP_EMAIL');
