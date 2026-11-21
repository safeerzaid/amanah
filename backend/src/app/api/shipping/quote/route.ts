import { z } from 'zod';
import { applyCoupon } from '@/lib/coupons';
import { storeCurrency } from '@/lib/env';
import { handle, json, rateLimit, readJson } from '@/lib/http';
import { toUnits } from '@/lib/money';
import { cartItemSchema, priceCart } from '@/lib/orders';
import { deliveryDays, quoteShipping } from '@/lib/shipping';

export const dynamic = 'force-dynamic';

const schema = z.object({
  postcode: z.string().trim().min(3).max(20),
  state: z.string().trim().max(100).optional().default(''),
  items: z.array(cartItemSchema).min(1).max(50),
  couponCode: z.string().trim().max(40).optional(),
});

// POST /api/shipping/quote: lets the checkout show the delivery charge for an address.
// The real charge is worked out again at /api/checkout.
export const POST = handle(async (request: Request) => {
  rateLimit(request, 'shipping-quote', 60, 10 * 60_000);
  const { postcode, state, items, couponCode } = await readJson(request, schema);
  const { subtotal } = await priceCart(items);
  const coupon = couponCode ? await applyCoupon(couponCode, subtotal, storeCurrency()).catch(() => null) : null;
  const afterDiscount = subtotal - (coupon?.discount ?? 0);
  const quote = await quoteShipping(postcode, state, afterDiscount);
  return json({
    shipping: toUnits(quote.cost),
    zone: quote.zone,
    days: quote.minDays != null && quote.maxDays != null ? deliveryDays(quote.minDays, quote.maxDays) : null,
    total: toUnits(afterDiscount + quote.cost),
  });
});
