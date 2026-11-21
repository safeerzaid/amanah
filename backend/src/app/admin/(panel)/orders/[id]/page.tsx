import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';
import { updateOrderStatus } from '../../actions';
import Dropdown from '../../Dropdown';

export const metadata: Metadata = { title: 'Order' };

const STATUS_HELP: Record<string, string> = {
  PENDING: 'The shopper started checkout but payment has not been confirmed.',
  PAID: 'Paid and waiting to be shipped.',
  SHIPPED: 'Sent to the customer.',
  CANCELLED: 'Cancelled. No payment was taken, or it was refunded separately.',
  REFUNDED: 'Refunded. Issue the refund itself in the Razorpay dashboard.',
};

export default async function OrderPage({ params }: PageProps<'/admin/orders/[id]'>) {
  const { id } = await params;
  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) notFound();

  const c = order.customer as Record<string, string>;
  const money = (cents: number) => formatMoney(cents, order.currency);

  return (
    <>
      <div className="page-head">
        <h1>Order {order.id.slice(-8).toUpperCase()}</h1>
        <Link className="btn btn--ghost" href="/admin/orders">
          Back to orders
        </Link>
      </div>

      <section className="card">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <span className={`badge badge--${order.status}`}>{order.status.toLowerCase()}</span>{' '}
            <span className="muted small">{STATUS_HELP[order.status]}</span>
          </div>
          <form action={updateOrderStatus.bind(null, order.id)} className="row">
            <label className="row" style={{ gap: 8 }}>
              Change status
              <Dropdown
                name="status"
                defaultValue={order.status}
                className="dropdown--auto"
                options={Object.keys(STATUS_HELP).map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))}
              />
            </label>
            <button className="btn btn--sm">Update</button>
          </form>
        </div>
      </section>

      <section className="table-wrap" style={{ marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th className="num">Qty</th>
              <th className="num">Price</th>
              <th className="num">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id}>
                <td>
                  {i.name}
                  {i.variant && <div className="muted small">{Object.entries(i.variant as Record<string, string>).map(([k, v]) => `${k}: ${v}`).join(' · ')}</div>}
                </td>
                <td className="num">{i.qty}</td>
                <td className="num">{money(i.unitPrice)}</td>
                <td className="num">{money(i.unitPrice * i.qty)}</td>
              </tr>
            ))}
            {order.couponCode && (
              <tr>
                <td colSpan={3}>Coupon {order.couponCode}</td>
                <td className="num">−{money(order.discount)}</td>
              </tr>
            )}
            <tr>
              <td colSpan={3}>Shipping{order.shippingZone && <span className="muted small"> · {order.shippingZone}</span>}</td>
              <td className="num">{order.shipping ? money(order.shipping) : 'Free'}</td>
            </tr>
            <tr>
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>{money(order.subtotal)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="form-grid">
        <section className="card">
          <h2>Customer</h2>
          <dl className="details">
            <dt>Name</dt>
            <dd>
              {c.firstName} {c.lastName}
            </dd>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${order.email}`}>{order.email}</a>
            </dd>
            <dt>Phone</dt>
            <dd>{c.phone}</dd>
          </dl>
          <h2 style={{ marginTop: 20 }}>Ship to</h2>
          <p className="pre">{[c.address1, c.address2, `${c.city}, ${c.state} ${c.postcode}`, c.country].filter(Boolean).join('\n')}</p>
        </section>
        <section className="card">
          <h2>Payment</h2>
          <dl className="details">
            <dt>Placed</dt>
            <dd>{order.createdAt.toLocaleString('en-CA')}</dd>
            <dt>Paid</dt>
            <dd>{order.paidAt ? order.paidAt.toLocaleString('en-CA') : 'Not yet'}</dd>
            <dt>Razorpay order</dt>
            <dd className="small">{order.razorpayOrderId ?? '-'}</dd>
            <dt>Razorpay payment</dt>
            <dd className="small">{order.razorpayPaymentId ?? '-'}</dd>
          </dl>
        </section>
      </div>
    </>
  );
}
