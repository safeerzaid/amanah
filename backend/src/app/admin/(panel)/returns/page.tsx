import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Returns' };

export default async function ReturnsPage() {
  const orders = await db.order.findMany({
    where: { status: { in: ['REFUNDED', 'CANCELLED'] } },
    orderBy: { updatedAt: 'desc' },
    take: 200,
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Returns</h1>
          <p className="muted">Refunded and cancelled orders. To record a return, open the order and set its status to Refunded.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card muted">No returns or cancellations.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Updated</th>
                <th>Status</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const c = o.customer as Record<string, string>;
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}>{o.id.slice(-8).toUpperCase()}</Link>
                    </td>
                    <td>
                      {c.firstName} {c.lastName}
                      <div className="muted small">{o.email}</div>
                    </td>
                    <td className="small">{o.updatedAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}</td>
                    <td>
                      <span className={`badge badge--${o.status}`}>{o.status.toLowerCase()}</span>
                    </td>
                    <td className="num">{formatMoney(o.subtotal, o.currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
