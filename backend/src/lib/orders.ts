import 'server-only';
import { z } from 'zod';
import { db } from './db';
import { sendEmail, shopInbox } from './email';
import { storeName } from './env';
import { HttpError } from './http';
import { formatMoney } from './money';
import { effectivePriceCents, parseVariants } from './products';

export const MAX_QTY = 10;

const text = (max: number) => z.string().trim().min(1).max(max);

export const customerSchema = z.object({
  email: z.email().max(200),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{6,}$/, 'Enter a valid phone number.').max(30),
  firstName: text(80),
  lastName: text(80),
  address1: text(200),
  address2: z.string().trim().max(200).optional().default(''),
  city: text(100),
  state: text(100),
  postcode: text(20),
  country: text(80),
});

export const cartItemSchema = z.object({
  id: text(60),
  variant: z.record(z.string(), z.string()).nullable().optional(),
  qty: z.number().int().min(1).max(MAX_QTY),
});

export const checkoutSchema = z.object({
  customer: customerSchema,
  // Prices or totals sent by the browser are ignored: everything is recalculated here.
  items: z.array(cartItemSchema).min(1).max(50),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Prices each cart line from the database and checks stock and variant choices. */
export async function priceCart(items: CheckoutInput['items']) {
  const ids = [...new Set(items.map((i) => i.id))];
  const products = await db.product.findMany({ where: { id: { in: ids } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = items.map((item) => {
    const product = byId.get(item.id);
    if (!product) throw new HttpError(409, 'An item in your bag is no longer available. Please review your bag.', { productId: item.id });
    if (!product.inStock) throw new HttpError(409, `${product.name} is sold out. Please remove it from your bag.`, { productId: item.id });

    const variants = parseVariants(product.variants);
    const chosen = item.variant ?? {};
    for (const v of variants) {
      if (!v.options.includes(chosen[v.name] ?? '')) {
        throw new HttpError(400, `Please choose a ${v.name.toLowerCase()} for ${product.name}.`, { productId: item.id });
      }
    }
    const variant = variants.length ? Object.fromEntries(variants.map((v) => [v.name, chosen[v.name]])) : null;
    const unitPrice = effectivePriceCents(product);
    return { productId: product.id, name: product.name, variant, qty: item.qty, unitPrice };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  return { lines, subtotal };
}

/**
 * Marks a PENDING order as PAID exactly once, then sends the emails.
 * Safe to call from both the verify route and the webhook.
 */
export async function markOrderPaid(orderId: string, razorpayPaymentId: string) {
  const { count } = await db.order.updateMany({
    where: { id: orderId, status: 'PENDING' },
    data: { status: 'PAID', razorpayPaymentId, paidAt: new Date() },
  });
  if (count === 0) return false; // already handled
  await sendOrderEmails(orderId).catch((err) => console.error('[orders] Email failed:', err));
  return true;
}

async function sendOrderEmails(orderId: string) {
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return;
  const c = order.customer as Record<string, string>;
  const money = (cents: number) => formatMoney(cents, order.currency);
  const lines = order.items
    .map((i) => {
      const variant = i.variant ? ` (${Object.values(i.variant as Record<string, string>).join(', ')})` : '';
      return `- ${i.name}${variant} x ${i.qty}: ${money(i.unitPrice * i.qty)}`;
    })
    .join('\n');
  const address = [c.address1, c.address2, `${c.city}, ${c.state} ${c.postcode}`, c.country].filter(Boolean).join('\n');
  const ref = order.id.slice(-8).toUpperCase();

  await sendEmail({
    to: order.email,
    subject: `Your ${storeName()} order ${ref}`,
    text: `Dear ${c.firstName},\n\nThank you for your order. We have received your payment.\n\nOrder ${ref}\n${lines}\n\nTotal paid: ${money(order.subtotal)}\n\nShipping to:\n${c.firstName} ${c.lastName}\n${address}\n\nWe will email you again when your order ships.\n\n${storeName()}`,
  });

  const inbox = shopInbox();
  if (inbox) {
    await sendEmail({
      to: inbox,
      replyTo: order.email,
      subject: `New paid order ${ref}: ${money(order.subtotal)}`,
      text: `${c.firstName} ${c.lastName} <${order.email}>, ${c.phone}\n\n${lines}\n\nTotal: ${money(order.subtotal)}\n\nShip to:\n${address}`,
    });
  }
}
