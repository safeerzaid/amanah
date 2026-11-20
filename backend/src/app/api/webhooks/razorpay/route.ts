import { db } from '@/lib/db';
import { handle, HttpError, json } from '@/lib/http';
import { markOrderPaid } from '@/lib/orders';
import { isValidWebhookSignature } from '@/lib/razorpay';

type PaymentEntity = { id: string; order_id: string; amount: number; currency: string; status: string };

// POST /api/webhooks/razorpay
// Backup confirmation from Razorpay, so an order is still marked PAID if the
// shopper closed the page before /api/checkout/verify ran.
// Subscribe to: payment.captured, payment.failed.
export const POST = handle(async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  if (!signature || !isValidWebhookSignature(rawBody, signature)) throw new HttpError(400, 'Invalid signature.');

  const event = JSON.parse(rawBody) as { event: string; payload?: { payment?: { entity?: PaymentEntity } } };
  const payment = event.payload?.payment?.entity;

  if (event.event === 'payment.captured' && payment) {
    const order = await db.order.findUnique({ where: { razorpayOrderId: payment.order_id } });
    if (!order) return json({ ok: true, note: 'unknown order' });
    if (payment.amount !== order.subtotal || payment.currency !== order.currency) {
      console.error(`[webhook] Amount mismatch on order ${order.id}: paid ${payment.amount} ${payment.currency}`);
      return json({ ok: true, note: 'amount mismatch' });
    }
    await markOrderPaid(order.id, payment.id);
  } else if (event.event === 'payment.failed' && payment) {
    console.warn(`[webhook] Payment ${payment.id} failed for Razorpay order ${payment.order_id}.`);
  }

  // Always 200 for a valid signature, so Razorpay doesn't keep retrying.
  return json({ ok: true });
});
