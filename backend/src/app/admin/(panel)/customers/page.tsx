import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Customers' };

// There is no customer account table: a customer is everyone who has paid for an
// order, grouped by email.
export default async function CustomersPage() {
  const currency = storeCurrency();
  const [orders, subscribers] = await Promise.all([
    db.order.findMany({ where: { status: { in: ['PAID', 'SHIPPED'] } }, orderBy: { createdAt: 'desc' } }),
    db.newsletterSubscriber.findMany({ select: { email: true } }),
  ]);
  const subscribed = new Set(subscribers.map((s) => s.email.toLowerCase()));

  const byEmail = new Map<string, { name: string; email: string; phone: string; orders: number; spent: number; last: Date }>();
  for (const o of orders) {
    const key = o.email.toLowerCase();
    const c = o.customer as Record<string, string>;
    const row = byEmail.get(key);
    if (row) {
      row.orders += 1;
      row.spent += o.subtotal;
    } else {
      byEmail.set(key, { name: `${c.firstName} ${c.lastName}`, email: o.email, phone: c.phone ?? '', orders: 1, spent: o.subtotal, last: o.createdAt });
    }
  }
  const customers = [...byEmail.values()].sort((a, b) => b.spent - a.spent);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Customers</h1>
          <p className="muted">Everyone who has paid for an order, by total spent.</p>
        </div>
      </div>
      {customers.length === 0 ? (
        <div className="card muted">No customers yet. They appear here after their first paid order.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Last order</th>
                <th className="num">Orders</th>
                <th className="num">Spent</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td>
                    {c.name} {subscribed.has(c.email.toLowerCase()) && <span className="badge badge--featured">Newsletter</span>}
                    <div className="muted small">
                      <a href={`mailto:${c.email}`}>{c.email}</a>
                    </div>
                  </td>
                  <td className="small">{c.phone || '—'}</td>
                  <td className="small">{c.last.toLocaleDateString('en-CA', { dateStyle: 'medium' })}</td>
                  <td className="num">{c.orders}</td>
                  <td className="num">{formatMoney(c.spent, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
