import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import Razorpay from 'razorpay';
import { env } from './env';
import { HttpError } from './http';

let client: Razorpay | null = null;

export function razorpayKeys() {
  const keyId = env('RAZORPAY_KEY_ID');
  const keySecret = env('RAZORPAY_KEY_SECRET');
  if (!keyId || !keySecret) throw new HttpError(503, 'Online payment is not set up yet.');
  return { keyId, keySecret };
}

export function razorpay() {
  if (!client) {
    const { keyId, keySecret } = razorpayKeys();
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

function safeEqualHex(expected: string, received: string) {
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(received, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Signature Razorpay Checkout returns after a successful payment. */
export function isValidPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = razorpayKeys();
  const expected = createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/** Signature on webhook calls (X-Razorpay-Signature), computed over the raw body. */
export function isValidWebhookSignature(rawBody: string, signature: string) {
  const secret = env('RAZORPAY_WEBHOOK_SECRET');
  if (!secret) throw new HttpError(503, 'Webhook secret is not configured.');
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
