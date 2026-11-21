import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { env, storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage() {
  const currency = storeCurrency();
  const [payments, received, refunded] = await Promise.all([
    db.order.findMany({ where: { paidAt: { not: null } }, orderBy: { paidAt: 'desc' }, take: 200 }),
    db.order.aggregate({ where: { status: { in: ['PAID', 'SHIPPED'] } }, _sum: { subtotal: true }, _count: true }),
    db.order.aggregate({ where: { status: 'REFUNDED' }, _sum: { subtotal: true }, _count: true }),
  ]);
  const live = Boolean(env('RAZORPAY_KEY_ID') && env('RAZORPAY_KEY_SECRET'));

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Payments</h1>
          <p className="muted">Card payments taken through Razorpay at checkout.</p>
        </div>
      </div>

      {!live && <p className="alert alert--error">Razorpay keys are not set, so the shop cannot take payments yet. See Settings.</p>}

      <div className="tiles">
        <div className="tile tile--gold">
          <span className="tile__value">{formatMoney(received._sum.subtotal ?? 0, currency)}</span>
          <span className="tile__label">Received</span>
          <span className="tile__note">{received._count} paid orders</span>
        </div>
        <div className="tile tile--rose">
          <span className="tile__value">{formatMoney(refunded._sum.subtotal ?? 0, currency)}</span>
          <span className="tile__label">Refunded</span>
          <span className="tile__note">{refunded._count} orders</span>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card muted">No payments yet.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Paid on</th>
                <th>Order</th>
                <th>Razorpay payment</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((o) => (
                <tr key={o.id}>
                  <td className="small">{o.paidAt!.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                  <td>
                    <Link href={`/admin/orders/${o.id}`}>{o.id.slice(-8).toUpperCase()}</Link>
                    <div className="muted small">{o.email}</div>
                  </td>
                  <td className="small">{o.razorpayPaymentId ?? '—'}</td>
                  <td>
                    <span className={`badge badge--${o.status}`}>{o.status.toLowerCase()}</span>
                  </td>
                  <td className="num">{formatMoney(o.subtotal, o.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
