import type { Metadata } from 'next';
import Link from 'next/link';
import type { OrderStatus } from '@/generated/prisma/client';
import { db } from '@/lib/db';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Orders' };

const FILTERS: { label: string; status?: OrderStatus }[] = [
  { label: 'To ship', status: 'PAID' },
  { label: 'Shipped', status: 'SHIPPED' },
  { label: 'Awaiting payment', status: 'PENDING' },
  { label: 'Cancelled', status: 'CANCELLED' },
  { label: 'Refunded', status: 'REFUNDED' },
  { label: 'All' },
];

export default async function OrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  const raw = (await searchParams).status;
  const current = FILTERS.find((f) => (f.status ?? 'ALL') === (typeof raw === 'string' ? raw : 'PAID')) ?? FILTERS[0];
  const orders = await db.order.findMany({
    where: current.status ? { status: current.status } : {},
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <>
      <div className="page-head">
        <h1>Orders</h1>
      </div>
      <nav className="tabs" aria-label="Filter orders">
        {FILTERS.map((f) => (
          <Link key={f.label} href={`/admin/orders?status=${f.status ?? 'ALL'}`} aria-current={f === current ? 'page' : undefined}>
            {f.label}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <div className="card muted">No orders here.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const c = o.customer as Record<string, string>;
                return (
                  <tr key={o.id}>
                    <td>
                      <Link href={`/admin/orders/${o.id}`}>{o.id.slice(-8).toUpperCase()}</Link>
                      <div className="muted small">
                        {o._count.items} item{o._count.items === 1 ? '' : 's'}
                      </div>
                    </td>
                    <td>
                      {c.firstName} {c.lastName}
                      <div className="muted small">{o.email}</div>
                    </td>
                    <td className="small">{o.createdAt.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}</td>
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
