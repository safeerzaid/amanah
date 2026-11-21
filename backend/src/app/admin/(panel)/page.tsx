import type { Metadata } from 'next';
import Link from 'next/link';
import { UNCATEGORISED } from '@/lib/categories';
import { db } from '@/lib/db';
import { previewUrl, storeCurrency } from '@/lib/env';
import { formatMoney } from '@/lib/money';
import { setInStock } from './actions';

export const metadata: Metadata = { title: 'Dashboard' };

const DAYS = 14;
const SOLD = { status: { in: ['PAID' as const, 'SHIPPED' as const] } };

export default async function Dashboard() {
  const currency = storeCurrency();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (DAYS - 1));

  const [toShip, awaiting, products, messages, subscribers, recent, soldOutProducts, recentSales, soldItems, featured, isNew, uncategorised] = await Promise.all([
    db.order.count({ where: { status: 'PAID' } }),
    db.order.count({ where: { status: 'PENDING' } }),
    db.product.count(),
    db.contactMessage.count(),
    db.newsletterSubscriber.count(),
    db.order.findMany({ where: SOLD, orderBy: { createdAt: 'desc' }, take: 5 }),
    db.product.findMany({
      where: { inStock: false },
      select: { id: true, name: true, images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 } },
      orderBy: { name: 'asc' },
    }),
    db.order.findMany({ where: { ...SOLD, createdAt: { gte: since } }, select: { subtotal: true, createdAt: true } }),
    db.orderItem.findMany({ where: { order: SOLD }, select: { productId: true, name: true, qty: true, unitPrice: true } }),
    db.product.count({ where: { featured: true } }),
    db.product.count({ where: { isNew: true } }),
    db.product.count({ where: { category: UNCATEGORISED } }),
  ]);

  // Sales per day for the last 14 days, oldest first.
  const days = Array.from({ length: DAYS }, (_, i) => {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    return { date: d, cents: 0, orders: 0 };
  });
  for (const o of recentSales) {
    const day = days.find((d) => d.date.toDateString() === o.createdAt.toDateString());
    if (day) {
      day.cents += o.subtotal;
      day.orders += 1;
    }
  }
  const periodTotal = days.reduce((sum, d) => sum + d.cents, 0);
  const periodOrders = days.reduce((sum, d) => sum + d.orders, 0);
  const peak = Math.max(1, ...days.map((d) => d.cents));
  const dayLabel = (d: Date) => d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

  // Best sellers: products by money taken across all paid and shipped orders.
  const byProduct = new Map<string, { name: string; qty: number; cents: number }>();
  for (const i of soldItems) {
    const row = byProduct.get(i.productId) ?? { name: i.name, qty: 0, cents: 0 };
    row.qty += i.qty;
    row.cents += i.qty * i.unitPrice;
    byProduct.set(i.productId, row);
  }
  const best = [...byProduct.entries()].sort((a, b) => b[1].cents - a[1].cents).slice(0, 5);
  const bestPeak = Math.max(1, ...best.map(([, r]) => r.cents));

  const soldOut = soldOutProducts.length;
  const tiles = [
    { href: '/admin/orders?status=PAID', tone: 'gold', value: toShip, label: 'Orders to ship' },
    { href: '/admin/orders?status=PENDING', tone: 'rose', value: awaiting, label: 'Awaiting payment' },
    { href: '/admin/products', tone: 'ivory', value: products, label: 'Products', note: soldOut ? `${soldOut} sold out` : 'All in stock' },
    { href: '/admin/messages', tone: 'white', value: messages, label: 'Enquiries', note: `${subscribers} newsletter sign-up${subscribers === 1 ? '' : 's'}` },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">What needs your attention today.</p>
        </div>
        <Link className="btn" href="/admin/products/new" data-tour="add-product">
          Add product
        </Link>
      </div>

      <div className="tiles" data-tour="dash-tiles">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className={`tile tile--${t.tone}`}>
            <span className="tile__value">{t.value}</span>
            <span className="tile__label">{t.label}</span>
            {t.note && <span className="tile__note">{t.note}</span>}
          </Link>
        ))}
      </div>

      <div className="dash-grid">
        {/* Sales, last 14 days */}
        <section className="card dash-sales" data-tour="dash-sales">
          <div className="card__head">
            <h2>Sales · last {DAYS} days</h2>
            <Link href="/admin/reports">Reports</Link>
          </div>
          <p className="dash-sales__total">
            {formatMoney(periodTotal, currency)}
            <span className="muted small">
              {' '}
              from {periodOrders} {periodOrders === 1 ? 'order' : 'orders'}
            </span>
          </p>
          <div
            className="dchart"
            role="img"
            aria-label={`Sales by day for the last ${DAYS} days. Total ${formatMoney(periodTotal, currency)}.${
              periodTotal ? ` Best day ${dayLabel(days.find((d) => d.cents === peak)!.date)}.` : ''
            }`}
          >
            {days.map((d, i) => (
              <div key={i} className="dchart__col" tabIndex={d.cents ? 0 : -1}>
                <span className="dchart__bar" style={{ height: `${(d.cents / peak) * 100}%` }} />
                <span className="dchart__tip" role="tooltip">
                  <strong>{formatMoney(d.cents, currency)}</strong>
                  {dayLabel(d.date)} · {d.orders} {d.orders === 1 ? 'order' : 'orders'}
                </span>
              </div>
            ))}
            {periodTotal === 0 && <p className="dchart__empty">No sales in the last {DAYS} days yet</p>}
          </div>
          <div className="dchart__axis" aria-hidden="true">
            <span>{dayLabel(days[0].date)}</span>
            <span>{dayLabel(days[Math.floor(DAYS / 2)].date)}</span>
            <span>Today</span>
          </div>
        </section>

        {/* Stock alert */}
        <section className={`card dash-stock${soldOut ? ' dash-stock--alert' : ''}`} data-tour="dash-stock">
          <div className="card__head">
            <h2>Stock</h2>
            <Link href="/admin/inventory">Inventory</Link>
          </div>
          <div className="dash-stock__meter" aria-label={`${products - soldOut} of ${products} products in stock`}>
            <div className="dash-stock__meter-top">
              <span className="dash-stock__big">{products - soldOut}</span>
              <span className="muted small">of {products} in stock</span>
            </div>
            <span className="dash-best__track">
              <span style={{ width: `${products ? ((products - soldOut) / products) * 100 : 0}%` }} />
            </span>
          </div>

          {soldOut === 0 ? (
            <p className="dash-stock__ok">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
              All products are in stock
            </p>
          ) : (
            <>
              <p className="dash-stock__warn" role="alert">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3.5 21.5 20h-19zM12 10v4.5M12 17.2v.3" />
                </svg>
                {soldOut} {soldOut === 1 ? 'product is' : 'products are'} sold out
              </p>
              <ul className="dash-stock__list">
                {soldOutProducts.map((p) => (
                  <li key={p.id}>
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="cat-prod__thumb" src={previewUrl(p.images[0].url)} alt="" />
                    ) : (
                      <span className="cat-prod__thumb" />
                    )}
                    <Link href={`/admin/products/${p.id}`} className="cat-prod__name">
                      {p.name}
                    </Link>
                    <form action={setInStock.bind(null, p.id, true)}>
                      <button className="btn btn--ghost btn--sm">Mark in stock</button>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}

          <dl className="dash-facts">
            <div>
              <dt>Sold out</dt>
              <dd>{soldOut}</dd>
            </div>
            <div>
              <dt>Featured</dt>
              <dd>{featured}</dd>
            </div>
            <div>
              <dt>Marked new</dt>
              <dd>{isNew}</dd>
            </div>
            <div>
              <dt>No category</dt>
              <dd>{uncategorised ? <Link href="/admin/products?category=none">{uncategorised}</Link> : 0}</dd>
            </div>
          </dl>
        </section>

        {/* Best sellers */}
        <section className="card">
          <div className="card__head">
            <h2>Best sellers</h2>
          </div>
          {best.length === 0 ? (
            <p className="muted">No sales yet. Your top products will appear here.</p>
          ) : (
            <ol className="dash-best">
              {best.map(([id, r]) => (
                <li key={id}>
                  <div className="dash-best__top">
                    <Link href={`/admin/products/${id}`}>{r.name}</Link>
                    <span>
                      {formatMoney(r.cents, currency)} <span className="muted small">· {r.qty} sold</span>
                    </span>
                  </div>
                  <span className="dash-best__track" aria-hidden="true">
                    <span style={{ width: `${(r.cents / bestPeak) * 100}%` }} />
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Recent paid orders */}
        <section className="card">
          <div className="card__head">
            <h2>Recent paid orders</h2>
            <Link href="/admin/orders?status=ALL">View all</Link>
          </div>
          {recent.length === 0 ? (
            <p className="muted">No paid orders yet. They appear here once a customer completes checkout.</p>
          ) : (
            <ul className="list">
              {recent.map((o) => {
                const c = o.customer as Record<string, string>;
                return (
                  <li key={o.id}>
                    <Link href={`/admin/orders/${o.id}`}>
                      <strong>
                        {c.firstName} {c.lastName}
                      </strong>
                      <span className="muted small">{o.createdAt.toLocaleDateString('en-CA', { dateStyle: 'medium' })}</span>
                    </Link>
                    <span className={`badge badge--${o.status}`}>{o.status.toLowerCase()}</span>
                    <span className="num">{formatMoney(o.subtotal, o.currency)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
