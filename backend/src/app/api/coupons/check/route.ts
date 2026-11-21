import { z } from 'zod';
import { applyCoupon } from '@/lib/coupons';
import { storeCurrency } from '@/lib/env';
import { handle, json, rateLimit, readJson } from '@/lib/http';
import { cartItemSchema, priceCart } from '@/lib/orders';
import { toUnits } from '@/lib/money';

export const dynamic = 'force-dynamic';

const schema = z.object({ code: z.string().trim().min(1).max(40), items: z.array(cartItemSchema).min(1).max(50) });

// POST /api/coupons/check: lets the checkout show a code's discount before paying.
// The real discount is worked out again at /api/checkout.
export const POST = handle(async (request: Request) => {
  rateLimit(request, 'coupon-check', 30, 10 * 60_000);
  const { code, items } = await readJson(request, schema);
  const { subtotal } = await priceCart(items);
  const coupon = await applyCoupon(code, subtotal, storeCurrency());
  return json({ code: coupon.code, label: coupon.label, discount: toUnits(coupon.discount), total: toUnits(subtotal - coupon.discount) });
});
