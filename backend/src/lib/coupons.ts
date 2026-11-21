import 'server-only';
import type { Coupon } from '@/generated/prisma/client';
import { db } from './db';
import { HttpError } from './http';
import { formatMoney } from './money';

/** The smallest amount Razorpay accepts (1.00 in the store currency). A coupon never takes an order below it. */
export const MIN_CHARGE = 100;

/** Codes are matched without regard to case or spaces: " welcome10 " → "WELCOME10". */
export const normaliseCode = (code: string) => code.trim().toUpperCase().replace(/\s+/g, '');

/** "10% off" or "$25.00 off". */
export const describeCoupon = (c: Pick<Coupon, 'type' | 'value'>, currency: string) =>
  c.type === 'percent' ? `${c.value}% off` : `${formatMoney(c.value, currency)} off`;

export type CouponState = 'active' | 'paused' | 'expired' | 'used up';

export function couponState(c: Coupon, now = new Date()): CouponState {
  if (!c.active) return 'paused';
  if (c.expiresAt && c.expiresAt < now) return 'expired';
  if (c.maxUses != null && c.uses >= c.maxUses) return 'used up';
  return 'active';
}

/**
 * Checks a code against a bag total (in cents) and returns the discount in cents.
 * Throws an HttpError with a shopper-friendly message when the code can't be used.
 */
export async function applyCoupon(rawCode: string, subtotal: number, currency: string) {
  const code = normaliseCode(rawCode);
  const coupon = code ? await db.coupon.findUnique({ where: { code } }) : null;
  if (!coupon) throw new HttpError(404, 'This code is not valid.');

  const state = couponState(coupon);
  if (state === 'expired') throw new HttpError(409, 'This code has expired.');
  if (state !== 'active') throw new HttpError(409, 'This code is no longer available.');
  if (subtotal < coupon.minSubtotal) {
    throw new HttpError(409, `This code needs a bag of at least ${formatMoney(coupon.minSubtotal, currency)}.`);
  }

  const raw = coupon.type === 'percent' ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  const discount = Math.max(0, Math.min(raw, subtotal - MIN_CHARGE));
  return { code, discount, label: describeCoupon(coupon, currency) };
}
