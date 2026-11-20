import { z } from 'zod';
import { db } from '@/lib/db';
import { handle, HttpError, json, rateLimit, readJson } from '@/lib/http';
import { markOrderPaid } from '@/lib/orders';
import { isValidPaymentSignature, razorpay } from '@/lib/razorpay';

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().min(1).max(100),
  razorpay_signature: z.string().min(1).max(200),
});

// POST /api/checkout/verify
// Called by the storefront with what Razorpay's popup returned. The order is
// marked PAID only when the signature checks out AND Razorpay confirms the
// payment was captured for the full amount.
export const POST = handle(async (request: Request) => {
  rateLimit(request, 'verify', 30, 10 * 60_000);
  const body = await readJson(request, verifySchema);

  if (!isValidPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    throw new HttpError(400, 'We could not verify this payment.');
  }

  const order = await db.order.findUnique({ where: { razorpayOrderId: body.razorpay_order_id } });
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.status !== 'PENDING') return json({ orderId: order.id, status: order.status });

  let payment = await razorpay().payments.fetch(body.razorpay_payment_id);
  if (payment.order_id !== order.razorpayOrderId || Number(payment.amount) !== order.subtotal || payment.currency !== order.currency) {
    throw new HttpError(400, 'The payment does not match this order.');
  }
  if (payment.status === 'authorized') {
    // Auto-capture is off in the Razorpay dashboard: capture it now.
    payment = await razorpay().payments.capture(payment.id, order.subtotal, order.currency);
  }
  if (payment.status !== 'captured') throw new HttpError(402, 'The payment was not completed.');

  await markOrderPaid(order.id, payment.id);
  return json({ orderId: order.id, status: 'PAID' });
});
