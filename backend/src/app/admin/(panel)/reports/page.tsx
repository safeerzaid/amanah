import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';

export const metadata: Metadata = { title: 'Reports' };

export default async function ReportsPage() {
  const currency = storeCurrency();
  const since = new Date();
  since.setMonth(since.getMonth() - 11, 1);
  since.setHours(0, 0, 0, 0);

  const [total, orders, items] = await Promise.all([
    db.order.aggregate({ where: { status: { in: ['PAID', 'SHIPPED'] } }, _sum: { subtotal: true }, _count: true }),
    db.order.findMany({ where: { status: { in: ['PAID', 'SHIPPED'] }, createdAt: { gte: since } }, select: { subtotal: true, createdAt: true } }),
    db.orderItem.findMany({ where: { order: { status: { in: ['PAID', 'SHIPPED'] } } }, select: { name: true, qty: true, unitPrice: true } }),
  ]);

  // Sales for each of the last 12 months, oldest first.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-CA', { month: 'short' }), cents: 0 };
  });
  for (const o of orders) {
    const m = months.find((x) => x.key === `${o.createdAt.getFullYear()}-${o.createdAt.getMonth()}`);
    if (m) m.cents += o.subtotal;
  }
  const peak = Math.max(1, ...months.map((m) => m.cents));

  const top = new Map<string, { qty: number; cents: number }>();
  for (const i of items) {
    const row = top.get(i.name) ?? { qty: 0, cents: 0 };
    row.qty += i.qty;
    row.cents += i.qty * i.unitPrice;
    top.set(i.name, row);
  }
  const best = [...top.entries()].sort((a, b) => b[1].cents - a[1].cents).slice(0, 8);

  const revenue = total._sum.subtotal ?? 0;
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Reports</h1>
          <p className="muted">Sales from paid and shipped orders.</p>
        </div>
      </div>

      <div className="tiles" data-tour="report-tiles">
        <div className="tile tile--gold">
          <span className="tile__value">{formatMoney(revenue, currency)}</span>
          <span className="tile__label">Total sales</span>
        </div>
        <div className="tile tile--ivory">
          <span className="tile__value">{total._count}</span>
          <span className="tile__label">Orders</span>
        </div>
        <div className="tile tile--white">
          <span className="tile__value">{formatMoney(total._count ? Math.round(revenue / total._count) : 0, currency)}</span>
          <span className="tile__label">Average order</span>
        </div>
      </div>

      <section className="card" data-tour="report-months">
        <div className="card__head">
          <h2>Last 12 months</h2>
        </div>
        <div className="bars" role="img" aria-label="Sales by month for the last 12 months">
          {months.map((m) => (
            <div key={m.key} className="bars__col" title={`${m.label}: ${formatMoney(m.cents, currency)}`}>
              <span className="bars__bar" style={{ height: `${(m.cents / peak) * 100}%` }} />
              <span className="bars__label">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="card" data-tour="report-best">
        <div className="card__head">
          <h2>Best sellers</h2>
        </div>
        {best.length === 0 ? (
          <p className="muted">No sales yet.</p>
        ) : (
          <ul className="list">
            {best.map(([name, r]) => (
              <li key={name}>
                <strong>{name}</strong>
                <span className="muted small">{r.qty} sold</span>
                <span className="num">{formatMoney(r.cents, currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
