import { applyCoupon } from '@/lib/coupons';
import { db } from '@/lib/db';
import { storeCurrency, storeName } from '@/lib/env';
import { handle, HttpError, json, rateLimit, readJson } from '@/lib/http';
import { checkoutSchema, priceCart } from '@/lib/orders';
import { razorpay, razorpayKeys } from '@/lib/razorpay';
import { quoteShipping } from '@/lib/shipping';

// POST /api/checkout
// Prices the bag from the database, saves a PENDING order and opens a
// Razorpay order for the same amount. The storefront then opens Razorpay's
// payment popup with the returned details.
export const POST = handle(async (request: Request) => {
  rateLimit(request, 'checkout', 20, 10 * 60_000);
  const { keyId } = razorpayKeys(); // fail fast (503) if payments are not set up
  const { customer, items, couponCode } = await readJson(request, checkoutSchema);
  const { lines, subtotal: itemsTotal } = await priceCart(items);
  const currency = storeCurrency();
  // The coupon is re-checked here, so an expired or used-up code can't slip through.
  const coupon = couponCode ? await applyCoupon(couponCode, itemsTotal, currency) : null;
  const afterDiscount = itemsTotal - (coupon?.discount ?? 0);
  // Delivery is priced from the shipping zones; an address no zone covers is refused.
  const shipping = await quoteShipping(customer.postcode, customer.state, afterDiscount);
  const subtotal = afterDiscount + shipping.cost; // the amount charged

  const order = await db.order.create({
    data: {
      email: customer.email.toLowerCase(),
      customer,
      subtotal,
      couponCode: coupon?.code ?? null,
      discount: coupon?.discount ?? 0,
      shipping: shipping.cost,
      shippingZone: shipping.zone,
      currency,
      items: { create: lines.map((l) => ({ ...l, variant: l.variant ?? undefined })) },
    },
  });

  try {
    const rzpOrder = await razorpay().orders.create({
      amount: subtotal, // smallest currency unit (cents)
      currency,
      receipt: order.id,
      notes: { orderId: order.id },
    });
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } });

    return json({
      orderId: order.id,
      razorpay: {
        key: keyId,
        orderId: rzpOrder.id,
        amount: subtotal,
        currency,
        name: storeName(),
        prefill: { name: `${customer.firstName} ${customer.lastName}`, email: customer.email, contact: customer.phone },
      },
    });
  } catch (err) {
    await db.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    console.error('[checkout] Razorpay order failed:', err);
    throw new HttpError(502, 'We could not start the payment. You have not been charged. Please try again.');
  }
});
